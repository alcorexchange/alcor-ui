// One feed of every Alcor market, for aggregators: CoinGecko, CoinMarketCap.
//
// Shape: "CoinGecko Integration Ideal API Endpoints" for a DEX, which CMC accepts too.
// https://docs.google.com/document/d/1v27QFoQq1SKT3Priq3aqPgB70Xd_PnDzbOCiuoCyixw/edit
//
// /api/v2 serves the one chain its host names. This feed holds every mainnet chain,
// AMM pools and orderbook markets alike, and answers the same on any host.
// A token is `<chain>:<symbol>-<contract>`, since one contract name can live on
// several chains (USDT@wrap.alcor is on WAX, XPR and Telos).

import { Router } from 'express'

import { networks } from '../../../config'
import { Market } from '../../models'
import { getTokens } from '../../utils'
import { getSwrPayload } from '../swrCache'
import { getScamLists, hasScamToken } from '../apiV2Service/config'
import { feedPools, findSwaps, formatSwap } from '../apiV2Service/ammFeed'
import { findMatches, formatMatch, marketOrderbook } from '../apiV2Service/spot'
import { cmcUcid, globalTickerId, marketUrl, parseTimeRange, parseTradesLimit } from '../apiV2Service/feed'
import { getRedis } from '../redis'
import { getOrderbook } from '../orderbookService/start'
import { getSafeUsdPrice } from './analytics'

export const feed = Router()

const FEED_NETWORKS = ['wax', 'proton', 'eos', 'telos'].map(name => networks[name])

// A market holding less than this is dust or an abandoned listing, not a price source.
const MIN_LIQUIDITY_USD = 1000

// Orders further than this from the mid price are wishes, not liquidity.
const BOOK_BAND = 0.1

const PRICE_SCALE = 100000000

const TICKERS_SWR_FRESH_MS = 60 * 1000
const TICKERS_SWR_STALE_MS = 10 * 60 * 1000

type Kind = 'amm' | 'orderbook'

type FeedTicker = {
  ticker_id: string
  base_currency: string
  target_currency: string
  pool_id: string
  type: Kind
  chain: string
  last_price: number
  base_volume: number
  target_volume: number
  liquidity_in_usd: number
  bid?: number
  ask?: number
  high: number | null
  low: number | null
  volume_usd_24h: number
  base_cmc_ucid: number | null
  target_cmc_ucid: number | null
  global_ticker_id: string | null
  trade_url: string
}

// The public chain name: `xpr`, not the internal `proton`.
function chainSlug(network): string {
  return network.alcorSlug || network.name
}

const networkBySlug = new Map(FEED_NETWORKS.map(n => [chainSlug(n), n]))

function currencyId(network, tokenId: string): string {
  return `${chainSlug(network)}:${tokenId}`
}

function poolId(network, kind: Kind, id: number): string {
  return `${chainSlug(network)}:${kind}:${id}`
}

// Fields every ticker carries, whatever kind of market it is.
function tickerBase(network, kind: Kind, id: number, base: string, target: string) {
  return {
    ticker_id: `${currencyId(network, base)}_${currencyId(network, target)}`,
    base_currency: currencyId(network, base),
    target_currency: currencyId(network, target),
    pool_id: poolId(network, kind, id),
    type: kind,
    chain: chainSlug(network),
    base_cmc_ucid: cmcUcid(network, base),
    target_cmc_ucid: cmcUcid(network, target),
    global_ticker_id: globalTickerId(network, base, target),
  }
}

// `xpr:xusdc-xtokens_xpr:xpr-eosio.token` -> the chain both its tokens live on.
function parseTickerId(ticker_id: any): { network: any } | null {
  const [base = '', target = ''] = String(ticker_id || '').toLowerCase().split('_')
  const [baseChain, baseToken] = base.split(':')
  const [targetChain, targetToken] = target.split(':')

  const network = networkBySlug.get(baseChain)
  if (!network || baseChain !== targetChain || !baseToken || !targetToken) return null

  return { network }
}

