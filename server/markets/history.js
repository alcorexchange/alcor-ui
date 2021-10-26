
import redis from 'redis'
import { Match } from '../models'
import config from '../../config'
import { cache } from '../index'
import { parseAsset, littleEndianToDesimal } from '../../utils'
import { getVolumeFrom, getChangeFrom, markeBars, pushDeal, pushTicker } from './charts'
import { pushAccountNewMatch } from './pushes'

const ONEDAY = 60 * 60 * 24 * 1000
const WEEK = ONEDAY * 7

const redisClient = redis.createClient()

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

export async function newMatch(match, network, app) {
  const { trx_id, block_num, act: { name, data } } = match

  const io = app.get('io')
  const chain = network.name

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
      pushDeal(io, { chain, deal: m })
      pushTicker(io, { chain, market: market.id, time: m.time })
      pushAccountNewMatch(io, m)
      io.to(`orders:${network.name}.${market.id}`).emit('update_orders')
    } catch (e) {
      console.log('handle match err..', e, 'retrying...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      return await newMatch(match, network, app)
    }
  } else if (['buyreceipt', 'sellreceipt', 'cancelsell', 'cancelbuy'].includes(name)) {
    const { market_id } = 'data' in data ? data.data : data
    redisClient.publish('test', { market_id, name })
    if (!market_id) return

    io.to(`orders:${network.name}.${market_id}`).emit('update_orders')
  }
}
