import { performance } from 'perf_hooks'

import { Router } from 'express'
import fetch from 'node-fetch'

import { JsonRpc } from 'eosjs'

import { cache } from '../index'
import { parseAsset, parseExtendedAsset } from '../../utils'
import { Match, Bar } from '../models'
import { updater, getMarketStats } from './history'
import { makeCharts } from './charts'

const resolutions = {
  1: 1,
  5: 5,
  15: 15,
  30: 30,
  60: 60,
  240: 60 * 4,
  '1D': 60 * 24,
  '1W': 60 * 24 * 7,
  '1M': 60 * 24 * 30
}

export function startUpdaters(app) {
  if (process.env.NETWORK) {
    updater(process.env.NETWORK, app, process.env.NETWORK == 'wax') // Update by node, not hyperion
  } else {
    updater('eos', app, false) // Update by node, not hyperion
    updater('bos', app, false) // Update by node, not hyperion
    updater('proton', app)
    updater('telos', app)
    updater('wax', app)

    if (process.env.npm_lifecycle_event == 'dev') {
      // Jungle for dev
      updater('jungle', app, false)
    }
  }
}

export async function getMarket(network, market_id) {
  const rpc = new JsonRpc(`${network.protocol}://${network.host}:${network.port}`, { fetch })

  const markets = cache.get(`${network.name}_markets`) || []
  const c_market = markets.filter(m => m.id == market_id)[0]

  if (c_market) return c_market

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

markets.get('/:market_id/deals', async (req, res) => {
  const network = req.app.get('network')
  const { market_id } = req.params

  const matches = await Match.find({ chain: network.name, market: market_id }).sort({ time: -1 }).limit(200)

  // TODO Вынести на клиент или парсить в базу
  res.json(matches)
})

markets.get('/:market_id/charts', async (req, res) => {
  const network = req.app.get('network')
  const { market_id } = req.params
  const market = await getMarket(network, market_id)

  //const marketStats = await getMarketStats(network, market_id)

  if (!market) {
    res.status(404).send(`Market with id ${market_id} not found or closed :(`)
  }

  const { resolution, from, to } = req.query

  const where = {
    chain: network.name,
    market: parseInt(market_id)
  }

  if (from && to) {
    where.time = {
      $gte: new Date(parseFloat(from) * 1000),
      $lte: new Date(parseFloat(to) * 1000)
    }
  }

  const _resolution = resolutions[resolution]

  if (!_resolution) return res.status(404).send('Incorrect resolution..')

  console.log(where, _resolution)
  const t0 = performance.now()
  const bars = await Bar.aggregate([
    { $match: where },
    {
      $group:
      {
        _id: {
          $toDate: {
            $subtract: [
              { $toLong: '$time' },
              { $mod: [{ $toLong: '$time' }, _resolution * 60 * 1000] }
            ]
          }
        },
        Open: { $first: '$open' },
        High: { $max: '$high' },
        Low: { $min: '$low' },
        Close: { $last: '$close' },
        Volume: { $sum: '$volume' }
      }
    },
    { $sort: { _id: -1 } }
  ]).allowDiskUse(true)

  const t1 = performance.now()
  console.log('Call to filter for charts took ' + (t1 - t0) + ' milliseconds.')

  //if (charts.length > 0) {
  //  charts[charts.length - 1].close = marketStats.last_price / 100000000
  //}
  const t3 = performance.now()
  const new_bars = bars.map(b => [b._id / 1000, b.Open, b.High, b.Low, b.Close, b.Volume])

  for (let i = 0; i < new_bars.length; i++) {
    const curr = new_bars[i]
    const next = new_bars[i + 1]

    if (!next) {
      break
    }

    if (curr.close != next.open) {
      curr.close = next.open
    }
  }

  const t4 = performance.now()
  console.log('Call to new_bars' + (t4 - t3) + ' milliseconds.')

  console.log('bars lengs', bars.length)
  res.json(new_bars)
})

markets.get('/:market_id', async (req, res) => {
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
