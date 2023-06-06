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

analytics.get('/charts', cacheSeconds(0, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network = req.app.get('network')

  const resolution = resolutions[req.query.resolution]
  if (!resolution) return res.status(404).send('Invalid resolution')

  const $match = { chain: network.name, time: { $gte: new Date(Date.now() - resolution * 1000) } }
  //const $match = { chain: network.name }

  const $group = {
    //chain: 1,
    // _id: {
    //   $toDate: {
    //     $subtract: [
    //       { $toLong: '$time' },
    //       { $mod: [{ $toLong: '$time' }, timepoints[period] || 60 * 60 * 24 * 1000] }
    //     ]
    //   }
    // },
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
