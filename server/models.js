import mongoose from 'mongoose'
// Liquidity pools
export const Liquidity = mongoose.models.Match || mongoose.model('Liquidity', mongoose.Schema({
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
}))

export const Exchange = mongoose.models.Match || mongoose.model('Exchange', mongoose.Schema({
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
}))

// Limit trading
export const Match = mongoose.models.Match || mongoose.model('Match', mongoose.Schema({
  chain: { type: String, index: true },
  market: { type: Number, index: true }, // TODO потом сделать табличку с маркетами
  type: { type: String, index: true },
  trx_id: { type: String },

  unit_price: Number,

  ask: { type: Number },
  bid: { type: Number },

  asker: { type: String, index: true },
  bidder: { type: String, index: true },

  time: { type: Date, index: true },
  block_num: { type: Number }
}))

export const Bar = mongoose.models.Bar || mongoose.model('Bar', mongoose.Schema({
  chain: { type: String, index: true },
  market: { type: Number, index: true },
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: { type: Number, default: 0 },
  time: { type: Date, index: true }
}))

export const Settings = mongoose.models.Settings || mongoose.model('Settings', mongoose.Schema({
  chain: { type: String },
  actions_stream_offset: { type: Object, default: {} }
}))

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
