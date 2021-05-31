import { performance } from 'perf_hooks'
import { cacheSeconds } from 'route-cache'

import { Router } from 'express'
import fetch from 'node-fetch'

import { JsonRpc } from 'eosjs'

import { cache } from '../index'
import { parseAsset, parseExtendedAsset } from '../../utils'
import { Bar, Match } from '../models'
import { getMarketStats } from './history'

export async function getMarket(network, market_id) {
  const markets = cache.get(`${network.name}_markets`) || []
  const c_market = markets.filter(m => m.id == market_id)[0]

  if (c_market) return c_market

  const rpc = new JsonRpc(`${network.protocol}://${network.host}:${network.port}`, { fetch })

  const { rows: [m] } = await rpc.get_table_rows({
    code: network.contract,
    scope: network.contract,
    table: 'markets',
    lower_bound: market_id,
    limit: 1
  })

  if (m.id != market_id) {
    return null
  }

  const marketStats = await getMarketStats(network, market_id)
  const market = { ...m, ...marketStats }

  if (market) {
    market.base_token = parseExtendedAsset(market.base_token)
    market.quote_token = parseExtendedAsset(market.quote_token)
  }

  markets.push(market)
  cache.set(`${network.name}_markets`, markets, 0)

  return market
}

async function getOrders (rpc, contract, market_id, side, kwargs) {
  kwargs = { limit: 1000, ...kwargs }

  const { rows } = await rpc.get_table_rows({
    code: contract,
    scope: market_id,
    table: `${side}order`,
    limit: 1000,
    ...kwargs
  })

  return rows.map((b) => {
    b.ask = parseAsset(b.ask)
    b.bid = parseAsset(b.bid)
    return b
  })
}

export const markets = Router()

markets.get('/:market_id/deals', cacheSeconds(3, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name + '|' + req.params.market_id + '|' + req.query.limit
}), async (req, res) => {
  const network = req.app.get('network')
  const { market_id } = req.params
  const limit = req.query.limit || 200

  const matches = await Match.find({ chain: network.name, market: market_id })
    .select('_id time bid ask unit_price type trx_id')
    .sort({ time: -1, _id: 1 })
    .limit(parseInt(limit))

  res.json(matches)
})

markets.get('/:market_id/charts', async (req, res) => {
  const network = req.app.get('network')
  const { market_id } = req.params
  const market = await getMarket(network, market_id)

  if (!market) {
    res.status(404).send(`Market with id ${market_id} not found or closed :(`)
  }

  const { from, to } = req.query
  const { resolution } = req.query

  if (!resolution) return res.status(404).send('Incorrect resolution..')

  const where = { chain: network.name, timeframe: resolution.toString(), market: parseInt(market_id) }

  if (from && to) {
    where.time = {
      $gte: new Date(parseFloat(from) * 1000),
      $lte: new Date(parseFloat(to) * 1000)
    }
  }

  const charts = await Bar.aggregate([
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
  ])

  //const charts = await Bar.find(where).select('open high low close time volume')

  res.json(charts)
})

markets.get('/:market_id', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name + '|' + req.params.market_id
}), async (req, res) => {
  const network = req.app.get('network')
  const { market_id } = req.params
  const market = await getMarket(network, market_id)

  if (!market) {
    res.status(404).send(`Market with id ${market_id} not found or closed :(`)
  }

  res.json(market)
})

markets.get('/', (req, res) => {
  const network = req.app.get('network')
  const c_markets = cache.get(`${network.name}_markets`) || []

  return res.json(c_markets)
})
