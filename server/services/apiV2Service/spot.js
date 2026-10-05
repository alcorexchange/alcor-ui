import { Router } from 'express'
import { cacheSeconds } from 'route-cache'
import { write_decimal } from 'eos-common'

import { resolutions, normalizeResolution } from '../updaterService/charts'
import { SwapPool, Bar, Match, Market } from '../../models'
import { getTokens } from '../../utils'
import { getSwrString } from '../swrCache'
import { getScamLists } from './config'
import { cmcUcid, globalTickerId, marketUrl, parseTimeRange, parseTradesLimit } from './feed'

// SWR windows for /tickers: serve a process-local serialized string for
// FRESH_MS, then serve stale + refresh in background up to STALE_MS.
const TICKERS_SWR_FRESH_MS = 15 * 1000
const TICKERS_SWR_STALE_MS = 5 * 60 * 1000

// Hard ceiling on /charts, including the gap-filling candles.
const MAX_BARS = 5000

const depthHandler = (req, res, next) => {
  if (req.query.depth && isNaN(parseInt(req.query.depth))) return res.status(403).send('Invalid depth')
  req.query.depth = parseInt(req.query.depth) || 300
  next()
}

function tickerHandler(req, res, next) {
  const ticker_id = req.query.ticker_id || req.params.ticker_id

  if (!ticker_id || ticker_id.match(/.*-.*_.*-[A-Za-z0-9.]+$/) == null)
    // TODO Fixme не понятная ошибка
    return res.status(403).send('Invalid ticker_id')

  req.query.ticker_id = ticker_id.toLowerCase()
  req.params.ticker_id = ticker_id.toLowerCase()
  next()
}

export const spot = Router()

function formatToken(token) {
  return {
    id: token.id,
    contract: token.contract,
    symbol: token.symbol.name,
    precision: token.symbol.precision
  }
}

function getPairKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

function formatTicker(m, network) {
  const [base, target] = m.ticker_id.split('_')

  m.market_id = m.id
  m.target_currency = target.toLowerCase()
  m.base_currency = base.toLowerCase()

  m.target_cmc_ucid = cmcUcid(network, m.target_currency)
  m.base_cmc_ucid = cmcUcid(network, m.base_currency)

  // Spec names: an orderbook market is this DEX's "pool", high/low are the 24h range.
  // A market that never traded has no range - null, not a zero price.
  m.pool_id = String(m.id)
  m.high = m.high24 || null
  m.low = m.low24 || null
  m.trade_url = marketUrl(network, 'spot', m.ticker_id)

  delete m.id

  m.global_ticker_id = globalTickerId(network, m.base_currency, m.target_currency)

  return getPairKey(m.base_currency, m.target_currency)
}

spot.get('/pairs', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  // TODO Filter by base/quote
  const network = req.app.get('network')
  const { base, target } = req.query

  const q = { chain: network.name }

  if (base) q['quote_token.id'] = base.toLowerCase()
  if (target) q['base_token.id'] = target.toLowerCase()

  const markets = await Market.find(q).select('base_token quote_token ticker_id').lean()

  const pairs = []
  markets.map(m => {
    const base = formatToken(m.quote_token)
    const target = formatToken(m.base_token)

    pairs.push({ base, target, ticker_id: m.ticker_id })
  })

  res.json(pairs)
})

function formatMarket(m, market_pools = [], tokenById = new Map()) {
  m.target_amm_liquidity = 0
  m.base_amm_liquidity = 0

  let amm_volume_usd = 0

  market_pools.forEach(p => {
    if (p.tokenA.id == m.target_currency && p.tokenB.id == m.base_currency) {
      m.target_amm_liquidity += p.tokenA.quantity
      m.base_amm_liquidity += p.tokenB.quantity

      m.target_volume += p.volumeA24
      m.base_volume += p.volumeB24
    }

    if (p.tokenA.id == m.base_currency && p.tokenB.id == m.target_currency) {
      m.base_amm_liquidity += p.tokenA.quantity
      m.target_amm_liquidity += p.tokenB.quantity

      m.base_volume += p.volumeA24
      m.target_volume += p.volumeB24
    }

    amm_volume_usd += p.volumeUSD24 || 0
  })

  // Calculate 24h volume in USD (use target token as it's usually the system token with reliable USD price)
  const target_token = tokenById.get(m.target_currency)
  const spot_volume_usd = m.target_volume * (target_token?.usd_price || 0)

  m.volumeUSD24 = spot_volume_usd + amm_volume_usd
}

