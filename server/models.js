import { Sequelize, DataTypes } from 'sequelize'

const sequelize = new Sequelize('sqlite:./data/db.sqlite', { logging: false })

export const Match = sequelize.define('Match', {
  chain: { type: DataTypes.STRING },
  market: { type: DataTypes.INTEGER }, // TODO потом сделать табличку с маркетами
  type: { type: DataTypes.STRING },
  trx_id: { type: DataTypes.STRING },

  unit_price: DataTypes.STRING,

  ask: { type: DataTypes.STRING },
  bid: { type: DataTypes.STRING },

  asker: { type: DataTypes.STRING },
  bider: { type: DataTypes.STRING },

  time: { type: DataTypes.DATE },
  block_num: { type: DataTypes.INTEGER }
}, {
  allowNull: false
})


Match.addScope('defaultScope', {
  order: [['time', 'DESC']]
}, { override: true })

// TODO Markets table

const Settings = sequelize.define('Settings', {
  chain: { type: DataTypes.STRING },
  actions_stream_offset: { type: DataTypes.INTEGER, defaultValue: 0 }
})

export async function getSettings(network) {
  let actions_stream_offset = 0

  if (network.name == 'bos') {
    actions_stream_offset = 106
  }

  try {
    const [ins, created] = await Settings.findOrCreate({ where: { chain: network.name }, defaults: { chain: network.name, actions_stream_offset } })

    return ins
  } catch {
    console.log('db fail on get settinga, retry..')
    await new Promise(resolve => setTimeout(resolve, 1000))
    return await getSettings(network)
  }
}

export function syncModels() {
  return sequelize.sync({ alter: true })
}
