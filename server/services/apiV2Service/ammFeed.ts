// CoinMarketCap / CoinGecko feed for the AMM side of Alcor.
//
// The spot feed (spot.js) only covers orderbook markets, so a pair that trades
// in pools alone is invisible to them. This router exposes the pools in the same
// shape, with the two fields the spec marks mandatory for a DEX: `pool_id` and
// `liquidity_in_usd`.

import { Router } from 'express'
import { cacheSeconds } from 'route-cache'

import { SwapPool, Swap } from '../../models'
import { getSwrString } from '../swrCache'
import { getScamLists } from './config'
import { cmcUcid, globalTickerId, marketUrl, parseTimeRange, parseTradesLimit } from './feed'

// Same SWR windows as the spot /tickers: both are polled once a minute.
const TICKERS_SWR_FRESH_MS = 15 * 1000
const TICKERS_SWR_STALE_MS = 5 * 60 * 1000

export const ammFeed = Router()

function tickerId(pool) {
  return `${pool.tokenA.id}_${pool.tokenB.id}`
}

function formatToken(token) {
  return {
    id: token.id,
    contract: token.contract,
    symbol: token.symbol,
    precision: token.decimals
  }
}

// Pools of one pair, in the orientation their ticker_id was built from. A pool
// holding the same two tokens the other way round is a ticker of its own.
async function findPools(chain, ticker_id) {
  const [base, target] = String(ticker_id).toLowerCase().split('_')

  return await SwapPool.find({ chain, active: true, 'tokenA.id': base, 'tokenB.id': target })
    .select('id')
    .lean()
}

function tickerIdHandler(req, res, next) {
  const ticker_id = req.query.ticker_id || req.params.ticker_id

  if (!ticker_id || String(ticker_id).match(/^.*-.*_.*-[A-Za-z0-9.]+$/) == null)
    return res.status(400).send('Invalid ticker_id, expected <symbol>-<contract>_<symbol>-<contract>')

  req.query.ticker_id = String(ticker_id).toLowerCase()
  next()
}

async function getFeedPools(req) {
  const network = req.app.get('network')

  const min_liquidity_usd = parseFloat(req.query.min_liquidity_usd) || 0

  const pools = await SwapPool.find({ chain: network.name, active: true })
    .select('id tokenA tokenB priceA volumeA24 volumeB24 volumeUSD24 tvlUSD high24 low24 fee')
    .lean()

  const liquid = pools.filter(p => (p.tvlUSD || 0) >= min_liquidity_usd)

  if (req.query.hide_scam !== 'true') return liquid

  const { scam_contracts, scam_tokens } = await getScamLists(network)

  return liquid.filter(p =>
    !scam_contracts.has(p.tokenA.contract) && !scam_contracts.has(p.tokenB.contract) &&
    !scam_tokens.has(p.tokenA.id) && !scam_tokens.has(p.tokenB.id))
}

ammFeed.get('/pairs', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const pools = await getFeedPools(req)

  res.json(pools.map(p => ({
    ticker_id: tickerId(p),
    base: formatToken(p.tokenA),
    target: formatToken(p.tokenB),
    pool_id: String(p.id)
  })))
})

ammFeed.get('/tickers', async (req, res) => {
  const network = req.app.get('network')

  const cacheKey = `amm_tickers_swr|${network.name}|${req.originalUrl}`
  const body = await getSwrString(cacheKey, async () => {
    const pools = await getFeedPools(req)

    return pools
      .sort((a, b) => (b.tvlUSD || 0) - (a.tvlUSD || 0))
      .map(p => ({
        ticker_id: tickerId(p),
        base_currency: p.tokenA.id,
        target_currency: p.tokenB.id,
        base_cmc_ucid: cmcUcid(network, p.tokenA.id),
        target_cmc_ucid: cmcUcid(network, p.tokenB.id),
        global_ticker_id: globalTickerId(network, p.tokenA.id, p.tokenB.id),
        pool_id: String(p.id),
        last_price: p.priceA,
        base_volume: p.volumeA24 || 0,
        target_volume: p.volumeB24 || 0,
        liquidity_in_usd: p.tvlUSD || 0,
        // A pool that did not trade today has no range - null, not a zero price.
        high: p.high24 || null,
        low: p.low24 || null,
        volume_usd_24h: p.volumeUSD24 || 0,
        fee_percent: p.fee / 10000,
        trade_url: marketUrl(network, 'swap', tickerId(p))
      }))
  }, TICKERS_SWR_FRESH_MS, TICKERS_SWR_STALE_MS)

  res.type('application/json').send(body)
})

// Swaps are stored signed: positive means the token went into the pool.
// So tokenA > 0 is the base being sold, tokenA < 0 is the base being bought.
function formatSwap(s, ticker_id) {
  const base_volume = Math.abs(s.tokenA)
  const target_volume = Math.abs(s.tokenB)

  return {
    trade_id: String(s.global_sequence ?? s._id),
    ticker_id,
    pool_id: String(s.pool),
    price: base_volume > 0 ? target_volume / base_volume : 0,
    base_volume,
    target_volume,
    trade_timestamp: Math.floor(s.time.getTime() / 1000),
    type: s.tokenA > 0 ? 'sell' : 'buy',
    trx_id: s.trx_id
  }
}

// Spec: the most recent `limit` trades, oldest first, `start_time`/`end_time` in seconds.
ammFeed.get('/historical_trades', tickerIdHandler, async (req, res) => {
  const network = req.app.get('network')
  const type = req.query.type as string

  if (type && !['buy', 'sell'].includes(type)) return res.status(400).send('Invalid type, expected buy or sell')

  const time = parseTimeRange(req.query)
  if (time.error) return res.status(400).send(time.error)

  const ticker_id = req.query.ticker_id as string

  const pools = await findPools(network.name, ticker_id)
  if (pools.length == 0) return res.status(404).send(`No pool for ticker ${ticker_id}`)

  const q: any = { chain: network.name, pool: { $in: pools.map(p => p.id) } }

  // A sell puts the base token into the pool, a buy takes it out.
  if (type) q.tokenA = type == 'sell' ? { $gt: 0 } : { $lt: 0 }
  if (time.range) q.time = time.range

  const swaps = await Swap.find(q)
    .select('pool trx_id global_sequence tokenA tokenB time')
    .sort({ time: -1 })
    .limit(parseTradesLimit(req.query.limit))
    .lean()

  res.json(swaps.reverse().map(s => formatSwap(s, ticker_id)))
})
