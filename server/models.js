import mongoose from 'mongoose'

export const Match = mongoose.models.Match || mongoose.model('Match', mongoose.Schema({
  chain: { type: String, index: true },
  market: { type: Number, index: true }, // TODO потом сделать табличку с маркетами
  type: { type: String },
  trx_id: { type: String },

  unit_price: Number,

  ask: { type: Number },
  bid: { type: Number },

  asker: { type: String },
  bider: { type: String },

  time: { type: Date },
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

const Settings = mongoose.models.Settings || mongoose.model('Settings', mongoose.Schema({
  chain: { type: String },
  actions_stream_offset: { type: Number, default: 0 }
}))

export async function getSettings(network) {
  let actions_stream_offset = 0

  if (network.name == 'bos') {
    actions_stream_offset = 106
  }

  try {
    let settings = await Settings.findOne({ chain: network.name })

    if (!settings) {
      settings = await Settings.create({ chain: network.name, actions_stream_offset })
    }

    return settings
  } catch (e) {
    console.log('db fail on get settinga, retry..', e)
    await new Promise(resolve => setTimeout(resolve, 1000))
    return await getSettings(network)
  }
}