// Tickers with merged volumes from pools
spot.get('/tickers', async (req, res) => {
  const network = req.app.get('network')
  const hide_scam = req.query.hide_scam === 'true'

  const cacheKey = `spot_tickers_swr|${network.name}|${req.originalUrl}`
  const body = await getSwrString(cacheKey, async () => {
    const [tokens, pools, rawMarkets] = await Promise.all([
      getTokens(network.name),
      SwapPool.find({ chain: network.name })
        .select('tokenA.id tokenA.quantity tokenB.id tokenB.quantity volumeA24 volumeB24 volumeUSD24')
        .lean(),
      Market.find({ chain: network.name })
        .select('-_id -__v -chain -quote_token -base_token -changeWeek -volume24 -volumeMonth -volumeWeek')
        .lean(),
    ])

    let markets = rawMarkets

    // Depth 2/-2%
    // > baseTokenLiquidity * (Math.sqrt(1 / 1.02) - 1)
    // > baseTokenLiquidity * (1 - Math.sqrt(1 / 0.98))

    if (hide_scam) {
      const { scam_contracts, scam_tokens } = await getScamLists(network)
      markets = markets.filter(m => {
        const [baseCurrency, targetCurrency] = String(m.ticker_id || '').toLowerCase().split('_')
        const baseContract = String(baseCurrency || '').split('-')[1]
        const targetContract = String(targetCurrency || '').split('-')[1]
        return !scam_contracts.has(baseContract) &&
               !scam_contracts.has(targetContract) &&
               !scam_tokens.has(baseCurrency) &&
               !scam_tokens.has(targetCurrency)
      })
    }

    const tokenById = new Map((tokens || []).map(t => [t.id, t]))
    const poolsByPair = new Map()
    for (const p of pools) {
      const key = getPairKey(p.tokenA.id, p.tokenB.id)
      if (!poolsByPair.has(key)) poolsByPair.set(key, [])
      poolsByPair.get(key).push(p)
    }

    markets.forEach(m => {
      const pairKey = formatTicker(m, network)
      formatMarket(m, poolsByPair.get(pairKey) || [], tokenById)
    })

    return markets
  }, TICKERS_SWR_FRESH_MS, TICKERS_SWR_STALE_MS)

  res.type('application/json').send(body)
})

spot.get('/tickers/:ticker_id', tickerHandler, cacheSeconds(1, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network = req.app.get('network')

  const { ticker_id } = req.params
  const [baseCurrency, targetCurrency] = String(ticker_id).toLowerCase().split('_')
  const [pools, tokens] = await Promise.all([
    SwapPool.find({
      chain: network.name,
      $or: [
        { 'tokenA.id': targetCurrency, 'tokenB.id': baseCurrency },
        { 'tokenA.id': baseCurrency, 'tokenB.id': targetCurrency },
      ],
    })
      .select('tokenA.id tokenA.quantity tokenB.id tokenB.quantity volumeA24 volumeB24 volumeUSD24')
      .lean(),
    getTokens(network.name),
  ])
  const m = await Market.findOne({ ticker_id, chain: network.name })
    .select('-_id -__v -chain -quote_token -base_token -changeWeek -volume24 -volumeMonth -volumeWeek').lean()

  if (!m) return res.status(404).send(`Market with id ${ticker_id} not found or closed :(`)

  const tokenById = new Map((tokens || []).map(t => [t.id, t]))
  formatTicker(m, network)
  formatMarket(m, pools, tokenById)

  res.json(m)
})

spot.get('/tickers/:ticker_id/orderbook', tickerHandler, depthHandler, async (req, res) => {
  const network = req.app.get('network')
  const redisClient = req.app.get('redisClient')

  const { depth, ticker_id } = req.query

  const market = await Market.findOne({ ticker_id, chain: network.name })
  if (!market) return res.status(404).send(`Ticker ${ticker_id} not found or closed :(`)

  const _bids = (JSON.parse(await redisClient.get(`orderbook_${network.name}_buy_${market.id}`)) || []).slice(0, depth)
  const _asks = (JSON.parse(await redisClient.get(`orderbook_${network.name}_sell_${market.id}`)) || []).slice(0, depth)

  // Quantities are quoted in base_currency on both sides, so a buy order is read
  // from its `ask` (what it wants) and a sell order from its `bid` (what it offers).
  const quantity = amount => write_decimal(amount, market.quote_token.symbol.precision, false)

  const bids = _bids
    .sort((a, b) => b[0] - a[0])
    .map(b => [write_decimal(b[0], 8, false), quantity(b[1][2])])

  const asks = _asks
    .sort((a, b) => a[0] - b[0])
    .map(a => [write_decimal(a[0], 8, false), quantity(a[1][1])])

  return res.json({
    ticker_id,
    timestamp: Date.now(),
    bids,
    asks
  })
})

// Matches carry bid/ask swapped by side: the contract writes base_token into
// `bid` for a buymatch and into `ask` for a sellmatch (eostokensdex.cpp
// match_processing), while the feed always counts base_volume in base_currency.
function formatMatch(m) {
  const isBuy = m.type == 'buymatch'

  return {
    trade_id: String(m._id),
    price: m.unit_price,
    base_volume: isBuy ? m.ask : m.bid,
    target_volume: isBuy ? m.bid : m.ask,
    trade_timestamp: Math.floor(m.time.getTime() / 1000),
    type: isBuy ? 'buy' : 'sell',
    trx_id: m.trx_id
  }
}

