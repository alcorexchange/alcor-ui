import { Router } from 'express'
import { cacheSeconds } from 'route-cache'

import { Exchange, Liquidity } from '../models'
import { newExchange, newLiuqudity } from './handlers'

export const pools = Router()

pools.get('/:pair_id/line_chart', cacheSeconds(15, (req, res) => {
  return req.originalUrl + '|' + req.query.reverse
}), async (req, res) => {
  const network = req.app.get('network')
  const { pair_id } = req.params

  const $divide = req.query.reverse == 'true' ? ['$pool2', '$pool1'] : ['$pool1', '$pool2']

  const prices = await Exchange.aggregate([
    { $match: { chain: network.name, pair_id: parseInt(pair_id) } },
    {
      $group:
      {
        _id: {
          $toDate: {
            $subtract: [
              { $toLong: '$time' },
              { $mod: [{ $toLong: '$time' }, 60 * 60 * 6 * 1000] }
            ]
          }
        },

        pool1: { $avg: '$pool1' },
        pool2: { $avg: '$pool2' }
      }
    },
    { $project: { time: { $toLong: '$_id' }, price: { $divide } } },
    { $project: { x: '$time', y: { $round: ['$price', 6] } } },
    { $sort: { x: 1 } }
  ])

  res.json(prices)
})

pools.get('/:pair_id/volume_chart', cacheSeconds(60 * 5, (req, res) => {
  // TODO Update later when new params will be added
  return req.originalUrl
}), async (req, res) => {
  const network = req.app.get('network')
  const { pair_id } = req.params

  const volume = await Exchange.aggregate([
    { $match: { chain: network.name, pair_id: parseFloat(pair_id) } },
    {
      $group:
      {
        _id: {
          $toDate: {
            $subtract: [
              { $toLong: '$time' },
              { $mod: [{ $toLong: '$time' }, 60 * 60 * 24 * 1000] }
            ]
          }
        },
        in: { $sum: '$quantity_in' },
        out: { $sum: '$quantity_out' }
      }
    },
    { $project: { x: { $toLong: '$_id' }, y: { $sqrt: { $multiply: ['$in', '$out'] } } } },
    { $project: { x: 1, y: { $round: ['$y', 4] } } },
    { $sort: { x: 1 } }
  ]).allowDiskUse(true)

  res.json(volume)
})

pools.get('/:pair_id/liquidity_chart', cacheSeconds(60 * 5, (req, res) => {
  return req.originalUrl
}), async (req, res) => {
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
              { $mod: [{ $toLong: '$time' }, 60 * 60 * 12 * 1000] }
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
