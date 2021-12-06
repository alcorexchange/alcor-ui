import mongoose from 'mongoose'

const MarketSchema = mongoose.Schema({
  id: { type: Number, index: true },
  chain: { type: String, index: true },

  base_token: {
    contract: { type: String, index: true },
    symbol: {
      name: { type: String },
      precision: { type: Number }
    },
    str: { type: String }
  },

  quote_token: {
    contract: { type: String },
    symbol: {
      name: { type: String },
      precision: { type: Number }
    },
    str: { type: String }
  },

  min_buy: { type: String },
  min_sell: { type: String },
  frozen: { type: Boolean },
  fee: { type: Number },
  last_price: { type: Number },
  volume24: { type: Number },
  volumeWeek: { type: Number },
  volumeMonth: { type: Number },
  change24: { type: Number },
  changeWeek: { type: Number }
})
MarketSchema.index({ chain: 1, id: 1 })

const PoolPairSchema = mongoose.Schema({
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

const LiquiditySchema = mongoose.Schema({
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

const ExchangeSchema = mongoose.Schema({
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

const MatchSchema = mongoose.Schema({
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

const BarSchema = mongoose.Schema({
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

const PoolChartPointSchema = mongoose.Schema({
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

const SettingsSchema = mongoose.Schema({
  chain: { type: String, index: true },
  actions_stream_offset: { type: Object, default: {} }
})

export async function getSettings(network) {
  const actions_stream_offset = {}

  if (network.name == 'bos') {
    // TODO Возможно применяет каджый раз, это баг
    actions_stream_offset.alcordexmain = 106
  }

  try {
    let settings = await Settings.findOne({ chain: network.name })

    if (!settings) {
      console.log('creating settings')
      settings = await Settings.create({ chain: network.name, actions_stream_offset })
      console.log('created..')
    }

    return settings
  } catch (e) {
    console.log('db fail on get settinga, retry..', e)
    await new Promise(resolve => setTimeout(resolve, 1000))
    return await getSettings(network)
  }
}

export const Market = mongoose.model('Market', MarketSchema)
export const PoolPair = mongoose.model('PoolPair', PoolPairSchema)
export const Liquidity = mongoose.model('Liquidity', LiquiditySchema)
export const Exchange = mongoose.model('Exchange', ExchangeSchema)
export const Match = mongoose.model('Match', MatchSchema)
export const Bar = mongoose.model('Bar', BarSchema)
export const PoolChartPoint = mongoose.model('PoolChartPoint', PoolChartPointSchema)
export const Settings = mongoose.model('Settings', SettingsSchema)
