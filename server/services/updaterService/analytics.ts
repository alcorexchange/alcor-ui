import { SwapPool, Market, Match, GlobalStats, PositionHistory, Swap } from '../../models'
import { getTokens } from '../../utils'
import { fetchPlatformBalances } from '../chain/balances'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const SPOT_FEE_SCALE = 1000
const SWAP_FEE_SCALE = 1000000

function safeNumber(value: any, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function floorToHour(date: Date) {
  const d = new Date(date)
  d.setUTCMinutes(0, 0, 0)
  return d
}

// Distinct values of `fields` among the documents matching `filter`.
// Not Model.distinct: on matches its planner picks a DISTINCT_SCAN over
// (chain, market, asker, ...) and walks the whole chain (~20s per call), while
// a $match + $group uses the (chain, time, ...) index and takes milliseconds.
async function distinctValues(model: any, filter: any, fields: string[]) {
  const $group: any = { _id: null }
  for (const field of fields) $group[field] = { $addToSet: `$${field}` }

  const [row] = await model.aggregate([{ $match: filter }, { $group }])
  return row ? fields.flatMap(field => row[field]) : []
}

// Unique accounts that matched a spot order, swapped or touched an LP position
// in [from, to). Unique counts don't add up across buckets, so DAU has to be
// counted over a whole day window, not summed or averaged from hourly buckets.
export async function countActiveUsers(chain: string, from: Date, to: Date) {
  const filter = { chain, time: { $gte: from, $lt: to } }

  const accounts = await Promise.all([
    distinctValues(Match, filter, ['asker', 'bidder']),
    distinctValues(Swap, filter, ['sender', 'recipient']),
    distinctValues(PositionHistory, filter, ['owner'])
  ])

  return new Set(accounts.flat()).size
}

function getMarketDisplayQuoteTokenId(market: any) {
  return market?.base_token?.id
}

export async function updateGlobalStats(network, day = null) {
  console.log('fetching global stats for', network.name)

  const now = day ? new Date(day) : new Date()
  const bucketEnd = floorToHour(now)
  const bucketStart = new Date(bucketEnd.getTime() - HOUR_MS)
  const bucketNext = new Date(bucketEnd.getTime() + HOUR_MS)

  // Deduplicate by hourly bucket.
  const already_exists = await GlobalStats.findOne({
    chain: network.name,
    time: { $gte: bucketEnd, $lt: bucketNext }
  })

  if (already_exists) {
    return console.log('GlobalStats for bucket', bucketEnd.toISOString(), 'already exists')
  }

  const tokens = await getTokens(network.name)
  const markets = await Market.find({ chain: network.name })
  const pools = await SwapPool.find({ chain: network.name })
  const marketById = new Map<number, any>(markets.map((m) => [Number(m.id), m]))
  const poolById = new Map<number, any>(pools.map((p) => [Number(p.id), p]))

  // Match volumes are stored in the market base_token units, which is the displayed quote side in spot pairs.
  const tokenPriceMap = new Map<string, number>(tokens.map(t => [t.id, safeNumber(t?.safe_usd_price)]))

  let spotTradingVolume = 0
  let spotFees = 0
  const spotVolumes = await Match.aggregate([
    {
      $match: {
        chain: network.name,
        time: { $gte: bucketStart, $lt: bucketEnd },
        type: { $in: ['buymatch', 'sellmatch'] }
      }
    },
    {
      $group: {
        _id: '$market',
        volumeInDisplayQuote: {
          $sum: {
            $switch: {
              branches: [
                { case: { $eq: ['$type', 'buymatch'] }, then: { $ifNull: ['$bid', 0] } },
                { case: { $eq: ['$type', 'sellmatch'] }, then: { $ifNull: ['$ask', 0] } }
              ],
              default: 0
            }
          }
        }
      }
    }
  ])

  for (const row of spotVolumes) {
    const market = marketById.get(Number(row._id))
    if (!market) continue

    const displayQuoteTokenId = getMarketDisplayQuoteTokenId(market)
    const displayQuotePrice = safeNumber(tokenPriceMap.get(displayQuoteTokenId) ?? 0)
    const volumeInDisplayQuote = safeNumber(row?.volumeInDisplayQuote)
    const volumeUsd = volumeInDisplayQuote * displayQuotePrice
    if (!Number.isFinite(volumeUsd) || volumeUsd <= 0) continue

    const feeRate = safeNumber(market?.fee) / SPOT_FEE_SCALE
    spotTradingVolume += volumeUsd
    spotFees += volumeUsd * feeRate
  }

  let swapTradingVolume = 0
  let swapFees = 0
  const swapVolumes = await Swap.aggregate([
    {
      $match: {
        chain: network.name,
        time: { $gte: bucketStart, $lt: bucketEnd },
      },
    },
    {
      $group: {
        _id: '$pool',
        volumeUsd: { $sum: { $abs: { $ifNull: ['$totalUSDVolume', 0] } } }
      }
    }
  ])

  for (const row of swapVolumes) {
    const pool = poolById.get(Number(row._id))
    if (!pool) continue
    if (safeNumber(pool?.tvlUSD) < 100) continue
    const volumeUsd = safeNumber(row?.volumeUsd)
    if (!Number.isFinite(volumeUsd) || volumeUsd <= 0) continue
    const feeRate = safeNumber(pool?.fee) / SWAP_FEE_SCALE
    swapTradingVolume += volumeUsd
    swapFees += volumeUsd * feeRate
  }

  const { contractTvlMap } = await fetchPlatformBalances(network, tokens)
  let totalValueLocked = 0
  for (const tvl of contractTvlMap.values()) {
    totalValueLocked += tvl
  }
  const swapValueLocked = contractTvlMap.get(network.amm?.contract) ?? 0
  const spotValueLocked = contractTvlMap.get(network.contract) ?? 0

  const totalLiquidityPools = await SwapPool.countDocuments({ chain: network.name })
  const totalSpotPairs = await Market.countDocuments({ chain: network.name })

  // TODO HERE IS NO PLACE/CANCEL ORDERS
  // Transactions are counted per hourly bucket, users over the rolling day ending at it.
  const timeFilter = { chain: network.name, time: { $gte: bucketStart, $lt: bucketEnd } }
  const [dailyActiveUsers, matchTransactions, swapActionTransactions, positionTransactions] = await Promise.all([
    countActiveUsers(network.name, new Date(bucketEnd.getTime() - DAY_MS), bucketEnd),
    Match.countDocuments(timeFilter),
    Swap.countDocuments(timeFilter),
    PositionHistory.countDocuments(timeFilter)
  ])

  const totalTransactions = matchTransactions + swapActionTransactions + positionTransactions
  const swapTransactions = swapActionTransactions + positionTransactions
  const spotTransactions = matchTransactions

  await GlobalStats.create({
    chain: network.name,
    totalValueLocked,
    swapValueLocked,
    spotValueLocked,
    swapTradingVolume,
    spotTradingVolume,
    swapFees,
    spotFees,
    dailyActiveUsers,
    totalTransactions,
    totalLiquidityPools,
    totalSpotPairs,
    time: bucketEnd,
    swapTransactions,
    spotTransactions
  })

  console.log('Updated Gobal Stats for', network.name, 'bucket', bucketEnd.toISOString())
}
