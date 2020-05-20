import { Router } from 'express'
import fetch from 'node-fetch'

import { JsonRpc } from 'eosjs'

import { cache } from '../index'
import { parseAsset, parseExtendedAsset, numberWithCommas } from '../../utils'
import { updater, getDeals } from './history'
import { dayChart, getVolume, getChange } from './charts'

updater('eos', 1000 * 20)
updater('telos', 1000 * 20)
updater('wax', 1000 * 20)
updater('bos', 1000 * 20)

const ONEDAY = 60 * 60 * 24 * 1000
const WEEK = ONEDAY * 7

// TODO Обновлять маркеты в бекграунде
// раздавать из кеша


function getDayCharts(history, market) {
  const actions = history.filter(a => {
    const action_name = a.act.name

    if (['sellmatch', 'buymatch'].includes(action_name)) {
      return parseInt(a.act.data.record.market.id) == parseInt(market.id)
    } else return false
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

// will be ashync in future
function getMarketStats(network, market_id) {
  const stats = {}

  if ('last_price' in stats) return stats

  const deals = getDeals(network, market_id)

  if (deals.length > 0) {
    stats.last_price = parseInt(deals[0].unit_price)
  } else {
    stats.last_price = 0
  }

  stats.volumeWeek = getVolume(deals, WEEK)
  stats.volume24 = getVolume(deals, ONEDAY)

  stats.changeWeek = getChange(deals, WEEK)
  stats.change24 = getChange(deals, ONEDAY)

  return Promise.resolve(stats)
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

  const marketStats = await getMarketStats(network, market_id)

  if (!market) {
    res.status(404).send(`Market with id ${market_id} not found or closed :(`)
  }

  const charts = getDayCharts(history, market)

  if (charts.length > 0) {
    charts[charts.length - 1].close = marketStats.last_price
  }

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

      markets.push({ ...market, ...stats })
    }

    cache.set(`${network.name}_markets`, markets, 2)

    res.json(markets)
  } catch (e) {
    console.log('err get stats', e)
    rows.map(r => r.last_price = 0)
    res.json(rows)
  }
})

export default markets
