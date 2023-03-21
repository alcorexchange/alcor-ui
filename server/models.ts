import mongoose from 'mongoose'

const MarketSchema = new mongoose.Schema({
  id: { type: Number, index: true },
  ticker_id: { type: String, index: true },
  chain: { type: String, index: true },

  base_token: {
    contract: { type: String, index: true },
    symbol: {
      name: { type: String },
      precision: { type: Number }
    },
    str: { type: String },
    id: { type: String }
  },

  quote_token: {
    contract: { type: String },
    symbol: {
      name: { type: String },
      precision: { type: Number }
    },
    str: { type: String },
    id: { type: String }
  },

  min_buy: { type: Number },
  min_sell: { type: Number },
  frozen: { type: Boolean },
  fee: { type: Number },

  last_price: { type: Number },
  bid: { type: Number },
  ask: { type: Number },

  // New Fields
  base_volume: { type: Number },
  target_volume: { type: Number },

  volume24: { type: Number },
  volumeWeek: { type: Number },
  volumeMonth: { type: Number },

  change24: { type: Number },
  changeWeek: { type: Number },
  high24: { type: Number },
  low24: { type: Number }
})
MarketSchema.index({ chain: 1, id: 1 })
MarketSchema.index({ chain: 1, ticker_id: 1 })

const PoolPairSchema = new mongoose.Schema({
  chain: { type: String, index: true },
  pair_id: { type: Number, index: true },

  pool1: {
    contract: { type: String, index: true },
    symbol: { type: String, index: true }
  },

  pool2: {
    contract: { type: String, index: true },
    symbol: { type: String, index: true }
  }
})

const LiquiditySchema = new mongoose.Schema({
  chain: { type: String, index: true },
  pair_id: { type: Number, index: true },
  trx_id: { type: String },

  owner: { type: String, index: true },

  lp_token: { type: Number },
  liquidity1: { type: Number },
  liquidity2: { type: Number },

  pool1: { type: Number },
  pool2: { type: Number },

  supply: { type: Number },

  time: { type: Date, index: true },
  block_num: { type: Number }
})
//LiquiditySchema.index({})

const ExchangeSchema = new mongoose.Schema({
  chain: { type: String, index: true },
  pair_id: { type: Number, index: true },
  trx_id: { type: String },

  maker: { type: String, index: true },

  quantity_in: { type: Number },
  quantity_out: { type: Number },

  pool1: { type: Number },
  pool2: { type: Number },

  time: { type: Date, index: true },
  block_num: { type: Number }
})

const MatchSchema = new mongoose.Schema({
  chain: { type: String, index: true },
  market: { type: Number, index: true },
  type: { type: String, index: true },
  trx_id: { type: String },

  unit_price: { type: Number, index: true },

  ask: { type: Number },
  bid: { type: Number },

  asker: { type: String, index: true },
  bidder: { type: String, index: true },

  time: { type: Date, index: true },
  block_num: { type: Number }
})
MatchSchema.index({ chain: 1, market: 1 })
MatchSchema.index({ chain: 1, market: 1, time: -1 })
MatchSchema.index({ chain: 1, market: 1, asker: 1, bidder: 1 })
MatchSchema.index({ chain: 1, market: 1, time: 1, unit_price: -1 })

const BarSchema = new mongoose.Schema({
  timeframe: { type: String, index: true },
  chain: { type: String, index: true },
  market: { type: Number, index: true },

  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: { type: Number, default: 0 },
  time: { type: Date, index: true }
})
BarSchema.index({ chain: 1, timeframe: 1, market: 1, time: -1 }, { background: true })

const PoolChartPointSchema = new mongoose.Schema({
  chain: { type: String, index: true },
  pool: { type: Number, index: true },

  price: { type: Number, default: 0 },
  volume1: { type: Number, default: 0 },
  liquidity1: { type: Number, default: 0 },

  // Reverted
  price_r: { type: Number, default: 0 },
  volume2: { type: Number, default: 0 },
  liquidity2: { type: Number, default: 0 },

  time: { type: Date, index: true }
})
PoolChartPointSchema.index({ chain: 1, pool: 1, time: -1 }, { background: true })

const SettingsSchema = new mongoose.Schema({
  chain: { type: String, index: true },
  actions_stream_offset: { type: Object, default: {} }
})

