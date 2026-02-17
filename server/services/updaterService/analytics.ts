import { SwapPool, Market, Match, GlobalStats, PositionHistory, Swap } from '../../models'
import { getTokens, fetchPlatformBalances } from '../../utils'

const DAY_MS = 24 * 60 * 60 * 1000
const SPOT_FEE_SCALE = 1000
const SWAP_FEE_SCALE = 1000000

function safeNumber(value: any, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export async function updateGlobalStats(network, day = null) {
  console.log('fetching global stats for', network.name)

  const now = day ? new Date(day) : new Date()
  const dayAgo = new Date(now.getTime() - DAY_MS)
  const already_exists = await GlobalStats.findOne({ chain: network.name, time: { $gt: dayAgo, $lt: now } })

  if (already_exists) {
    return console.log('GlobalStats for ', now, 'already exists')
  }

  const tokens = await getTokens(network.name)
  const markets = await Market.find({ chain: network.name })
  const pools = await SwapPool.find({ chain: network.name })

  const tokenPriceMap = new Map<string, number>(tokens.map(t => [t.id, t.usd_price || 0]))

  let spotTradingVolume = 0
  let spotFees = 0
  let swapFees = 0
  for (const market of markets) {
    // market.volume24 is quote volume; convert to USD by quote token price.
    const quoteTokenId = market?.quote_token?.id
    const quotePrice = safeNumber(tokenPriceMap.get(quoteTokenId) ?? 0)
    const volumeQuote = safeNumber(market?.volume24)
    const volumeUsd = volumeQuote * quotePrice
    const feeRate = safeNumber(market?.fee) / SPOT_FEE_SCALE

    spotTradingVolume += volumeUsd
    spotFees += volumeUsd * feeRate
  }

  let swapTradingVolume = 0
  for (const pool of pools) {
    const volumeUsd = safeNumber(pool?.volumeUSD24)
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
  const timeFilter = { chain: network.name, time: { $gte: dayAgo, $lt: now } }
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
    time: now,
    swapTransactions,
    spotTransactions
  })

  console.log('Updated Gobal Stats for', network.name)
}
