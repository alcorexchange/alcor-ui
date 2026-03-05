import { SwapPool, Market, Match, GlobalStats, PositionHistory, Swap } from '../../models'
import { getTokens, fetchPlatformBalances } from '../../utils'

const HOUR_MS = 60 * 60 * 1000
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

  // Use trusted prices to avoid inflating global spot volume by untrusted/scam quote tokens.
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
        volumeQuote: {
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

    const quoteTokenId = market?.quote_token?.id
    const quotePrice = safeNumber(tokenPriceMap.get(quoteTokenId) ?? 0)
    const volumeQuote = safeNumber(row?.volumeQuote)
    const volumeUsd = volumeQuote * quotePrice
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

  let dailyActiveUsers = 0
  let totalTransactions = 0

  // if (['eos', 'wax', 'telos'].includes(network.name)) {
  //   console.log('request: ', { 'X-BLOBR-KEY': process.env.DAPPRADAR_KEY })

  //   const { data: { results: { metrics } } } = await axios.get(
  //     'https://api.dappradar.com/4tsxo4vuhotaojtl/dapps/3572',
  //     { params: { range: '24h', chain: network.name }, headers: { 'X-BLOBR-KEY': process.env.DAPPRADAR_KEY } }
  //   )

  //   dailyActiveUsers = metrics.dailyActiveUsers
  //   totalTransactions = metrics.totalTransactions
  // } else {

  // TODO HERE IS NO PLACE/CANCEL ORDERS
  const timeFilter = { chain: network.name, time: { $gte: bucketStart, $lt: bucketEnd } }
  const [
    matchUsersAsker,
    matchUsersBidder,
    swapUsersSender,
    swapUsersReceiver,
    positionOwners,
    matchTransactions,
    swapActionTransactions,
    positionTransactions
  ] = await Promise.all([
    Match.distinct('asker', timeFilter).lean(),
    Match.distinct('bidder', timeFilter).lean(),
    Swap.distinct('recipient', timeFilter).lean(),
    Swap.distinct('sender', timeFilter).lean(),
    PositionHistory.distinct('owner', timeFilter).lean(),
    Match.countDocuments(timeFilter),
    Swap.countDocuments(timeFilter),
    PositionHistory.countDocuments(timeFilter)
  ])

  dailyActiveUsers = (new Set([...matchUsersAsker, ...matchUsersBidder, ...positionOwners, ...swapUsersSender, ...swapUsersReceiver])).size
  totalTransactions = matchTransactions + swapActionTransactions + positionTransactions

  const swapTransactions = swapActionTransactions + positionTransactions
  const spotTransactions = matchTransactions
  //}

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
