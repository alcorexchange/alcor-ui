import { createClient } from 'redis'
import fetch from 'node-fetch'
import { JsonRpc } from '../../assets/libs/eosjs-jsonrpc'
import { parseExtendedAsset, littleEndianToDesimal, parseAsset } from '../../utils'
import { Match, Market } from '../models'
import config from '../../config'
import { markeBars } from './charts'

// TODO Тут от докера прокидываем
const redisClient = createClient()
redisClient.connect()

const ONEDAY = 60 * 60 * 24 * 1000
const WEEK = ONEDAY * 7

export async function newMatch(match, network) {
  const { trx_id, block_num, act: { name, data } } = match

  try {
    'data' in data
  } catch (e) {
    console.log('err to get data in action: ' + network.name, e)
    return
  }

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
      await markeBars(m)
      redisClient.publish('market_action', `${network.name}_${market.id}_${name}`)
    } catch (e) {
      console.log('handle match err..', e, 'retrying...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      return await newMatch(match, network)
    }
  } else if (['buyreceipt', 'sellreceipt', 'cancelsell', 'cancelbuy'].includes(name)) {
    const { market_id } = 'data' in data ? data.data : data
    redisClient.publish('market_action', `${network.name}_${market_id}_${name}`)
  }
}

export async function getVolumeFrom(date, market, chain) {
  const day_volume = await Match.aggregate([
    { $match: { chain, market, time: { $gte: new Date(date) } } },
    { $project: { market: 1, value: { $cond: { if: { $eq: ['$type', 'buymatch'] }, then: '$bid', else: '$ask' } } } },
    { $group: { _id: '$market', volume: { $sum: '$value' } } }
  ])

  return day_volume.length == 1 ? day_volume[0].volume : 0
}

export async function getChangeFrom(date, market, chain) {
  const date_deal = await Match.findOne({ chain, market, time: { $gte: new Date(date) } }, {}, { sort: { time: 1 } })
  const last_deal = await Match.findOne({ chain, market }, {}, { sort: { time: -1 } })

  if (date_deal) {
    const price_before = date_deal.unit_price
    const price_after = last_deal.unit_price

    return ((price_after - price_before) / price_before) * 100
  } else {
    return 0
  }
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

  const oneMonthAgo = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    new Date().getDate()
  )

  stats.volume24 = await getVolumeFrom(Date.now() - ONEDAY, market_id, network.name)
  stats.volumeWeek = await getVolumeFrom(Date.now() - WEEK, market_id, network.name)
  stats.volumeMonth = await getVolumeFrom(oneMonthAgo, market_id, network.name)

  stats.change24 = await getChangeFrom(Date.now() - ONEDAY, market_id, network.name)
  stats.changeWeek = await getChangeFrom(Date.now() - WEEK, market_id, network.name)

  return stats
}

export async function updateMarkets(network) {
  console.log('update market for ', network.name)

  const nodes = [network.protocol + '://' + network.host + ':' + network.port].concat(network.client_nodes)
  const rpc = new JsonRpc(nodes, { fetch })

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

    const markets_for_create = []
    const current_markets = await Market.distinct('id', { chain: network.name })

    for (const req of requests) {
      const { market } = req
      const stats = await req.stats

      const complete_market = { chain: network.name, ...market, ...stats }

      if (current_markets.includes(complete_market.id)) {
        // TODO проверить
        await Market.updateOne({ id: complete_market.id, chain: network.name }, complete_market)
      } else {
        markets_for_create.push(complete_market)
      }
    }

    await Market.insertMany(markets_for_create)
    console.log('Markets for', network.name, 'updated')
  } catch (e) {
    rows.map(r => r.last_price = 0)
    await Market.insertMany(rows)
    console.log('Markets for', network.name, 'updated without stats')
  }
}
