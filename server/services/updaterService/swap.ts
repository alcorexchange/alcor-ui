import { SwapPool, Swap } from '../../models'
import config from '../../../config'
import { getTokens } from '../../utils'
import { onSwapAction, aggregatePositions } from '../swapV2Service'
import { computeSafePoolTvlUSD } from './poolValuation'

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
    const network = config.networks[chain]
    const now = Date.now()
    const dayAgo = now - ONEDAY
    const weekAgo = now - WEEK
    const monthAgo = now - ONEDAY * 30

    const dayAgoDate = new Date(dayAgo)
    const weekAgoDate = new Date(weekAgo)
    const monthAgoDate = new Date(monthAgo)
    const absField = (field: string) => ({ $abs: { $ifNull: [field, 0] } })

    // Single-pass aggregation for 24h/7d/30d
    const volumeStats = await Swap.aggregate([
      { $match: { chain, time: { $gte: monthAgoDate } } },
      {
        $group: {
          _id: '$pool',
          volumeUSDMonth: { $sum: absField('$totalUSDVolume') },
          volumeAMonth: { $sum: absField('$tokenA') },
          volumeBMonth: { $sum: absField('$tokenB') },
          volumeUSDWeek: { $sum: { $cond: [{ $gte: ['$time', weekAgoDate] }, absField('$totalUSDVolume'), 0] } },
          volumeAWeek: { $sum: { $cond: [{ $gte: ['$time', weekAgoDate] }, absField('$tokenA'), 0] } },
          volumeBWeek: { $sum: { $cond: [{ $gte: ['$time', weekAgoDate] }, absField('$tokenB'), 0] } },
          volumeUSD24: { $sum: { $cond: [{ $gte: ['$time', dayAgoDate] }, absField('$totalUSDVolume'), 0] } },
          volumeA24: { $sum: { $cond: [{ $gte: ['$time', dayAgoDate] }, absField('$tokenA'), 0] } },
          volumeB24: { $sum: { $cond: [{ $gte: ['$time', dayAgoDate] }, absField('$tokenB'), 0] } },
        }
      }
    ])

    const statsByPool = new Map(volumeStats.map(item => [item._id, item]))
    const tokens = await getTokens(chain)
    const tokenMap = new Map((tokens || []).map((t) => [t.id, t]))

    // Get all pools and update them
    const pools = await SwapPool.find({ chain })

    // Process pools in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < pools.length; i += batchSize) {
      const batch = pools.slice(i, i + batchSize)
      await Promise.all(batch.map(pool => updatePoolData(pool, chain, statsByPool, tokenMap, network)))
    }

    await backfillPoolFirstSeen(chain, pools)
  } catch (error) {
    console.error('UPDATE POOL STATS ERR', chain, error)
  }
  console.timeEnd(`${chain} pools updated`)
}

async function updatePoolData(pool, chain, statsByPool, tokenMap, network) {
  try {
    const stats = statsByPool.get(pool.id) || {}
    const dayStats = { volumeUSD: stats.volumeUSD24 || 0, volumeA: stats.volumeA24 || 0, volumeB: stats.volumeB24 || 0 }
    const weekStats = { volumeUSD: stats.volumeUSDWeek || 0, volumeA: stats.volumeAWeek || 0, volumeB: stats.volumeBWeek || 0 }
    const monthStats = { volumeUSD: stats.volumeUSDMonth || 0, volumeA: stats.volumeAMonth || 0, volumeB: stats.volumeBMonth || 0 }

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
    pool.tvlUSD = computeSafePoolTvlUSD(pool, tokenMap, network)

    await pool.save()
  } catch (error) {
    console.error(`Error updating pool ${pool.id} stats:`, error)
  }
}

async function backfillPoolFirstSeen(chain: string, pools: any[], limit = 25) {
  const missing = pools.filter((p) => !p.firstSeenAt).slice(0, limit)
  if (!missing.length) return

  const updates = await Promise.all(missing.map(async (pool) => {
    const firstSwap = await Swap.findOne({ chain, pool: pool.id })
      .sort({ time: 1 })
      .select('time')
      .lean()

    if (!firstSwap?.time) return null

    return {
      updateOne: {
        filter: { chain, id: pool.id },
        update: { $set: { firstSeenAt: firstSwap.time } }
      }
    }
  }))

  const ops = updates.filter(Boolean)
  if (ops.length > 0) {
    await SwapPool.bulkWrite(ops, { ordered: false })
  }
}
