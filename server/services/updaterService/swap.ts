import { createClient } from 'redis'

import { SwapPool, Swap } from '../../models'
import { onSwapAction } from '../swapV2Service'

const ONEDAY = 60 * 60 * 24 * 1000
const WEEK = ONEDAY * 7

const redisClient = createClient()


export async function newSwapAction(action, network: Network) {
  if (!redisClient.isOpen) redisClient.connect()

  console.log('newSwapAction', action.act.name)

  const { trx_id, block_time, block_num, act: { name, data } } = action

  const message = JSON.stringify({ chain: network.name, name, trx_id, block_num, block_time, data })

  await onSwapAction(message)

  // TODO Make it async after tests
  //redisClient.publish('swap_action', message)
}

export async function getFieldSumFrom(field, date, pool, chain) {
  const volume: { total_volume: number }[] = await Swap.aggregate([
    { $match: { chain, pool, time: { $gte: new Date(date) } } },
    { $group: { _id: '$pool', total_volume: { $sum: { $abs: `$${field}` } } } }
  ])

  return volume.length == 1 ? volume[0].total_volume : 0
}

// Date.now() - ONEDAY
export async function getChangeFrom(date, pool, chain) {
  const date_deal = await Swap.findOne({ chain, pool, time: { $gte: new Date(date) } }, {}, { sort: { time: 1 } })
  const last_deal = await Swap.findOne({ chain, pool }, {}, { sort: { time: -1 } })

  if (date_deal) {
    const price_before = parseInt(date_deal.sqrtPriceX64)
    const price_after = parseInt(last_deal.sqrtPriceX64)

    return (((price_after - price_before) / price_before) * 100).toFixed(2)
  } else {
    return 0
  }
}

export async function updatePoolsStats(chain) {
  console.time(`${chain} pools updated`)
  try {
    const pools = await SwapPool.find({ chain })
    const promises = pools.map((pool) => updatePoolData(pool, chain))
    await Promise.all(promises)
  } catch (error) {
    console.error('UPDATE POOL STATS ERR', chain, error)
  }
  console.timeEnd(`${chain} pools updated`)
}

async function updatePoolData(pool, chain) {
  const now = Date.now()
  const dayAgo = now - ONEDAY
  const weekAgo = now - WEEK
  const monthAgo = now - ONEDAY * 30

  try {
    const [
      volumeUSD24,
      volumeUSDWeek,
      volumeUSDMonth,
      volumeA24,
      volumeAWeek,
      volumeAMonth,
      volumeB24,
      volumeBWeek,
      volumeBMonth,
      change24,
      changeWeek,
    ] = await Promise.all([
      getFieldSumFrom('totalUSDVolume', dayAgo, pool.id, chain),
      getFieldSumFrom('totalUSDVolume', weekAgo, pool.id, chain),
      getFieldSumFrom('totalUSDVolume', monthAgo, pool.id, chain),
      getFieldSumFrom('tokenA', dayAgo, pool.id, chain),
      getFieldSumFrom('tokenA', weekAgo, pool.id, chain),
      getFieldSumFrom('tokenA', monthAgo, pool.id, chain),
      getFieldSumFrom('tokenB', dayAgo, pool.id, chain),
      getFieldSumFrom('tokenB', weekAgo, pool.id, chain),
      getFieldSumFrom('tokenB', monthAgo, pool.id, chain),
      getChangeFrom(dayAgo, pool.id, chain),
      getChangeFrom(weekAgo, pool.id, chain),
    ])

    pool.volumeUSD24 = volumeUSD24
    pool.volumeUSDWeek = volumeUSDWeek
    pool.volumeUSDMonth = volumeUSDMonth
    pool.volumeA24 = volumeA24
    pool.volumeAWeek = volumeAWeek
    pool.volumeAMonth = volumeAMonth
    pool.volumeB24 = volumeB24
    pool.volumeBWeek = volumeBWeek
    pool.volumeBMonth = volumeBMonth
    pool.change24 = change24
    pool.changeWeek = changeWeek

    await pool.save()
  } catch (error) {
    console.error(`Error updating pool ${pool.id} stats:`, error)
  }
}

// export async function getChangeFrom(date, market, chain) {
//   const date_deal = await Match.findOne({ chain, market, time: { $gte: new Date(date) } }, {}, { sort: { time: 1 } })
//   const last_deal = await Match.findOne({ chain, market }, {}, { sort: { time: -1 } })

//   if (date_deal) {
//     const price_before = date_deal.unit_price
//     const price_after = last_deal.unit_price

//     return (((price_after - price_before) / price_before) * 100).toFixed(2)
//   } else {
//     return 0
//   }
// }

// export async function getMarketStats(network, market_id) {
//   const stats = {}

//   if ('last_price' in stats) return stats

//   const last_deal = await Match.findOne({ chain: network.name, market: market_id }, {}, { sort: { time: -1 } })
//   if (last_deal) {
//     stats.last_price = parseFloat(last_deal.unit_price)
//   } else {
//     stats.last_price = 0
//   }

//   const oneMonthAgo = new Date(
//     new Date().getFullYear(),
//     new Date().getMonth() - 1,
//     new Date().getDate()
//   )

//   const [base_volume, target_volume] = await getFieldSumFrom(Date.now() - ONEDAY, market_id, network.name)

//   stats.volume24 = target_volume
//   stats.target_volume = target_volume
//   stats.base_volume = base_volume

//   stats.volumeWeek = (await getFieldSumFrom(Date.now() - WEEK, market_id, network.name))[1]
//   stats.volumeMonth = (await getFieldSumFrom(oneMonthAgo, market_id, network.name))[1]

//   stats.change24 = await getChangeFrom(Date.now() - ONEDAY, market_id, network.name)
//   stats.changeWeek = await getChangeFrom(Date.now() - WEEK, market_id, network.name)

//   // Calc 24 high/low
//   stats.high24 = stats.last_price
//   stats.low24 = stats.last_price

//   const chain = network.name
//   const market = market_id

//   const high24_deal = await Match.findOne({ chain, market, time: { $gte: new Date(Date.now() - ONEDAY) } }, {}, { sort: { unit_price: -1 } })
//   const low24_deal = await Match.findOne({ chain, market, time: { $gte: new Date(Date.now() - ONEDAY) } }, {}, { sort: { unit_price: 1 } })

//   if (high24_deal) stats.high24 = parseFloat(high24_deal.unit_price)
//   if (low24_deal) stats.low24 = parseFloat(low24_deal.unit_price)

//   return stats
// }
