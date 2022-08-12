import { Router } from 'express'
import { cacheSeconds } from 'route-cache'
import { write_decimal } from 'eos-common'

import { Bar, Match, Market, PoolChartPoint, PoolPair } from '../../models'
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

function numTickerHandler(req, res, next) {
  const ticker_id = req.query.ticker_id || req.params.ticker_id
  if (!ticker_id.match(/^\d+$/))
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
      const quote = i.base_token.str.replace('@', '-')

      return {
        ticker_id: base + '_' + quote,
        base,
        target: quote
      }
    })

  res.json(markets)
})

spot.get('/tickers', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network = req.app.get('network')

  const markets = await Market.find({ chain: network.name }, { _id: 0 }).select('last_price ask bid high24 low24 base_volume quote_volume base_token quote_token ticker_id id')
  //res.json(markets)
  res.json(markets.map(m => {
    return {
      last_price: m.last_price,
      ask: m.ask,
      bid: m.bid,
      day_high: m.high24,
      day_low: m.low24,
      base_volume: m.base_volume, //not available currently
      target_volume: m.quote_volume, //not available currently
      base_currency: m.base_token.str,
      target_currency: m.quote_token.str,
      num_id: m.id,
      ticker_id: m.ticker_id
    }
  }))
})

spot.get('/tickers/:ticker_id', tickerHandler, cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network = req.app.get('network')

  const { ticker_id } = req.params

  const market = await Market.findOne({ ticker_id, chain: network.name }).select('-_id -__v -chain').limit(1)

  if (!market) return res.status(404).send(`Ticker with id ${ticker_id} not found or closed :(`)

  res.json(
    {
      last_price: market.last_price,
      ask: market.ask,
      bid: market.bid,
      day_high: market.high24,
      day_low: market.low24,
      base_volume: market.base_volume, //not available currently
      target_volume: market.quote_volume, //not available currently
      base_currency: market.base_token.str,
      target_currency: market.quote_token.str,
      num_id: market.id,
      ticker_id: market.ticker_id
    }
  )
})

// add different ticker handler for this request
spot.get('/num_tickers/:ticker_id', numTickerHandler, cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network = req.app.get('network')

  const { ticker_id } = req.params

  const market = await Market.findOne({ id: ticker_id, chain: network.name }).select('-_id -__v -chain').limit(1)

  if (!market) return res.status(404).send(`Ticker with id ${ticker_id} not found or closed :(`)

  res.json(
    {
      last_price: market.last_price,
      ask: market.ask,
      bid: market.bid,
      day_high: market.high24,
      day_low: market.low24,
      base_volume: market.base_volume, //not available currently
      target_volume: market.quote_volume, //not available currently
      base_currency: market.base_token.str,
      target_currency: market.quote_token.str,
      num_id: market.id,
      ticker_id: market.ticker_id
    }
  )
})

spot.get('/orderbook', tickerHandler, depthHandler, async (req, res) => {
  const network = req.app.get('network')
  const redisClient = req.app.get('redisClient')

  const { depth, ticker_id } = req.query

  const market = await Market.findOne({ ticker_id, chain: network.name })
  if (!market) return res.status(404).send(`Market with id ${ticker_id} not found or closed :(`)

  const bids = (JSON.parse(await redisClient.get(`orderbook_${network.name}_buy_${market.id}`)) || []).slice(0, depth)
  const asks = (JSON.parse(await redisClient.get(`orderbook_${network.name}_sell_${market.id}`)) || []).slice(0, depth)

  return res.json({
    ticker_id,
    asks: asks.map(a => ['unit_price: ' + write_decimal(a[0], 8), 'order_Size: ' + write_decimal(a[1][1], market.quote_token.symbol.precision)]),
    bids: bids.map(b => ['unit_price: ' + write_decimal(b[0], 8), 'order_Size: ' + write_decimal(b[1][1], market.base_token.symbol.precision)])
  })
})

spot.get('/tickers/:ticker_id/latest_trades', tickerHandler, depthHandler, async (req, res) => {
  const network = req.app.get('network')

  const { ticker_id } = req.params
  const limit = parseInt(req.query.limit) || 200

  const market = await Market.findOne({ ticker_id, chain: network.name })
  if (!market) return res.status(404).send(`Market with id ${ticker_id} not found or closed :(`)

  const matches = await Match.find({ market: { $eq: market.id } })
    .select('_id price time bid ask unit_price type trx_id')
    .sort({ time: -1 })
    .limit(limit)

  res.json(matches.map(m => {
    return {
      base_volume: m.type == 'buymatch' ? m.ask : m.bid,
      price: m.unit_price,
      target_volume: m.type == 'buymatch' ? m.bid : m.ask,
      time: m.time.getTime(),
      type: m.type == 'buymatch' ? 'buy' : 'sell',
      trade_id: m._id,
    }
  }))
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

    if (start_time) q.time.$gte = new Date(Number(start_time))
    if (end_time) q.time.$lte = new Date(Number(end_time))
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
      time: m.time.getTime(),
      type: m.type == 'buymatch' ? 'buy' : 'sell'
    }
  }))
})

spot.get('/pools', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name + '|' + req.query.limit
}), async (req, res) => {
  const network = req.app.get('network')

  const limit = parseInt(req.query.limit) || 200

  const pools = await PoolPair.find()
    .select('_id pool1 pool2')
    .sort()
    .limit(limit)

  res.json(pools.map(m => {
    return {
      pair_id: m._id,
      pool1: m.pool1,
      pool2: m.pool2
    }
  }))
})

spot.get('/token_pools/:token_symbol', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name + '|' + req.query.limit
}), async (req, res) => {
  const limit = parseInt(req.query.limit) || 200

  const { token_symbol } = req.params

  const pools = await PoolPair.find({ $or: [{ 'pool1.symbol': token_symbol }, { 'pool2.symbol': token_symbol }] })
    .select('pair_id pool1 pool2')
    .sort()
    .limit(limit)

  res.json(pools.map(m => {
    return {
      pool_id: m.pair_id,
      pool1: m.pool1,
      pool2: m.pool2
    }
  }))
})

spot.get('/pool_charts/:pool_id', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name + '|' + req.query.limit
}), async (req, res) => {
  const network = req.app.get('network')

  const { pool_id } = req.params

  const limit = parseInt(req.query.limit) || 200

  const q = { chain: network.name, pool: { $eq: pool_id } }

  const pools = await PoolChartPoint.find(q)
    .select('_id price volume1 liquidity1 price_r volume2 liquidity2 time')
    .sort({ time: -1 })
    .limit(limit)

  res.json(pools.map(m => {
    return {
      pair_id: m._id,
      price: m.price,
      volume1: m.volume1,
      liquidity1: m.liquidity1,
      price_r: m.price_r,
      volume2: m.volume2,
      liquidity2: m.liquidity2,
      time: m.time
    }
  }))
})
