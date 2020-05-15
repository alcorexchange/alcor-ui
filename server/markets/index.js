import { Router } from 'express'
import fetch from 'node-fetch'

import { JsonRpc } from 'eosjs'

import config from '../../config'
import { cache } from '../index'
import { parseAsset, parseExtendedAsset } from '../../utils'
import { updater, getDeals } from './history'
import { dayChart, getVolume } from './charts'

updater('eos', 1000 * 20)
updater('telos', 1000 * 20)
updater('wax', 1000 * 20)

const ONEDAY = 60 * 60 * 24 * 1000
const WEEK = ONEDAY * 7

// TODO Обновлять маркеты в бекграунде
// раздавать из кеша


function getDayCharts(history, market) {
  const actions = history.filter(a => {
    const action_name = a.act.name

    if (['cancelbuy', 'cancelsell'].includes(action_name)) {
      return parseInt(a.act.data.market_id) == parseInt(market.id)
    } else if (action_name == 'sellreceipt') {
      return a.act.data.sell_order.bid.split(' ')[1] == market.token.symbol.name
    } else if (action_name == 'buyreceipt') {
      return a.act.data.buy_order.ask.split(' ')[1] == market.token.symbol.name
    } else {
      return parseInt(a.act.data.record.market.id) == parseInt(market.id)
    }
  })

  try {
    return dayChart(actions)
  } catch (e) {
    console.log('graph fetch error')
    return []
  }
}

export async function getMarket(network, market_id) {
  // TODO В кеше создать список с маркетами и при запросе маркета брать оттуда либо если его нет
  // фетчить и добавлять новый
  const rpc = new JsonRpc(`${network.protocol}://${network.host}:${network.port}`, { fetch })

  const c_market = cache.get(`${network.name}_market_${market_id}`)

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

  // 10 Day Cache for market
  cache.set(`${network.name}_market_${market_id}`, market, 60 * 60 * 24 * 10)

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

async function getMarketStats(network, market_id) {
  const history = cache.get(`${network.name}_history`) || []
  const rpc = new JsonRpc(`${network.protocol}://${network.host}:${network.port}`, { fetch })

  const stats = cache.get(`${network.name}_market_${market_id}_stats`) || {}
  if ('last_price' in stats) return stats

  const key_type = network.name == 'wax' ? 'i128' : 'i64' // FIXME After update mainnet contract
  const [[first_buy_order], [first_sell_order]] = await Promise.all([
    getOrders(rpc, network.contract, market_id, 'buy', { index_position: 2, key_type, limit: 1 }),
    getOrders(rpc, network.contract, market_id, 'sell', { index_position: 2, key_type, limit: 1 })
  ])

  if (first_buy_order) {
    stats.last_price = first_buy_order.unit_price
  } else if (first_sell_order) {
    stats.last_price = first_sell_order.unit_price
  } else {
    stats.last_price = 0
  }

  const deals = getDeals(network, market_id)

  stats.volumeWeek = getVolume(deals, WEEK).toFixed(4) + ` ${network.baseToken.symbol}`
  stats.volume24 = getVolume(deals, ONEDAY).toFixed(4) + ` ${network.baseToken.symbol}`

  cache.set(`${network.name}_market_${market_id}_stats`, stats, config.MARKET_STATS_CACHE_TIME)

  return stats
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

  if (!market) {
    res.status(404).send(`Market with id ${market_id} not found or closed :(`)
  }

  const charts = getDayCharts(history, market)

  res.json(charts)
})

markets.get('/:market_id', async (req, res) => {
  const network = req.app.get('network')
  const { market_id } = req.params
  const market = await getMarket(network, market_id)

  if (!market) {
    res.status(404).send(`Market with id ${market_id} not found or closed :(`)
  }

  const stats = await getMarketStats(network, market_id)

  res.json({ ...market, ...stats })
})

markets.get('/', async (req, res) => {
  const network = req.app.get('network')
  const c_markets = cache.get(`${network.name}_markets`)

  if (c_markets) return res.json(markets)

  const rpc = new JsonRpc(`${network.protocol}://${network.host}:${network.port}`, { fetch })

  const { rows } = await rpc.get_table_rows({
    code: network.contract,
    scope: network.contract,
    table: 'markets',
    reverse: true,
    limit: 1000
  })

  rows.map(r => r.token = r.token = parseExtendedAsset(r.token))

  const requests = rows.map(d => {
    return { market: d, stats: getMarketStats(network, d.id) }
  })

  try {
    await Promise.all(requests.map(r => r.stats))

    const markets = []
    for (const req of requests) {
      const { market } = req
      const stats = await req.stats

      // Короче тут сделать расчет высокго по 24
      //const charts = getDayCharts(history, market)

      markets.push({ ...market, ...stats })
    }

    cache.set(`${network.name}_markets`, markets, 3)

    res.json(markets)
  } catch (e) {
    console.log('err get stats', e)
    rows.map(r => r.last_price = 0)
    res.json(rows)
  }
})

export default markets
