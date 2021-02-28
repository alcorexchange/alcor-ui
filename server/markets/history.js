import axios from 'axios'
import axiosRetry from 'axios-retry'
import { JsonRpc } from 'eosjs'
import fetch from 'node-fetch'

import { Match } from '../models'
import config from '../../config'
import { cache } from '../index'
import { parseAsset, littleEndianToDesimal, parseExtendedAsset } from '../../utils'
import { getVolume, getChange, markeBar, pushDeal, pushTicker } from './charts'

const ONEDAY = 60 * 60 * 24 * 1000
const WEEK = ONEDAY * 7

axiosRetry(axios, { retries: 3 })

export function getMatches(network) {
  const history = cache.get(`${network.name}_history`) || []

  return history.filter(m => ['sellmatch', 'buymatch'].includes(m.act.name))
}

export async function getMarketStats(network, market_id) {
  const stats = {}

  if ('last_price' in stats) return stats

  const last_deal = await Match.findOne({ chain: network.name, market: market_id }, {}, { sort: { time: -1 } })
  if (last_deal) {
    stats.last_price = parseFloat(last_deal.unit_price)
  } else {
    stats.last_price = 0
  }

  const day_matches = await Match.find({ chain: network.name, market: market_id, time: { $gte: Date.now() - ONEDAY } })
  const week_matches = await Match.find({ chain: network.name, market: market_id, time: { $gte: Date.now() - WEEK } })

  stats.volume24 = getVolume(day_matches)
  stats.volumeWeek = getVolume(week_matches)

  stats.change24 = getChange(day_matches)
  stats.changeWeek = getChange(week_matches)

  return stats
}

export async function updateMarkets(network) {
  console.log('update market for ', network.name)
  const rpc = new JsonRpc(`${network.protocol}://${network.host}:${network.port}`, { fetch })

  const { rows } = await rpc.get_table_rows({
    code: network.contract,
    scope: network.contract,
    table: 'markets',
    reverse: true,
    limit: 1000
  })

  rows.map(r => {
    r.base_token = parseExtendedAsset(r.base_token)
    r.quote_token = parseExtendedAsset(r.quote_token)
  })

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

    cache.set(`${network.name}_markets`, markets, 0)
  } catch (e) {
    rows.map(r => r.last_price = 0)
    cache.set(`${network.name}_markets`, rows, 0)
  }
}

export async function newMatch(match, network, app) {
  const { trx_id, block_num, act: { name, data } } = match

  const io = app.get('io')
  const chain = network.name

  if (['sellmatch', 'buymatch'].includes(name)) {
    // On new match
    const { record: { market, ask, bid, asker, bidder, unit_price } } = 'data' in data ? data.data : data
    console.log('new match', network.name, '@timestamp' in match ? match['@timestamp'] : match.block_time, 'market', market.id)

    try {
      const m = await Match.create({
        chain: network.name,
        market: parseInt(market.id),
        type: name,
        trx_id,

        unit_price: littleEndianToDesimal(unit_price) / config.PRICE_SCALE,

        ask: parseAsset(ask).prefix,
        asker,
        bid: parseAsset(bid).prefix,
        bidder,

        time: '@timestamp' in match ? match['@timestamp'] : match.block_time,
        block_num
      })
      pushDeal(io, { chain, market: market.id })

      await markeBar(m)
      pushTicker(io, { chain, market: market.id, time: m.time })
      io.to(`orders:${network.name}.${market.id}`).emit('update_orders')
    } catch (e) {
      console.log('handle match err..', e, 'retrying...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      return await newMatch(match, network, app)
    }
  } else if (['buyreceipt', 'sellreceipt', 'cancelsell', 'cancelbuy'].includes(name)) {
    const { market_id } = 'data' in data ? data.data : data
    if (!market_id) return

    io.to(`orders:${network.name}.${market_id}`).emit('update_orders')
  }
}
