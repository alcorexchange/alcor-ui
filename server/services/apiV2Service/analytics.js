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

  const resolution = resolutions[req.query.resolution] || resolutions['1D']
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

    dailyActiveUsers: { $avg: '$dailyActiveUsers' },

    swapTransactions: { $sum: '$swapTransactions' },
    spotTransactions: { $sum: '$spotTransactions' },

    totalLiquidityPools: { $max: '$totalLiquidityPools' },
    totalSpotPairs: { $max: '$totalSpotPairs' }
  }

  const [stats] = await GlobalStats.aggregate([{ $match }, { $group }])

  res.json({
    ...stats,
    totalTradingVolume: stats.swapTradingVolume + stats.spotTradingVolume
  })
})

// Volume and fees over [start_time, end_time), unix seconds. Built for DefiLlama,
// which asks for one UTC day at a time and backfills history the same way.
// A GlobalStats row is stamped with the end of the hour it covers, so the rows
// of the window are those with start_time < time <= end_time.
analytics.get('/volume', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network = req.app.get('network')

  const start = parseInt(req.query.start_time)
  const end = parseInt(req.query.end_time)
  if (isNaN(start) || isNaN(end) || start >= end) {
    return res.status(400).send('Expected start_time < end_time, unix seconds')
  }

  const $match = {
    chain: network.name,
    time: { $gt: new Date(start * 1000), $lte: new Date(end * 1000) }
  }

  const $group = {
    _id: null,
    swapVolume: { $sum: '$swapTradingVolume' },
    spotVolume: { $sum: '$spotTradingVolume' },
    swapFees: { $sum: '$swapFees' },
    spotFees: { $sum: '$spotFees' },
    buckets: { $sum: 1 }
  }

  const [stats] = await GlobalStats.aggregate([{ $match }, { $group }])
  const { swapVolume = 0, spotVolume = 0, swapFees = 0, spotFees = 0, buckets = 0 } = stats || {}

  res.json({
    start_time: start,
    end_time: end,
    volume: swapVolume + spotVolume,
    fees: swapFees + spotFees,
    swapVolume,
    spotVolume,
    swapFees,
    spotFees,
    buckets
  })
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

    dailyActiveUsers: { $avg: '$dailyActiveUsers' },

    swapTransactions: { $sum: '$swapTransactions' },
    spotTransactions: { $sum: '$spotTransactions' },

    totalLiquidityPools: { $max: '$totalLiquidityPools' },
    totalSpotPairs: { $max: '$totalSpotPairs' }
  }

  const stats = await GlobalStats.aggregate([{ $match }, { $group }, { $sort: { _id: 1 } }])

  res.json(stats)
})
