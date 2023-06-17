import axios from 'axios'

import { SwapPool, Market, Match, GlobalStats, PositionHistory, Swap } from '../../models'
import { getOrderbook } from '../orderbookService/start'
import { getAllTokensWithPrices } from './prices'

const MIN_SYSTEM_TVL = 100

export async function updateGlobalStats(network, day?) {
  const now = day || new Date()
  const dayAgo = new Date(new Date().setDate(now.getDate() - 1))
  const already_exists = await GlobalStats.findOne({ chain: network.name, time: { $gt: dayAgo } })

  const { baseToken } = network
  const system_token = (baseToken.symbol + '-' + baseToken.contract).toLowerCase()

  if (already_exists) {
    return console.log('GlobalStats for ', now, 'already exists')
  }

  const tokens = await getAllTokensWithPrices(network)
  const markets = await Market.find({ chain: network.name })
  const pools = await SwapPool.find({ chain: network.name })

  let spotTradingVolume = 0
  let spotFees = 0
  for (const market of markets) {
    const price = tokens.find(t => t.id == market.base_token.id)?.usd_price || 0
    spotTradingVolume += market.volume24 * price
    spotFees += (market.volume24 * price) * (market.fee / 1000)
  }

  let swapValueLocked = 0
  let swapTradingVolume = 0
  for (const pool of pools) {
    const priceA = tokens.find(t => t.id == pool.tokenA.id)?.usd_price || 0
    const priceB = tokens.find(t => t.id == pool.tokenB.id)?.usd_price || 0

    swapTradingVolume += pool.volumeUSD24

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
  const { data: { balances } } = await axios.get(`${network.lightapi}/api/balances/${network.name}/${network.contract}`)

  for (const balance of balances) {
    const price = tokens.find(t => t.id == (balance.currency + '-' + balance.contract).toLowerCase())?.usd_price || 0

    const balance_token_id = (balance.currency + '-' + balance.contract).toLowerCase()

    const marketVsSystemToken = markets.find(m => m.base_token.id == system_token && m.quote_token.id == balance_token_id)

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

  if (['eos', 'wax', 'telos'].includes(network.name)) {
    const { data: { results: { metrics } } } = await axios.get(
      'https://api.dappradar.com/trader/dapps/3572',
      { params: { range: '24h', chain: network.name }, headers: { 'X-BLOBR-KEY': process.env.DAPPRADAR_KEY } }
    )

    dailyActiveUsers = metrics.dailyActiveUsers
    totalTransactions = metrics.totalTransactions
  } else {
    // Manually for proton
    // TODO HERE IS NO PLACE/CANCEL ORDERS
    const matchUsersAsker = await Match.distinct('asker', { chain: network.name, time: { $gte: dayAgo } }).lean()
    const matchUsersBidder = await Match.distinct('bidder', { chain: network.name, time: { $gte: dayAgo } }).lean()
    const swapUsersSender = await Swap.distinct('recipient', { chain: network.name, time: { $gte: dayAgo } }).lean()
    const swapUsersReceiver = await Swap.distinct('sender', { chain: network.name, time: { $gte: dayAgo } }).lean()
    const positionOwners = await PositionHistory.distinct('owner', { chain: network.name, time: { $gte: dayAgo } }).lean()

    const matchTransactions = await Match.countDocuments({ chain: network.name, time: { $gte: dayAgo } })
    const swapTransactions = await Swap.countDocuments({ chain: network.name, time: { $gte: dayAgo } })
    const positionTransactions = await PositionHistory.countDocuments({ chain: network.name, time: { $gte: dayAgo } })

    dailyActiveUsers = (new Set([...matchUsersAsker, ...matchUsersBidder, ...positionOwners, ...swapUsersSender, ...swapUsersReceiver])).size
    totalTransactions = matchTransactions + swapTransactions + positionTransactions
  }

  await GlobalStats.create({
    chain: network.name,
    totalValueLocked: swapValueLocked + spotValueLocked,
    swapValueLocked,
    spotValueLocked,
    swapTradingVolume,
    spotTradingVolume,
    swapFees: 0,
    spotFees,
    dailyActiveUsers,
    totalTransactions,
    totalLiquidityPools,
    totalSpotPairs,
    time: new Date()
  })

  console.log('Updated Gobal Stats for', network.name)
}
