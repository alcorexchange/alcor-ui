import axios from 'axios'

import { SwapPool, Market, Match, GlobalStats, PositionHistory, Swap } from '../../models'
import { getOrderbook } from '../orderbookService/start'
import { getTokens } from '../../utils'
import { loadAccountBalancesHyperion } from '../../../utils/api'

const MIN_SYSTEM_TVL = 100

export async function updateGlobalStats(network, day = null, provider = 'node') {
  console.log('fetching global stats for', network.name)

  const now = day || new Date()
  const dayAgo = new Date(new Date().setDate(now.getDate() - 1))
  const already_exists = await GlobalStats.findOne({ chain: network.name, time: { $gt: dayAgo, $lt: now } })

  const { baseToken } = network
  const system_token = (baseToken.symbol + '-' + baseToken.contract).toLowerCase()

  if (already_exists) {
    return console.log('GlobalStats for ', now, 'already exists')
  }

  const tokens = await getTokens(network.name)
  const markets = await Market.find({ chain: network.name })
  const pools = await SwapPool.find({ chain: network.name })

  // Построить Map для O(1) поиска вместо O(n) find()
  const tokenPriceMap = new Map<string, number>(tokens.map(t => [t.id, t.usd_price || 0]))
  const marketsByQuoteToken = new Map()
  for (const m of markets) {
    if (m.base_token.id === system_token) {
      marketsByQuoteToken.set(m.quote_token.id, m)
    }
  }

  let spotTradingVolume = 0
  let spotFees = 0
  let swapFees = 0
  for (const market of markets) {
    const price: number = tokenPriceMap.get(market.base_token.id) ?? 0
    spotTradingVolume += market.volume24 * price
    spotFees += (market.volume24 * price) * (market.fee / 1000)
  }

  let swapValueLocked = 0
  let swapTradingVolume = 0
  for (const pool of pools) {
    const priceA: number = tokenPriceMap.get(pool.tokenA.id) ?? 0
    const priceB: number = tokenPriceMap.get(pool.tokenB.id) ?? 0

    swapTradingVolume += pool.volumeUSD24
    swapFees += pool.volumeUSD24 * (pool.fee / 10000 / 100)

    const isTokenASystem = pool.tokenA.id == system_token
    const isTokenBSystem = pool.tokenB.id == system_token

    // Filter out small TVL tokens
    if (isTokenASystem) {
      swapValueLocked += pool.tokenA.quantity * priceA

      if (pool.tokenA.quantity > MIN_SYSTEM_TVL) {
        swapValueLocked += pool.tokenB.quantity * priceB
      }
    }

    if (isTokenBSystem) {
      swapValueLocked += pool.tokenB.quantity * priceB

      if (pool.tokenB.quantity > MIN_SYSTEM_TVL) {
        swapValueLocked += pool.tokenA.quantity * priceA
      }
    }
  }

  let spotValueLocked = 0
  let balances = []

  if (provider == 'hyperion') {
    balances = await loadAccountBalancesHyperion(network.contract, network.hyperion, tokens)
  } else {
    const { data } = await axios.get(`${network.lightapi}/api/balances/${network.name}/${network.contract}`)
    balances = data.balances
  }

  for (const balance of balances) {
    const balance_token_id = (balance.currency + '-' + balance.contract).toLowerCase()
    const price: number = tokenPriceMap.get(balance_token_id) ?? 0

    const marketVsSystemToken = marketsByQuoteToken.get(balance_token_id)

    // Filter out low liquidity markets
    if (marketVsSystemToken) {
      const orderbook = Array.from((await getOrderbook(network.name, 'buy', marketVsSystemToken.id)).values())

      const marketSystemTvl = orderbook.reduce((a, b) => a + (b[1] / (10 ** baseToken.precision)), 0)

      if (marketSystemTvl > MIN_SYSTEM_TVL) {
        spotValueLocked += parseFloat(balance.amount) * price
      }
    }
  }

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
    totalValueLocked: swapValueLocked + spotValueLocked,
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
