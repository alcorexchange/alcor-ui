import { Router } from 'express'
import { cacheSeconds } from 'route-cache'

import { GlobalStats } from '../../models'

export const analytics = Router()

export const resolutions = {
  '1D': 60 * 60 * 24,
  '1W': 60 * 60 * 24 * 7,
  '1M': 60 * 60 * 24 * 30
}

analytics.get('/global', cacheSeconds(0, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network = req.app.get('network')

  const resolution = resolutions[req.query.resolution]
  if (!resolution) return res.status(404).send('Invalid resolution')

  const $match = { chain: network.name, time: { $gte: new Date(Date.now() - resolution * 1000) } }

  const $group = {
    _id: '$chain',

    totalValueLocked: { $last: '$totalValueLocked' },

    swapValueLocked: { $last: '$swapValueLocked' },
    spotValueLocked: { $last: '$spotValueLocked' },

    swapTradingVolume: { $sum: '$swapTradingVolume' },
    spotTradingVolume: { $sum: '$spotTradingVolume' },

    swapFees: { $sum: '$swapFees' },
    spotFees: { $sum: '$spotFees' },

    dailyActiveUsers: { $avg: '$dailyActiveUsers' }, // TODO Make db call for resolution here

    swapTransactions: { $sum: '$swapTransactions' },
    spotTransactions: { $sum: '$spotTransactions' },

    totalLiquidityPools: { $max: '$totalLiquidityPools' },
    totalSpotPairs: { $max: '$totalSpotPairs' }
  }

  const stats = await GlobalStats.aggregate([{ $match }, { $group }])

  res.json(stats)
})

analytics.get('/charts', cacheSeconds(360, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name + req.query.resolution
}), async (req, res) => {
  const network = req.app.get('network')

  const resolution = resolutions[req.query.resolution]
  const isAll = req.query.resolution == 'ALL'

  if (!resolution && !isAll) return res.status(404).send('Invalid resolution')

  const $match = {
    chain: network.name,
    time: {
      $gte: isAll ? new Date(0) : new Date(Date.now() - resolution * 1000)
    }
  }

  const $group = {
    _id: {
      $toDate: {
        $subtract: [
          { $toLong: '$time' },
          { $mod: [{ $toLong: '$time' }, resolution || 60 * 60 * 24 * 1000] }
        ]
      }
    },

    totalValueLocked: { $last: '$totalValueLocked' },

    swapValueLocked: { $last: '$swapValueLocked' },
    spotValueLocked: { $last: '$spotValueLocked' },

    swapTradingVolume: { $sum: '$swapTradingVolume' },
    spotTradingVolume: { $sum: '$spotTradingVolume' },

    swapFees: { $sum: '$swapFees' },
    spotFees: { $sum: '$spotFees' },

    dailyActiveUsers: { $max: '$dailyActiveUsers' }, // TODO Make db call for resolution here

    swapTransactions: { $sum: '$swapTransactions' },
    spotTransactions: { $sum: '$spotTransactions' },

    totalLiquidityPools: { $max: '$totalLiquidityPools' },
    totalSpotPairs: { $max: '$totalSpotPairs' }
  }

  const stats = await GlobalStats.aggregate([{ $match }, { $group }, { $sort: { _id: 1 } }])

  res.json(stats)
})
