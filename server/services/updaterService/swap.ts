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

export async function updatePoolsStats(chain: string) {
  console.time(chain + ' pools updated')
  try {
    console.time(chain + ' findChain')
    const pools = await SwapPool.find({ chain })
    console.timeEnd(chain + ' findChain')

    for (const pool of pools) {
      console.time(chain + ' getSumUSDVolume')
      pool.volumeUSD24 = await getFieldSumFrom('totalUSDVolume', Date.now() - (ONEDAY), pool.id, chain)
      pool.volumeUSDWeek = await getFieldSumFrom('totalUSDVolume', Date.now() - (WEEK), pool.id, chain)
      pool.volumeUSDMonth = await getFieldSumFrom('totalUSDVolume', Date.now() - (ONEDAY * 30), pool.id, chain)
      console.timeEnd(chain + ' getSumUSDVolume')

      console.time(chain + ' getSumTokenVolume')
      pool.volumeA24 = await getFieldSumFrom('tokenA', Date.now() - (ONEDAY), pool.id, chain)
      pool.volumeAWeek = await getFieldSumFrom('tokenA', Date.now() - (WEEK), pool.id, chain)
      pool.volumeAMonth = await getFieldSumFrom('tokenA', Date.now() - (ONEDAY * 30), pool.id, chain)

      pool.volumeB24 = await getFieldSumFrom('tokenB', Date.now() - (ONEDAY), pool.id, chain)
      pool.volumeBWeek = await getFieldSumFrom('tokenB', Date.now() - (WEEK), pool.id, chain)
      pool.volumeBMonth = await getFieldSumFrom('tokenB', Date.now() - (ONEDAY * 30), pool.id, chain)
      console.timeEnd(chain + ' getSumTokenVolume')

      console.time(chain + ' getChange')
      pool.change24 = await getChangeFrom(Date.now() - ONEDAY, pool.id, chain)
      pool.changeWeek = await getChangeFrom(Date.now() - WEEK, pool.id, chain)
      console.timeEnd(chain + ' getChange')

      console.time(chain + ' save')
      await pool.save()
      console.timeEnd(chain + ' save')
    }

    console.timeEnd(chain + ' pools updated')
  } catch (e) {
    console.error('UPDATE POOL STATS ERR', chain, e)
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