const SwapPoolSchema = new mongoose.Schema({
  chain: { type: String, index: true },
  id: { type: Number, index: true },
  fee: { type: Number, index: true }, // Create index chain/id/fee
  active: { type: Boolean, index: true },

  tokenA: {
    contract: { type: String, index: true },
    symbol: { type: String, index: true },
    id: { type: String, index: true },
    quantity: { type: Number },
    decimals: { type: Number },
  },

  tokenB: {
    contract: { type: String, index: true },
    symbol: { type: String, index: true },
    id: { type: String, index: true },
    quantity: { type: Number },
    decimals: { type: Number }
  },

  sqrtPriceX64: { type: String },
  tick: { type: Number },

  feeProtocol: { type: Number, index: true },
  tickSpacing: { type: Number, index: true },

  maxLiquidityPerTick: { type: String },

  feeGrowthGlobalAX64: { type: String },
  feeGrowthGlobalBX64: { type: String },

  protocolFeeA: { type: Number },
  protocolFeeB: { type: Number },
  liquidity: { type: String },
  creator: { type: String },

  // TODO Change 24/week/month

  // New Fields
  volumeA24: { type: Number },
  volumeB24: { type: Number },

  volumeAWeek: { type: Number },
  volumeBWeek: { type: Number },

  volumeAMonth: { type: Number },
  volumeBMonth: { type: Number },
})
SwapPoolSchema.index({ chain: 1, id: 1 }, { unique: true })

// Every hour cahrt basic point for info
const SwapChartPointSchema = new mongoose.Schema({
  chain: { type: String, index: true },
  pool: { type: Number, index: true },

  // Sqt
  price: { type: String },

  // Liquidity reserves
  reserveA: { type: Number },
  reserveB: { type: Number },

  // Liquidity reserves in USD
  usdReserveA: { type: Number, default: 0 },
  usdReserveB: { type: Number, default: 0 },

  volumeUSD: { type: Number, default: 0 },

  // We not user default here actually
  time: { type: Date, default: () => Date.now(), index: true }
})
PoolChartPointSchema.index({ chain: 1, pool: 1, time: -1 }, { background: true })

const SwapSchema = new mongoose.Schema({
  chain: { type: String, index: true },
  pool: { type: Number, index: true },
  trx_id: { type: String },

  recipient: { type: String, index: true },
  sender: { type: String, index: true },

  sqrtPriceX64: { type: String },

  totalUSDVolume: { type: Number },

  tokenA: { type: Number },
  tokenB: { type: Number },

  time: { type: Date, index: true },
})

const PositionSchema = new mongoose.Schema({
  id: { type: Number },
  chain: { type: String, index: true },
  pool: { type: Number, index: true },

  tickLower: { type: Number },
  tickUpper: { type: Number },
  liquidity: { type: String },
  feeGrowthInsideALastX64: { type: String },
  feeGrowthInsideBLastX64: { type: String },

  // In future owner might be changed
  owner: { type: String, index: true },
})

// Position Change event add/remove liqudity
const PositionHistorySchema = new mongoose.Schema({
  id: { type: Number, index: true },
  chain: { type: String, index: true },
  pool: { type: Number, index: true },

  // In future owner might be changed
  owner: { type: String, index: true },

  type: { type: String, index: true },

  tokenA: { type: Number },
  tokenB: { type: Number },

  tokenAUSDPrice: { type: Number, default: 0 },
  tokenBUSDPrice: { type: Number, default: 0 },

  // Total USD value of tokenA + tokenB  in a time of change
  totalUSDValue: { type: Number },
  liquidity: { type: String },

  trx_id: { type: String },
  time: { type: Date, index: true },
})
PoolChartPointSchema.index({ chain: 1, pool: 1, id: 1, owner: 1, time: -1, type: 1 }, { background: true })

export const Market = mongoose.model('Market', MarketSchema)
export const PoolPair = mongoose.model('PoolPair', PoolPairSchema)
export const Liquidity = mongoose.model('Liquidity', LiquiditySchema)
export const Exchange = mongoose.model('Exchange', ExchangeSchema)
export const Match = mongoose.model('Match', MatchSchema)
export const Bar = mongoose.model('Bar', BarSchema)
export const PoolChartPoint = mongoose.model('PoolChartPoint', PoolChartPointSchema)
export const Settings = mongoose.model('Settings', SettingsSchema)
export const Swap = mongoose.model('Swap', SwapSchema)
export const SwapPool = mongoose.model('SwapPool', SwapPoolSchema)
export const SwapChartPoint = mongoose.model('SwapChartPoint', SwapChartPointSchema)
export const PositionHistory = mongoose.model('PositionHistory', PositionHistorySchema)
export const Position = mongoose.model('Position', PositionSchema)
