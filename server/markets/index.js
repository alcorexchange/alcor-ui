import { performance } from 'perf_hooks'

import { Router } from 'express'
import fetch from 'node-fetch'

import { JsonRpc } from 'eosjs'

import { cache } from '../index'
import { parseAsset, parseExtendedAsset } from '../../utils'
import { Match } from '../models'
import { updater, getMarketStats } from './history'
import { getCharts } from './charts'

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

  const matches = await Match.find({ chain: network.name, market: market_id })
    .select('time bid ask unit_price type trx_id')
    .sort({ time: -1 })
    .limit(200)

  res.json(matches)
})

markets.get('/:market_id/charts', async (req, res) => {
  const network = req.app.get('network')
  const { market_id } = req.params
  const market = await getMarket(network, market_id)

  if (!market) {
    res.status(404).send(`Market with id ${market_id} not found or closed :(`)
  }

  const { from, to, resolution } = req.query
  if (!resolution) return res.status(404).send('Incorrect resolution..')

  //const t0 = performance.now()
  const charts = await getCharts(network.name, parseInt(market_id), from, to, resolution)
  //const t1 = performance.now()
  // Charts generate/cache debug
  //console.log('Call to filter for charts took ' + (t1 - t0) + ' ms.', 'market: ', market_id, 'resolution: ', resolution, ',', 'from: ', from, 'to: ', to)

  res.json(charts)
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
