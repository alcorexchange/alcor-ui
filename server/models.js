import { Sequelize, DataTypes } from 'sequelize'

const sequelize = new Sequelize('sqlite::memory:')

const Match = sequelize.define('Match', {
  chain: { type: DataTypes.STRING },
  market: { type: DataTypes.INTEGER }, // TODO потом сделать табличку с маркетами
  type: { type: DataTypes.STRING },

  ask: { type: DataTypes.STRING },
  bid: { type: DataTypes.STRING },

  asker: { type: DataTypes.STRING },
  bider: { type: DataTypes.STRING },

  time: { type: DataTypes.DATE }
}, {
  allowNull: false
})


// TODO Markets table
