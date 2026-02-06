import { SwapPool, Swap } from '../../models'
import { onSwapAction, aggregatePositions } from '../swapV2Service'

const ONEDAY = 60 * 60 * 24 * 1000
const WEEK = ONEDAY * 7

export async function newSwapAction(action: any, network: any) {
  //console.log('newSwapAction', action.act.name)

  const { trx_id, block_time, block_num, receipt, act: { name, data } } = action
  const global_sequence = receipt?.global_sequence

  const message = JSON.stringify({ chain: network.name, name, trx_id, block_num, block_time, data, global_sequence })

  await onSwapAction(message)

  // TODO Make it async after tests
  //redisClient.publish('swap_action', message)
}

export async function getFieldSumFrom(field, date, pool, chain) {
  // Извлекаем документы из базы данных
  const swaps = await Swap.find({
    chain,
    pool,
    time: { $gte: new Date(date) },
  })
    .select(field)
    .lean()

  // Агрегируем данные на уровне JavaScript
  const totalVolume = swaps.reduce((sum, swap) => {
    const value = Math.abs(swap[field] || 0) // Берём абсолютное значение
    return sum + value
  }, 0)

  return totalVolume
}

// Date.now() - ONEDAY
export async function getChangeFrom(date, pool, chain) {
  const date_deal = await Swap.findOne({ chain, pool, time: { $gte: new Date(date) } }, {}, { sort: { time: 1 } })
  const last_deal = await Swap.findOne({ chain, pool }, {}, { sort: { time: -1 } })

  if (date_deal && last_deal) {
    // Use BigInt for uint128_t values to avoid precision loss
    const price_before = BigInt(date_deal.sqrtPriceX64)
    const price_after = BigInt(last_deal.sqrtPriceX64)

    // Calculate percentage change using BigInt arithmetic
    // Multiply by 10000 to preserve 2 decimal places
    const change = ((price_after - price_before) * BigInt(10000)) / price_before
    return (Number(change) / 100).toFixed(2)
  } else {
    return 0
  }
}

// Aggregate positions from per-pool storage into one key for API reads
export async function updatePositionsAggregation(chain: string) {
  try {
    await aggregatePositions(chain)
  } catch (error) {
    console.error(`[${chain}] positions aggregation error:`, error)
  }
}

export async function updatePoolsStats(chain) {
  console.time(`${chain} pools updated`)
  try {
    const now = Date.now()
    const dayAgo = now - ONEDAY
    const weekAgo = now - WEEK
    const monthAgo = now - ONEDAY * 30

    // Get all volume stats in one aggregation query
    const volumeStats = await Swap.aggregate([
      {
        $match: {
          chain,
          time: { $gte: new Date(monthAgo) } // Get all data from the furthest date
        }
      },
      {
        $facet: {
          day: [
            { $match: { time: { $gte: new Date(dayAgo) } } },
            {
              $group: {
                _id: '$pool',
                volumeUSD: { $sum: { $abs: { $ifNull: ['$totalUSDVolume', 0] } } },
                volumeA: { $sum: { $abs: { $ifNull: ['$tokenA', 0] } } },
                volumeB: { $sum: { $abs: { $ifNull: ['$tokenB', 0] } } }
              }
            }
          ],
          week: [
            { $match: { time: { $gte: new Date(weekAgo) } } },
            {
              $group: {
                _id: '$pool',
                volumeUSD: { $sum: { $abs: { $ifNull: ['$totalUSDVolume', 0] } } },
                volumeA: { $sum: { $abs: { $ifNull: ['$tokenA', 0] } } },
                volumeB: { $sum: { $abs: { $ifNull: ['$tokenB', 0] } } }
              }
            }
          ],
          month: [
            {
              $group: {
                _id: '$pool',
                volumeUSD: { $sum: { $abs: { $ifNull: ['$totalUSDVolume', 0] } } },
                volumeA: { $sum: { $abs: { $ifNull: ['$tokenA', 0] } } },
                volumeB: { $sum: { $abs: { $ifNull: ['$tokenB', 0] } } }
              }
            }
          ]
        }
      }
    ])

    // Convert arrays to maps for quick lookup
    const stats = {
      day: new Map(volumeStats[0].day.map(item => [item._id, item])),
      week: new Map(volumeStats[0].week.map(item => [item._id, item])),
      month: new Map(volumeStats[0].month.map(item => [item._id, item]))
    }

    // Get all pools and update them
    const pools = await SwapPool.find({ chain })

    // Process pools in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < pools.length; i += batchSize) {
      const batch = pools.slice(i, i + batchSize)
      await Promise.all(batch.map(pool => updatePoolData(pool, chain, stats)))
    }
  } catch (error) {
    console.error('UPDATE POOL STATS ERR', chain, error)
  }
  console.timeEnd(`${chain} pools updated`)
}

async function updatePoolData(pool, chain, stats) {
  try {
    const dayStats = stats.day.get(pool.id) || { volumeUSD: 0, volumeA: 0, volumeB: 0 }
    const weekStats = stats.week.get(pool.id) || { volumeUSD: 0, volumeA: 0, volumeB: 0 }
    const monthStats = stats.month.get(pool.id) || { volumeUSD: 0, volumeA: 0, volumeB: 0 }

    // Get price changes separately (these still need individual queries due to sorting)
    const [change24, changeWeek] = await Promise.all([
      getChangeFrom(Date.now() - ONEDAY, pool.id, chain),
      getChangeFrom(Date.now() - WEEK, pool.id, chain),
    ])

    pool.volumeUSD24 = dayStats.volumeUSD
    pool.volumeUSDWeek = weekStats.volumeUSD
    pool.volumeUSDMonth = monthStats.volumeUSD
    pool.volumeA24 = dayStats.volumeA
    pool.volumeAWeek = weekStats.volumeA
    pool.volumeAMonth = monthStats.volumeA
    pool.volumeB24 = dayStats.volumeB
    pool.volumeBWeek = weekStats.volumeB
    pool.volumeBMonth = monthStats.volumeB
    pool.change24 = change24
    pool.changeWeek = changeWeek

    await pool.save()
  } catch (error) {
    console.error(`Error updating pool ${pool.id} stats:`, error)
  }
}
