import { Router } from 'express'
import { cacheSeconds } from 'route-cache'
import { write_decimal } from 'eos-common'

import { Bar, Match, Market } from '../../models'
import { normalizeTickerId } from '../../../utils/market'

const depthHandler = (req, res, next) => {
  if (req.query.depth && isNaN(parseInt(req.query.depth))) return res.status(403).send('Invalid depth')
  req.query.depth = parseInt(req.query.depth) || 300
  next()
}

function tickerHandler(req, res, next) {
  const ticker_id = req.query.ticker_id || req.params.ticker_id

  if (!ticker_id || ticker_id.match(/.*-.*_.*-[A-Za-z0-9.]+$/) == null)
    return res.status(403).send('Invalid ticker_id')

  req.query.ticker_id = normalizeTickerId(ticker_id)
  req.params.ticker_id = normalizeTickerId(ticker_id)
  next()
}

export const spot = Router()

function formatToken(token) {
  return {
    contract: token.contract,
    symbol: token.symbol.name,
    precision: token.symbol.precision
  }
}

spot.get('/pairs', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  // TODO Filter by base/quote
  const network = req.app.get('network')

  const markets = (await Market.find({ chain: network.name }).select('base_token quote_token'))
    .map(i => {
      const base = formatToken(i.quote_token)
      const quote = formatToken(i.base_token)

      return {
        ticker_id: base.contract + '-' + base.symbol + '_' + quote.contract + '-' + quote.symbol,
        base,
        quote
      }
    })

  res.json(markets)
})

spot.get('/tickers', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network = req.app.get('network')

  const markets = await Market.find({ chain: network.name }).select('-_id -__v -chain -quote_token -base_token -changeWeek')
  res.json(markets)
})

spot.get('/tickers/:ticker_id', tickerHandler, cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network = req.app.get('network')

  const { ticker_id } = req.params

  const market = await Market.findOne({ ticker_id, chain: network.name }).select('-_id -__v -chain -quote_token -base_token')
  if (!market) return res.status(404).send(`Ticker with id ${ticker_id} not found or closed :(`)

  res.json(market)
})

spot.get('/tickers/:ticker_id/orderbook', tickerHandler, depthHandler, async (req, res) => {
  const network = req.app.get('network')
  const redisClient = req.app.get('redisClient')

  const { depth, ticker_id } = req.query

  const market = await Market.findOne({ ticker_id, chain: network.name })
  if (!market) return res.status(404).send(`Ticker ${ticker_id} not found or closed :(`)

  const bids = (JSON.parse(await redisClient.get(`orderbook_${network.name}_buy_${market.id}`)) || []).slice(0, depth)
  const asks = (JSON.parse(await redisClient.get(`orderbook_${network.name}_sell_${market.id}`)) || []).slice(0, depth)

  return res.json({
    ticker_id,
    bids: bids.map(b => [write_decimal(b[0], 8), write_decimal(b[1][1], market.base_token.symbol.precision)]),
    asks: asks.map(a => [write_decimal(a[0], 8), write_decimal(a[1][1], market.quote_token.symbol.precision)])
  })
})

spot.get('tickers/:ticker_id/latest_trades', tickerHandler, cacheSeconds(1, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name + '|' + req.params.market_id + '|' + req.query.limit
}), async (req, res) => {
  const network = req.app.get('network')
  const limit = parseInt(req.query.limit) || 300

  const { ticker_id } = req.params
  const market = await Market.findOne({ ticker_id, chain: network.name })
  if (!market) return res.status(404).send(`Market with id ${ticker_id} not found or closed :(`)

  const matches = await Match.find({ chain: network.name, market: market.id })
    .select('_id time bid ask unit_price type trx_id')
    .sort({ time: -1 })
    .limit(limit)

  res.json(matches)
})

spot.get('tickers/:ticker_id/historical_trades', tickerHandler, cacheSeconds(1, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name + '|' + req.params.market_id + '|' + req.query.limit
}), async (req, res) => {
  const network = req.app.get('network')

  const { ticker_id } = req.params
  const { type, start_time, end_time } = req.query

  const market = await Market.findOne({ ticker_id, chain: network.name })
  if (!market) return res.status(404).send(`Market with id ${ticker_id} not found or closed :(`)

  const limit = parseInt(req.query.limit) || 200

  const q = { chain: network.name, market: market.id }
  if (type) q.type = type == 'buy' ? 'buymatch' : 'sellmatch'
  if (start_time || end_time) {
    q.time = {}

    if (start_time) q.time.$gte = new Date(parseInt(start_time))
    if (end_time) q.time.$lte = new Date(parseInt(end_time))
  }

  const matches = await Match.find(q)
    .select('_id price time bid ask unit_price type trx_id')
    .sort({ time: 1 })
    .limit(limit)

  res.json(matches.map(m => {
    return {
      trade_id: m._id,
      price: m.unit_price,
      base_volume: m.type == 'buymatch' ? m.ask : m.bid,
      target_volume: m.type == 'buymatch' ? m.bid : m.ask,
      time: m.time.getTime(),
      type: m.type == 'buymatch' ? 'buy' : 'sell'
    }
  }))
})

spot.get('tickers/:ticker_id/charts', tickerHandler, async (req, res) => {
  const { ticker_id } = req.params
  const network = req.app.get('network')

  const market = await Market.findOne({ ticker_id, chain: network.name })
  if (!market) return res.status(404).send(`Ticker ${ticker_id} not found or closed :(`)

  const { from, to, resolution, limit } = req.query
  if (!resolution) return res.status(404).send('Incorrect resolution..')

  const where = { chain: network.name, timeframe: resolution.toString(), market: parseInt(market.id) }

  if (from && to) {
    where.time = {
      $gte: new Date(parseInt(from)),
      $lte: new Date(parseInt(to))
    }
  }

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
        volume: 1
      }
    }
  ]

  if (limit) q.push({ $limit: parseInt(limit) })

  const charts = await Bar.aggregate(q)

  res.json(charts)
})