function poolTicker(network, p): FeedTicker {
  return {
    ...tickerBase(network, 'amm', p.id, p.tokenA.id, p.tokenB.id),
    last_price: p.priceA,
    base_volume: p.volumeA24 || 0,
    target_volume: p.volumeB24 || 0,
    liquidity_in_usd: p.tvlUSD || 0,
    // A pool that did not trade today has no range - null, not a zero price.
    high: p.high24 || null,
    low: p.low24 || null,
    volume_usd_24h: p.volumeUSD24 || 0,
    trade_url: marketUrl(network, 'swap', `${p.tokenA.id}_${p.tokenB.id}`),
  }
}

// What rests on a market's book within BOOK_BAND of the mid price, in USD.
// It is valued in the target token at each order's own price, so a base token
// with a made-up price cannot inflate it.
async function bookLiquidityUsd(chain: string, m, targetUsd: number): Promise<number> {
  const mid = (m.bid + m.ask) / 2
  const basePrecision = Math.pow(10, m.quote_token.symbol.precision)

  const [buyBook, sellBook] = await Promise.all([
    getOrderbook(chain, 'buy', m.id),
    getOrderbook(chain, 'sell', m.id),
  ])

  // Rows are [unit_price, bid, ask]: a buy order asks for the base token, a sell order bids it.
  const rows = [
    ...Array.from(buyBook.values()).map((r: any) => [r[0], r[2]]),
    ...Array.from(sellBook.values()).map((r: any) => [r[0], r[1]]),
  ]

  let target = 0
  for (const [unitPrice, baseAmount] of rows) {
    const price = unitPrice / PRICE_SCALE
    if (Math.abs(price / mid - 1) > BOOK_BAND) continue

    target += (baseAmount / basePrecision) * price
  }

  return target * targetUsd
}

async function marketTicker(network, m, priceMap: Map<string, number>): Promise<FeedTicker> {
  const [base, target] = m.ticker_id.split('_')
  const targetUsd = priceMap.get(target) || 0

  return {
    ...tickerBase(network, 'orderbook', m.id, base, target),
    last_price: m.last_price,
    base_volume: m.base_volume || 0,
    target_volume: m.target_volume || 0,
    liquidity_in_usd: await bookLiquidityUsd(network.name, m, targetUsd),
    bid: m.bid,
    ask: m.ask,
    high: m.high24 || null,
    low: m.low24 || null,
    volume_usd_24h: (m.target_volume || 0) * targetUsd,
    trade_url: marketUrl(network, 'spot', m.ticker_id),
  }
}

async function networkTickers(network): Promise<FeedTicker[]> {
  const [tokens, scamLists, pools, markets] = await Promise.all([
    getTokens(network.name),
    getScamLists(network),
    feedPools(network, { minLiquidityUsd: MIN_LIQUIDITY_USD, hideScam: true }),
    Market.find({ chain: network.name, bid: { $gt: 0 }, ask: { $gt: 0 } }).lean(),
  ])

  const priceMap = new Map<string, number>((tokens || []).map(t => [t.id, getSafeUsdPrice(t)]))

  // A book is priced through its target token, and only an uncrossed one has a mid price.
  const priced = markets.filter((m: any) =>
    !hasScamToken(scamLists, [m.base_token, m.quote_token]) &&
    m.ask > m.bid &&
    (priceMap.get(m.ticker_id.split('_')[1]) || 0) > 0)

  const marketTickers = await Promise.all(priced.map(m => marketTicker(network, m, priceMap)))

  return [
    ...pools.map(p => poolTicker(network, p)),
    ...marketTickers.filter(t => t.liquidity_in_usd >= MIN_LIQUIDITY_USD),
  ]
}

// Most liquid first. The markets collection holds a few duplicated documents of
// one market, so a pool_id is kept once, with its most liquid reading.
async function buildTickers(): Promise<FeedTicker[]> {
  const perNetwork = await Promise.all(FEED_NETWORKS.map(networkTickers))

  const seen = new Set<string>()

  return perNetwork.flat()
    .sort((a, b) => b.liquidity_in_usd - a.liquidity_in_usd)
    .filter(t => !seen.has(t.pool_id) && seen.add(t.pool_id))
}

function getTickers(): Promise<FeedTicker[]> {
  return getSwrPayload('feed_v3_tickers', buildTickers, TICKERS_SWR_FRESH_MS, TICKERS_SWR_STALE_MS)
}

