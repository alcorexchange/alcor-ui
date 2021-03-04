import { Router } from 'express'
import { Exchange, Liquidity } from '../models'

import { newExchange, newLiuqudity } from './handlers'

export const pools = Router()
pools.get('/:pair_id/line_chart', async (req, res) => {
  const network = req.app.get('network')
  const { pair_id } = req.params

  const $divide = req.query.reverse == 'true' ? ['$pool1', '$pool2'] : ['$pool2', '$pool1']

  const prices = await Exchange.aggregate([
    { $match: { chain: network.name, pair_id: parseInt(pair_id) } },
    { $project: { _id: 0, time: 1, price: { $divide } } },
    { $project: { x: { $toLong: '$time' }, y: { $round: ['$price', 4] } } },
    { $sort: { time: 1 } }
  ])

  res.json(prices)
})

pools.get('/:pair_id/volume_chart', async (req, res) => {
  const network = req.app.get('network')
  const { pair_id } = req.params

  // TODO Не работает, допилить
  const volume = await Exchange.aggregate([
    { $match: { chain: network.name, pair_id: parseInt(pair_id) } },
    //{
    //  $group:
    //  {
    //    _id: {
    //      $toDate: {
    //        $subtract: [
    //          { $toLong: '$time' },
    //          { $mod: [{ $toLong: '$time' }, 60 * 60 * 1000] }
    //        ]
    //      }
    //    },
    //    supply: { $max: '$supply' }
    //  }
    //},
    //{ $project: { x: { $toLong: '$_id' }, y: { $round: ['$supply', 4] } } },
    { $project: { x: { $toLong: '$time' }, y: { $round: ['$supply', 4] } } },
    { $sort: { x: 1 } }
  ]).allowDiskUse(true)

  res.json(volume)
})

pools.get('/:pair_id/liquidity_chart', async (req, res) => {
  const network = req.app.get('network')
  const { pair_id } = req.params

  const volume = await Liquidity.aggregate([
    { $match: { chain: network.name, pair_id: parseInt(pair_id) } },
    {
      $group:
      {
        _id: {
          $toDate: {
            $subtract: [
              { $toLong: '$time' },
              { $mod: [{ $toLong: '$time' }, 60 * 60 * 1000] }
            ]
          }
        },
        supply: { $max: '$supply' }
      }
    },
    { $project: { x: { $toLong: '$_id' }, y: { $round: ['$supply', 4] } } },
    //{ $project: { x: { $toLong: '$time' }, y: { $round: ['$supply', 4] } } },
    { $sort: { x: 1 } }
  ]).allowDiskUse(true)

  res.json(volume)
})

export async function newPoolsAction(action, network, app) {
  const { act: { name, data: { record: pair_id } } } = action

  const io = app.get('io')

  if (name == 'liquiditylog') {
    await newLiuqudity(network, action)
  }

  if (name == 'exchangelog') {
    await newExchange(network, action)
  }

  io.to(`pools:${network.name}`).emit('update_pair', pair_id)
}
