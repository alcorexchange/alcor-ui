import { Sequelize, DataTypes } from 'sequelize'

const sequelize = new Sequelize('sqlite:./data/db.sqlite')

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


export function syncModels() {
  return sequelize.sync({ alter: true })
}
