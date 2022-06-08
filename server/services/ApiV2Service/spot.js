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

spot.get('/pairs', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network = req.app.get('network')

  const markets = (await Market.find({ chain: network.name }).select('base_token quote_token'))
    .map(i => {
      const base = i.quote_token.str.replace('@', '-')
      const target = i.base_token.str.replace('@', '-')

      return {
        ticker_id: base + '_' + target,
        base,
        target
      }
    })

  res.json(markets)
})

// TODO Route for single ticker
spot.get('/tickers', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network = req.app.get('network')

  const markets = (await Market.find({ chain: network.name })
    .select('last_price bid ask volume24 high24 low24 base_token quote_token'))
    .map(i => {
      const base = i.quote_token.str.replace('@', '-')
      const target = i.base_token.str.replace('@', '-')

      return {
        ticker_id: base + '_' + target,
        base_currency: base,
        target_currency: target,
        last_price: i.last_price,
        base_volume: i.volume24 / i.last_price,
        target_volume: i.volume24,
        bid: i.bid,
        ask: i.ask,
        high: i.high24,
        low: i.low24
      }
    })

  res.json(markets.slice(1))
})

spot.get('/orderbook', tickerHandler, depthHandler, async (req, res) => {
  const network = req.app.get('network')
  const redisClient = req.app.get('redisClient')

  const { depth, ticker_id } = req.query

  const market = await Market.findOne({ ticker_id: normalizeTickerId(ticker_id), chain: network.name })
  if (!market) return res.status(404).send(`Market with id ${ticker_id} not found or closed :(`)

  const bids = (JSON.parse(await redisClient.get(`orderbook_${network.name}_buy_${market.id}`)) || []).slice(0, depth)
  const asks = (JSON.parse(await redisClient.get(`orderbook_${network.name}_sell_${market.id}`)) || []).slice(0, depth)

  return res.json({
    ticker_id,
    bids: bids.map(b => [write_decimal(b[0], 8), write_decimal(b[1][1], market.base_token.symbol.precision)]),
    asks: asks.map(a => [write_decimal(a[0], 8), write_decimal(a[1][1], market.quote_token.symbol.precision)])
  })
})

spot.get('/historical_trades/:ticker_id', tickerHandler, cacheSeconds(1, (req, res) => {
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

    if (start_time) q.time.$gte = new Date(start_time)
    if (end_time) q.time.$gte = new Date(end_time)
  }

  const matches = await Match.find(q)
    .select('_id price time bid ask unit_price type trx_id')
    .sort({ time: -1 })
    .limit(limit)

  res.json(matches.map(m => {
    return {
      trade_id: m._id,
      price: m.unit_price,
      base_volume: m.type == 'buymatch' ? m.ask : m.bid,
      target_volume: m.type == 'buymatch' ? m.bid : m.ask,
      time: m.time,
      type: m.type == 'buymatch' ? 'buy' : 'sell'
    }
  }))
})
