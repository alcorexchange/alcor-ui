import axios from 'axios'
import { SwapPool, Market, Match, GlobalStats, SwapChartPoint } from '../../models'
import { getAllTokensWithPrices } from './prices'


export async function updateGlobalStats(network, day?) {
  const now = day || new Date()
  const dayAgo = new Date(new Date().setDate(now.getDate() - 1))
  const already_exists = await GlobalStats.findOne({ time: { $gte: dayAgo } })

  if (already_exists) {
    return console.log('GlobalStats for ', day, 'alcready exists')
  }

  const tokens = await getAllTokensWithPrices(network)
  const markets = await Market.find({ chain: network.name })
  const pools = await SwapPool.find({ chain: network.name })

  let spotTradingVolume = 0
  let spotTradingFees = 0
  for (const market of markets) {
    const price = tokens.find(t => t.id == market.base_token.id)?.usd_price || 0
    spotTradingVolume += market.volume24 * price
    spotTradingFees += (market.volume24 * price) * (market.fee / 1000)
  }

  let swapValueLocked = 0
  for (const pool of pools) {
    const priceA = tokens.find(t => t.id == pool.tokenA.id)?.usd_price || 0
    const priceB = tokens.find(t => t.id == pool.tokenB.id)?.usd_price || 0

    spotTradingVolume += pool.tokenA.quantity * priceA
    spotTradingVolume += pool.tokenB.quantity * priceB
  }

  let spotValueLocked = 0
  const { data: { balances } } = await axios.get(`${network.lightapi}/api/balances/${network.name}/${network.contract}`)

  for (const balance of balances) {
    const price = tokens.find(t => t.id == balance.id.replace('@', '-').toLowerCase())?.usd_price || 0
    spotValueLocked += parseFloat(balance.amount) * price
  }

  const totalLiquidityPools = await SwapPool.countDocuments({ chain: network.name })
  const totalSpotPairs = await Market.countDocuments({ chain: network.name })

  // DAPPRADAR_ID 3572
  //axios
  // https://api.dappradar.com/4tsxo4vuhotaojtl/dapps/3572?range=24h
  // X-BLOBR-KEY: 8FuOZA12Qq5Ya97wB6165RYt46dCvwGQ
  // TODO Move key to .env

  // TODO TVL load spot tokens and make prices with it
  //
  // totalValueLocked: { type: Number },
  // -swapValueLocked: { type: Number },
  // - spotValueLocked: { type: Number },
  // - swapTradingVolume: { type: Number },
  // -spotTradingVolume: { type: Number },
  // -swapFees: { type: Number },
  // -spotFees: { type: Number },
  // dailyActiveUsers: { type: Number }, // все транзы за последний день и уникалые аккаунты считать
  // totalUniqueUsers: { type: Number }, // все транзы за последний день и уникалые аккаунты считать
  // -totalTransactions: { type: Number }, // Своп плюс
  // -totalLiquidityPools: { type: Number },
  // -totalSpotPairs: { type: Number },


}
