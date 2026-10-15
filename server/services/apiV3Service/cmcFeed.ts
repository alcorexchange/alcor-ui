// The market feed merged by asset, for CoinMarketCap.
//
// CMC shows an exchange as a list of asset pairs (USDC/WAXP), not of pools. Here every
// ticker of the feed (feed.ts) that trades the same two assets is one market, whichever
// pool, fee tier or chain it runs on. A token CMC lists is the asset of its UCID, so a
// bridged token counts as its origin: USDC@wrap.alcor on WAX and Telos and XUSDC on XPR
// are all USDC. A token CMC does not list stays its own `<chain>:<symbol>-<contract>`.
//
// A market sums the volumes and liquidity of its pools and links to the most liquid one.

import { Router } from 'express'

import { cmcUcid } from '../apiV2Service/feed'
import {
  FEED_NETWORKS, FeedTicker, cmcSymbol, currencyId, getTickers, latestTrades, networkBySlug,
  parseDepth, parseTradesQuery, tickerBook, tickerTrades,
} from './feed'

export const cmcFeed = Router()

type Asset = { key: string, ucid: number | null, rank: number }

type Member = { ticker: FeedTicker, flip: boolean }

type CmcTicker = {
  ticker_id: string
  base_currency: string
  target_currency: string
  base_cmc_ucid: number | null
  target_cmc_ucid: number | null
  global_ticker_id: string | null
  last_price: number
  base_volume: number
  target_volume: number
  liquidity_in_usd: number
  bid?: number
  ask?: number
  high: number | null
  low: number | null
  volume_usd_24h: number
  pool_id: string
  pools: string[]
  trade_url: string
}

const ucidsOf = (pick: (network) => string[]) =>
  new Set(FEED_NETWORKS.flatMap(n => pick(n).map(id => cmcUcid(n, id))).filter(Boolean))

const STABLE_UCIDS = ucidsOf(n => n.STABLE_TOKENS)
const CHAIN_COIN_UCIDS = ucidsOf(n => [n.baseToken.id])

// Which side of a pair an asset is quoted in: stablecoins over chain coins over the rest.
function quoteRank(network, tokenId: string, ucid: number | null): number {
  if (network.STABLE_TOKENS.includes(tokenId) || STABLE_UCIDS.has(ucid)) return 2
  if (network.baseToken.id === tokenId || CHAIN_COIN_UCIDS.has(ucid)) return 1
  return 0
}

// `wax:usdc-wrap.alcor` -> USDC; a token CMC does not list keeps its feed currency id.
function assetOf(currency: string): Asset {
  const [chain, tokenId] = currency.split(':')
  const network = networkBySlug.get(chain)
  const ucid = cmcUcid(network, tokenId)

  return {
    key: cmcSymbol(network, tokenId) || currencyId(network, tokenId),
    ucid,
    rank: quoteRank(network, tokenId, ucid),
  }
}

const inverse = (x?: number | null) => (x ? 1 / x : x)

// A ticker read the other way round: base and target swapped.
function flipTicker(t: FeedTicker): FeedTicker {
  return {
    ...t,
    last_price: inverse(t.last_price),
    base_volume: t.target_volume,
    target_volume: t.base_volume,
    bid: inverse(t.ask),
    ask: inverse(t.bid),
    high: inverse(t.low),
    low: inverse(t.high),
  }
}

function flipBook({ bids, asks }: { bids: string[][], asks: string[][] }) {
  // An ask selling q base at p is a bid buying q * p of the flipped base at 1 / p.
  const flip = ([price, quantity]) => [(1 / Number(price)).toFixed(8), (Number(price) * Number(quantity)).toFixed(8)]

  return { bids: asks.map(flip), asks: bids.map(flip) }
}

const oppositeType = (type?: string) => (type ? (type === 'buy' ? 'sell' : 'buy') : type)

function flipTrade<T extends { price: number, base_volume: number, target_volume: number, type: string }>(t: T): T {
  return {
    ...t,
    price: inverse(t.price),
    base_volume: t.target_volume,
    target_volume: t.base_volume,
    type: oppositeType(t.type),
  }
}

const sum = (members: FeedTicker[], field: keyof FeedTicker) =>
  members.reduce((total, t) => total + ((t[field] as number) || 0), 0)

