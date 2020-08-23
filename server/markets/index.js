import { Router } from 'express'
import fetch from 'node-fetch'

import { JsonRpc } from 'eosjs'

import { cache } from '../index'
import { parseAsset, parseExtendedAsset } from '../../utils'
import { updater, getDeals } from './history'
import { getCharts } from './charts'

updater('eos', 1000 * 40, false)
updater('telos', 1000 * 20)
updater('wax', 1000 * 20)
updater('bos', 1000 * 20)

export async function getMarket(network, market_id) {
  const rpc = new JsonRpc(`${network.protocol}://${network.host}:${network.port}`, { fetch })

  const markets = cache.get(`${network.name}_markets`) || []
  const c_market = markets.filter(m => m.id == market_id)[0]

  if (c_market) return c_market

  const { rows: [market] } = await rpc.get_table_rows({
    code: network.contract,
    scope: network.contract,
    table: 'markets',
    lower_bound: market_id,
    limit: 1
  })

  if (market) {
    market.token = parseExtendedAsset(market.token)
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

const markets = Router()

markets.get('/:market_id/deals', (req, res) => {
  const network = req.app.get('network')
  const { market_id } = req.params

  res.json(getDeals(network, market_id))
})

markets.get('/:market_id/charts', async (req, res) => {
  const network = req.app.get('network')
  const { market_id } = req.params
  const history = cache.get(`${network.name}_history`) || []
  const market = await getMarket(network, market_id)

  //const marketStats = await getMarketStats(network, market_id)

  if (!market) {
    res.status(404).send(`Market with id ${market_id} not found or closed :(`)
  }

  const charts = getCharts(history, market, req.query)

  //if (charts.length > 0) {
  //  charts[charts.length - 1].close = marketStats.last_price / 100000000
  //}

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

export default markets
