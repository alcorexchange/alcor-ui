import { Router } from 'express'
import { cacheSeconds } from 'route-cache'

import { PoolChartPoint } from '../../models'

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