function mergeMarket(base: Asset, target: Asset, members: Member[]): CmcTicker {
  const tickers = members.map(m => (m.flip ? flipTicker(m.ticker) : m.ticker))
  const [lead] = tickers
  const book = tickers.find(t => t.type === 'orderbook')

  const highs = tickers.map(t => t.high).filter(x => x != null)
  const lows = tickers.map(t => t.low).filter(x => x != null)

  return {
    ticker_id: `${base.key}_${target.key}`,
    base_currency: base.key,
    target_currency: target.key,
    base_cmc_ucid: base.ucid,
    target_cmc_ucid: target.ucid,
    global_ticker_id: base.ucid && target.ucid ? `${base.key}-${target.key}` : null,
    last_price: lead.last_price,
    base_volume: sum(tickers, 'base_volume'),
    target_volume: sum(tickers, 'target_volume'),
    liquidity_in_usd: sum(tickers, 'liquidity_in_usd'),
    ...(book && { bid: book.bid, ask: book.ask }),
    high: highs.length ? Math.max(...highs) : null,
    low: lows.length ? Math.min(...lows) : null,
    volume_usd_24h: sum(tickers, 'volume_usd_24h'),
    pool_id: lead.pool_id,
    pools: tickers.map(t => t.pool_id),
    trade_url: lead.trade_url,
  }
}

type CmcMarket = { ticker: CmcTicker, members: Member[] }

// The feed's tickers come most liquid first, so each market's first member is its lead.
async function getMarkets(): Promise<CmcMarket[]> {
  const groups = new Map<string, { base: Asset, target: Asset, members: Member[] }>()

  for (const ticker of await getTickers()) {
    let [base, target] = [assetOf(ticker.base_currency), assetOf(ticker.target_currency)]

    // A pool of one asset on both sides (USDC@wrap.alcor / XUSDC) is a bridge, not a market.
    if (base.key === target.key) continue

    const flip = base.rank > target.rank || (base.rank === target.rank && base.key > target.key)
    if (flip) [base, target] = [target, base]

    const id = `${base.key}_${target.key}`
    if (!groups.has(id)) groups.set(id, { base, target, members: [] })
    groups.get(id).members.push({ ticker, flip })
  }

  return Array.from(groups.values())
    .map(({ base, target, members }) => ({ ticker: mergeMarket(base, target, members), members }))
    .sort((a, b) => b.ticker.liquidity_in_usd - a.ticker.liquidity_in_usd)
}

async function findMarket(ticker_id: any): Promise<CmcMarket | undefined> {
  const wanted = String(ticker_id || '').toLowerCase()

  return (await getMarkets()).find(m => m.ticker.ticker_id.toLowerCase() === wanted)
}

cmcFeed.get('/tickers', async (req, res) => {
  res.json((await getMarkets()).map(m => m.ticker))
})

cmcFeed.get('/pairs', async (req, res) => {
  res.json((await getMarkets()).map(({ ticker: t }) => ({
    ticker_id: t.ticker_id,
    base: t.base_currency,
    target: t.target_currency,
    pool_id: t.pool_id,
  })))
})

// The book of the market's most liquid orderbook; AMM pools have none.
cmcFeed.get('/orderbook', async (req, res) => {
  const depth = parseDepth(req.query.depth)
  if (depth.error) return res.status(400).send(depth.error)

  const market = await findMarket(req.query.ticker_id)
  if (!market) return res.status(404).send(`Ticker ${req.query.ticker_id} is not listed`)

  const member = market.members.find(m => m.ticker.type === 'orderbook')
  const book = member && await tickerBook(member.ticker, depth.perSide)
  if (!book) return res.status(404).send(`No orderbook market for ${req.query.ticker_id}`)

  res.json({
    ticker_id: market.ticker.ticker_id,
    pool_id: member.ticker.pool_id,
    timestamp: Date.now(),
    ...(member.flip ? flipBook(book) : book),
  })
})

// The trades of every pool and book of the market, on every chain, each naming its pool_id.
cmcFeed.get('/historical_trades', async (req, res) => {
  const { query, error } = parseTradesQuery(req.query)
  if (error) return res.status(400).send(error)

  const market = await findMarket(req.query.ticker_id)
  if (!market) return res.status(404).send(`Ticker ${req.query.ticker_id} is not listed`)

  const trades = await Promise.all(market.members.map(async ({ ticker, flip }) => {
    const own = await tickerTrades(ticker, flip ? { ...query, type: oppositeType(query.type) } : query)

    return own.map(t => ({ ...(flip ? flipTrade(t) : t), ticker_id: market.ticker.ticker_id }))
  }))

  res.json(latestTrades(trades.flat(), query.limit))
})