// The listed markets of a ticker_id: every AMM pool of the pair, and its orderbook market.
async function findListed(ticker_id: any) {
  const parsed = parseTickerId(ticker_id)
  if (!parsed) return null

  const tickers = (await getTickers()).filter(t => t.ticker_id === String(ticker_id).toLowerCase())

  const idOf = (t: FeedTicker) => parseInt(t.pool_id.split(':')[2])

  return {
    ...parsed,
    poolIds: tickers.filter(t => t.type === 'amm').map(idOf),
    marketIds: tickers.filter(t => t.type === 'orderbook').map(idOf),
  }
}

const INVALID_TICKER = 'Invalid ticker_id, expected <chain>:<symbol>-<contract>_<chain>:<symbol>-<contract>'

feed.get('/tickers', async (req, res) => {
  res.json(await getTickers())
})

feed.get('/pairs', async (req, res) => {
  const tickers = await getTickers()

  res.json(tickers.map(t => ({
    ticker_id: t.ticker_id,
    base: t.base_currency,
    target: t.target_currency,
    pool_id: t.pool_id,
  })))
})

// Spec: `depth` counts both sides, 0 is the full book. AMM pools have no book.
feed.get('/orderbook', async (req, res) => {
  const listed = await findListed(req.query.ticker_id)
  if (!listed) return res.status(400).send(INVALID_TICKER)
  if (listed.marketIds.length == 0) return res.status(404).send(`No orderbook market for ${req.query.ticker_id}`)

  const depth = parseInt(req.query.depth as string) || 0
  if (depth < 0) return res.status(400).send('Invalid depth')

  const market = await Market.findOne({ chain: listed.network.name, id: listed.marketIds[0] }).lean()
  if (!market) return res.status(404).send(`No orderbook market for ${req.query.ticker_id}`)

  const perSide = depth > 0 ? Math.ceil(depth / 2) : undefined
  const { bids, asks } = await marketOrderbook(getRedis(), listed.network.name, market, perSide)

  res.json({
    ticker_id: String(req.query.ticker_id).toLowerCase(),
    pool_id: poolId(listed.network, 'orderbook', market.id),
    timestamp: Date.now(),
    bids,
    asks,
  })
})

// Spec: the most recent `limit` trades, oldest first, `start_time`/`end_time` in seconds.
// Pool swaps and orderbook matches of the pair are merged, each naming its pool_id.
feed.get('/historical_trades', async (req, res) => {
  const type = req.query.type as string
  if (type && !['buy', 'sell'].includes(type)) return res.status(400).send('Invalid type, expected buy or sell')

  const time = parseTimeRange(req.query)
  if (time.error) return res.status(400).send(time.error)

  const listed = await findListed(req.query.ticker_id)
  if (!listed) return res.status(400).send(INVALID_TICKER)
  if (listed.poolIds.length + listed.marketIds.length == 0) return res.status(404).send(`Ticker ${req.query.ticker_id} is not listed`)

  const { network, poolIds, marketIds } = listed
  const ticker_id = String(req.query.ticker_id).toLowerCase()
  const slug = chainSlug(network)
  const query = { type, range: time.range, limit: parseTradesLimit(req.query.limit) }

  const [swaps, ...matchesByMarket] = await Promise.all([
    poolIds.length ? findSwaps(network.name, poolIds, query) : [],
    ...marketIds.map(id => findMatches(network.name, id, query)),
  ])

  const trades = [
    ...swaps.map(s => ({
      ...formatSwap(s, ticker_id),
      trade_id: `${slug}:swap:${s.global_sequence ?? s._id}`,
      pool_id: poolId(network, 'amm', s.pool),
    })),
    ...matchesByMarket.flatMap((matches, i) => matches.map(m => ({
      ...formatMatch(m),
      ticker_id,
      trade_id: `${slug}:match:${m._id}`,
      pool_id: poolId(network, 'orderbook', marketIds[i]),
    }))),
  ]

  const latest = trades
    .sort((a, b) => b.trade_timestamp - a.trade_timestamp)
    .slice(0, query.limit)

  res.json(latest.reverse())
})
