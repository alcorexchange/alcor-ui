import NodeCache from 'node-cache'
import { Router } from 'express'
import fetch from 'node-fetch'

import { JsonRpc } from 'eosjs'

import config from '../../config'

const cache = new NodeCache()

const { parseAsset, parseExtendedAsset } = require('../../utils')

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

async function getMarketStats(rpc, contract, market_id) {
  const stats = cache.get(`market_${market_id}_stats`) || {}

  if ('last_price' in stats) {
    return stats
  }

  const [[first_buy_order], [first_sell_order]] = await Promise.all([
    getOrders(rpc, contract, market_id, 'buy', { index_position: 2, key_type: 'i64', limit: 1 }),
    getOrders(rpc, contract, market_id, 'sell', { index_position: 2, key_type: 'i64', limit: 1 })
  ])

  if (first_buy_order) {
    stats.last_price = first_buy_order.unit_price
  } else if (first_sell_order) {
    stats.last_price = first_sell_order.unit_price
  } else {
    stats.last_price = 0
  }

  // One minute cache
  cache.set(`market_${market_id}_stats`, stats, config.MARKET_STATS_CACHE_TIME)

  return stats
}

const markets = Router()

markets.get('/', async (req, res) => {
  const network = req.app.get('network')

  const rpc = new JsonRpc(`${network.protocol}://${network.host}:${network.port}`, { fetch })

  const { rows } = await rpc.get_table_rows({
    code: network.contract,
    scope: network.contract,
    table: 'markets',
    reverse: true,
    limit: 1000
  })

  rows.map(r => r.token = r.token = parseExtendedAsset(r.token))

  try {
    const requests = rows.map(d => {
      return { market: d, stats: getMarketStats(rpc, network.contract, d.id) }
    })

    await Promise.all(requests.map(r => r.stats))

    const markets = []
    for (const req of requests) {
      const { market } = req
      const stats = await req.stats

      markets.push({ ...market, ...stats })
    }

    res.json(markets)
  } catch (e) {
    rows.map(r => r.last_price = '0.' + '0'.repeat(network.baseToken.precision) + ' ' + network.baseToken.symbol)
    res.json(rows)
  }
})

export default markets
