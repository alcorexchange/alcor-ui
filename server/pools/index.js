import { Router } from 'express'
import { cacheSeconds } from 'route-cache'

import { PoolChartPoint } from '../models'
import { newExchange, newLiuqudity } from './handlers'

export const pools = Router()

const ONEDAY = 60 * 60 * 24 * 1000

const timeframes = {
  '24H': ONEDAY,
  '7D': ONEDAY * 7,
  '30D': ONEDAY * 30
}

const timepoints = {
  '24H': 60 * 60 * 1000,
  '7D': 60 * 60 * 4 * 1000,
  '30D': 60 * 60 * 12 * 1000
}

const defCache = cacheSeconds(60 * 5, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name + '|' + req.query.reverse + '|' + req.query.period
})

//pools.get('/:pair_id/charts', defCache, async (req, res) => {
//  const network = req.app.get('network')
//  const { pair_id } = req.params
//
//  const { period } = req.query
//  const timeframe = (period && period in timeframes) ? timeframes[period] : Date.now()
//
//  const $match = { chain: network.name, pool: parseInt(pair_id), time: { $gte: new Date(Date.now() - timeframe) } }
//
//  let charts = []
//
//  if (period != '24H') {
//    const query = [{ $match }]
//
//    query.push({
//      $group:
//      {
//        _id: {
//          $toDate: {
//            $subtract: [
//              { $toLong: '$time' },
//              { $mod: [{ $toLong: '$time' }, timepoints[period] || 60 * 60 * 24 * 1000] }
//            ]
//          }
//        },
//
//        price: { $avg: '$price' },
//        price_r: { $avg: '$price_r' },
//
//        liquidity1: { $avg: '$liquidity1' },
//        liquidity2: { $avg: '$liquidity2' },
//
//        volume1: { $sum: '$volume1' },
//        volume2: { $sum: '$volume2' }
//      }
//    })
//    query.push({ $sort: { time: 1 } })
//
//    charts = await PoolChartPoint.aggregate(query)
//  } else {
//    console.log('zzzzz11')
//    charts = await PoolChartPoint.find($match).sort({ time: 1 })
//  }
//
//  res.json(charts)
//})

pools.get('/:pair_id/charts', defCache, async (req, res) => {
  const network = req.app.get('network')
  const { pair_id } = req.params

  const { period } = req.query
  const timeframe = (period && period in timeframes) ? timeframes[period] : Date.now()

  const $match = { chain: network.name, pool: parseInt(pair_id), time: { $gte: new Date(Date.now() - timeframe) } }

  const query = [{ $match }]

  if (timeframe != '24H') {
    query.push({
      $group:
      {
        _id: {
          $toDate: {
            $subtract: [
              { $toLong: '$time' },
              { $mod: [{ $toLong: '$time' }, timepoints[period] || 60 * 60 * 24 * 1000] }
            ]
          }
        },

        price: { $avg: '$price' },
        price_r: { $avg: '$price_r' },

        liquidity1: { $avg: '$liquidity1' },
        liquidity2: { $avg: '$liquidity2' },

        volume1: { $sum: '$volume1' },
        volume2: { $sum: '$volume2' }
      }
    })

    query.push({ $project: { time: { $toLong: '$_id' }, price: 1, price_r: 1, liquidity1: 1, liquidity2: 1, volume1: 1, volume2: 1 } })
  } else {

  }

  query.push({
    $project: {
      time: { $toLong: '$time' },
      price: 1,
      price_r: 1,
      liquidity1: 1,
      liquidity2: 1,
      volume1: 1,
      volume2: 1
    }
  })

  query.push({ $sort: { time: 1 } })

  const charts = await PoolChartPoint.aggregate(query)
  res.json(charts)
})

export async function newPoolsAction(action, network) {
  if (action.act.data == null) {
    console.log('Invalid action in pools', action)
    return
  }

  const { act: { name, data: { record } } } = action

  if (['exchangelog', 'liquiditylog'].includes(name)) {
    const last_point = await PoolChartPoint.findOne({ chain: network.name, pool: record.pair_id }, {}, { sort: { time: -1 } })

    // Sptit by one hour
    const resolution = 60 * 60 // One hour
    if (last_point && Math.floor(last_point.time / 1000 / resolution) == Math.floor(new Date(action.block_time) / 1000 / resolution)) {
      if (name == 'exchangelog') {
        const { pool1, pool2, quantity_in, quantity_out } = record

        const zeroForOne = pool1.split(' ')[1] == quantity_in.split(' ')[1]

        last_point.price = parseFloat(pool2) / parseFloat(pool1)
        last_point.price_r = parseFloat(pool1) / parseFloat(pool2)

        last_point.volume1 += zeroForOne ? parseFloat(quantity_in) : parseFloat(quantity_out)
        last_point.volume2 += zeroForOne ? parseFloat(quantity_out) : parseFloat(quantity_in)

        last_point.liquidity1 = parseFloat(pool1)
        last_point.liquidity2 = parseFloat(pool2)
      } else {
        const { pool1, pool2 } = record

        last_point.liquidity1 = parseFloat(pool1)
        last_point.liquidity2 = parseFloat(pool2)
      }

      last_point.save()
    } else {
      const { pool1, pool2, quantity_in, quantity_out } = record

      if (name == 'exchangelog') {
        const zeroForOne = pool1.split(' ')[1] == quantity_in.split(' ')[1]

        await PoolChartPoint.create({
          chain: network.name,
          pool: record.pair_id,
          time: action.block_time,

          price: parseFloat(pool2) / parseFloat(pool1),
          price_r: parseFloat(pool1) / parseFloat(pool2),

          volume1: zeroForOne ? parseFloat(quantity_in) : parseFloat(quantity_out),
          volume2: zeroForOne ? parseFloat(quantity_out) : parseFloat(quantity_in),

          liquidity1: parseFloat(pool1),
          liquidity2: parseFloat(pool2)
        })
      }
      //else {
      //  const { pool1, pool2 } = record

      //  await PoolChartPoint.create({
      //    chain: network.name,
      //    pool: record.pair_id,
      //    time: action.block_time,

      //    price: 0,
      //    price_r: 0,

      //    volume1: 0,
      //    volume2: 0,

      //    liquidity1: parseFloat(pool1),
      //    liquidity2: parseFloat(pool2)
      //  })
      //}
    }
  }

  if (name == 'liquiditylog') {
    await newLiuqudity(network, action)
  }

  if (name == 'exchangelog') {
    await newExchange(network, action)
  }

  if (name == 'transfer') {
    //  && account == network.pools.contract
    //return

    // TODO Тут создаем две записи на ликвидность, одна отнимает у того кто отправил, другая прибавляет тому кому
    // отправили
    // как понять сколько ликвидности пользователь потерял ?
    //
    //

    //console.log('.........................transfer...', action)
  }

  //io.to(`pools:${network.name}`).emit('update_pair', record)
}
