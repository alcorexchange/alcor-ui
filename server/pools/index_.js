import { Router } from 'express'
import { cacheSeconds } from 'route-cache'

import { Exchange, Liquidity } from '../models'
import { newExchange, newLiuqudity } from './handlers'

export const pools = Router()

const ONEDAY = 60 * 60 * 24 * 1000

const timeframes = {
  '24H': ONEDAY,
  '7D': ONEDAY * 7,
  '30D': ONEDAY * 30
}

pools.get('/:pair_id/line_chart', cacheSeconds(15, (req, res) => {
  return req.originalUrl + '|' + req.query.reverse + '|' + req.app.get('network').name
}), async (req, res) => {
  const network = req.app.get('network')
  const { pair_id } = req.params
  const { period, reverse } = req.query.params

  const timeframe = (period && period in timeframes) ? timeframes[period] : Date.now()

  const $divide = reverse == 'true' ? ['$pool2', '$pool1'] : ['$pool1', '$pool2']
  const prices = await Exchange.aggregate([
    { $match: { chain: network.name, pair_id: parseInt(pair_id), time: { $gte: Date.now() - timeframe } } },
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
  return req.originalUrl + '|' + req.app.get('network').name
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
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network = req.app.get('network')
  const { pair_id } = req.params

  const side = req.query.reverse == 'true' ? '$pool2' : '$pool1'

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
        liquidity: { $max: side }
      }
    },
    { $project: { x: { $toLong: '$_id' }, y: { $round: ['$liquidity', 4] } } },
    { $sort: { x: 1 } }
  ]).allowDiskUse(true)

  res.json(volume)
})

export async function newPoolsAction(action, network, app) {
  const { act: { account, name, data: { record: pair_id } } } = action

  const io = app.get('io')

  if (name == 'liquiditylog') {
    await newLiuqudity(network, action)
  }

  if (name == 'exchangelog') {
    await newExchange(network, action)
  }

  if (name == 'transfer' && account == network.pools.contract) {
    return

    // TODO Тут создаем две записи на ликвидность, одна отнимает у того кто отправил, другая прибавляет тому кому
    // отправили
    // как понять сколько ликвидности пользователь потерял ?
    //
    //

    //console.log('.........................transfer...', action)
  }

  io.to(`pools:${network.name}`).emit('update_pair', pair_id)
}