const TRADE_FIELDS = '_id time bid ask unit_price type trx_id'

function tradesCacheKey(req, res) {
  return req.originalUrl + '|' + req.app.get('network').name
}

// Spec: the most recent `limit` trades, oldest first, `start_time`/`end_time` in seconds.
spot.get('/tickers/:ticker_id/historical_trades', tickerHandler, cacheSeconds(1, tradesCacheKey), async (req, res) => {
  const network = req.app.get('network')

  const { ticker_id } = req.params
  const { type } = req.query

  if (type && !['buy', 'sell'].includes(type)) return res.status(400).send('Invalid type, expected buy or sell')

  const time = parseTimeRange(req.query)
  if (time.error) return res.status(400).send(time.error)

  const market = await Market.findOne({ ticker_id, chain: network.name })
  if (!market) return res.status(404).send(`Market with id ${ticker_id} not found or closed :(`)

  const q = { chain: network.name, market: market.id }
  if (type) q.type = type == 'buy' ? 'buymatch' : 'sellmatch'
  if (time.range) q.time = time.range

  const matches = await Match.find(q)
    .select(TRADE_FIELDS)
    .sort({ time: -1 })
    .limit(parseTradesLimit(req.query.limit))
    .lean()

  res.json(matches.reverse().map(formatMatch))
})

// время в UTC стартовое надо
spot.get('/tickers/:ticker_id/charts', tickerHandler, async (req, res) => {
  const { ticker_id } = req.params
  const network = req.app.get('network')

  const market = await Market.findOne({ ticker_id, chain: network.name })
  if (!market) return res.status(404).send(`Ticker ${ticker_id} not found or closed :(`)

  const { from, to, resolution, limit } = req.query
  if (!resolution) return res.status(400).send('Incorrect resolution..')
  if (!from || isNaN(from)) return res.status(400).send('`from` is required, in unix milliseconds')
  if (to && isNaN(to)) return res.status(400).send('Invalid `to`, expected unix milliseconds')

  const normalizedResolution = normalizeResolution(resolution)
  const frame = resolutions[normalizedResolution] * 1000
  const alignedFrom = Math.floor(parseInt(from) / frame) * frame
  const alignedTo = to ? Math.floor(parseInt(to) / frame) * frame : null

  const where = {
    chain: network.name,
    timeframe: normalizedResolution.toString(),
    market: parseInt(market.id),
    time: { $gte: new Date(alignedFrom) },
  }

  if (alignedTo !== null) where.time.$lte = new Date(alignedTo)

  const q = [
    { $match: where },
    { $sort: { time: 1 } },
    {
      $project: {
        time: { $toLong: '$time' },
        open: 1,
        high: 1,
        low: 1,
        close: 1,
        volume: 1,
      },
    },
  ]

  q.push({ $limit: Math.min(parseInt(limit) || MAX_BARS, MAX_BARS) })

  let lastKnownPrice = null
  const charts = await Bar.aggregate(q)

  if (charts.length === 0) {
    const lastPriceQuery = await Bar.findOne({
      chain: network.name,
      market: parseInt(market.id),
      timeframe: normalizedResolution.toString(),
      time: { $lt: new Date(alignedFrom) },
    }).sort({ time: -1 })

    // Если не найдена последняя цена, отправляем пустой ответ
    if (!lastPriceQuery) return res.json([])

    lastKnownPrice = lastPriceQuery.close
  } else {
    lastKnownPrice = charts[0].close
  }

  // Заполнение пустых свечей между данными
  const filledCharts = []
  let expectedTime = alignedFrom

  charts.forEach((chart) => {
    chart.open = lastKnownPrice
    while (chart.time > expectedTime) {
      filledCharts.push({
        time: expectedTime,
        open: lastKnownPrice,
        high: lastKnownPrice,
        low: lastKnownPrice,
        close: lastKnownPrice,
        volume: 0,
      })
      expectedTime += frame
    }
    filledCharts.push(chart)
    lastKnownPrice = chart.close
    expectedTime += frame
  })

  // Добавление пустых свечей после последней полученной свечи до конца периода (до последней закрытой)
  if (alignedTo !== null) {
    const nowMs = Date.now()
    const nowAligned = Math.floor(nowMs / frame) * frame
    const lastComplete = nowAligned - frame
    const fillTo = Math.min(alignedTo, lastComplete)

    while (expectedTime <= fillTo && filledCharts.length < MAX_BARS) {
      filledCharts.push({
        time: expectedTime,
        open: lastKnownPrice,
        high: lastKnownPrice,
        low: lastKnownPrice,
        close: lastKnownPrice,
        volume: 0,
      })
      expectedTime += frame
    }
  }

  res.json(filledCharts)
})
