import { performance } from 'perf_hooks'

import { Position } from '@alcorexchange/alcor-swap-sdk'

import { Router } from 'express'
import { cacheSeconds } from 'route-cache'
import { SwapPool, SwapChartPoint } from '../../models'
import { getPools, getPoolInstance, getRedisTicks } from '../swapV2Service/utils'
import { getLiquidityRangeChart } from '../../../utils/amm.js'
import { getPositionStats } from './account'


export const swap = Router()

// swap.get('/pools', cacheSeconds(60, (req, res) => {
//   return req.originalUrl + '|' + req.app.get('network').name
// }), async (req, res) => {

function positionIdHandler(req, res, next) {
  const [poolId, posId] = req.params.position_id.split('-')

  // TODO Regex
  //if (!position_id || poo.match(/.*-.*_.*-[A-Za-z0-9.]+$/) == null)

  if (!poolId || !posId)
    return res.status(403).send('Invalid ticker_id')

  req.params.position_id = { poolId: parseInt(poolId), posId: parseInt(posId) }
  next()
}

swap.get('/pools', async (req, res) => {
  const network: Network = req.app.get('network')

  const pools = await SwapPool.find({ chain: network.name }).lean()
  res.json(pools)
})


//swap.get('/:id/charts', defCache, async (req, res) => {
swap.get('/charts', async (req, res) => {
  const network = req.app.get('network')

  const { tokenA, tokenB } = req.query

  if (typeof tokenA !== 'string' || typeof tokenB !== 'string') {
    return res.status(403).send('Set tokenA and tokenB')
  }

  const [symbolA, contractA] = tokenA.split('-')
  const [symbolB, contractB] = tokenB.split('-')
  // TODO Validation

  const pools = await SwapPool.distinct('id', {
    $or: [
      {
        'tokenA.symbol': symbolA.toUpperCase(),
        'tokenB.symbol': symbolB.toUpperCase(),
        'tokenA.contract': contractA,
        'tokenB.contract': contractB
      },

      {
        'tokenA.symbol': symbolB.toUpperCase(),
        'tokenB.symbol': symbolA.toUpperCase(),
        'tokenA.contract': contractB,
        'tokenB.contract': contractA
      },
    ]
  }).lean()

  const period = String(req.query.period)

  const timeframe =
    period && period in timeframes ? timeframes[period] : Date.now()

  const $match = {
    chain: network.name,
    pool: { $in: pools },
    time: { $gte: new Date(Date.now() - timeframe) },
  }

  const query = []

  query.push({ $match })

  if (timeframe != '24H') {
    query.push({
      $group: {
        _id: {
          $toDate: {
            $subtract: [
              { $toLong: '$time' },
              {
                $mod: [{ $toLong: '$time' }, 60 * 60 * 24 * 1000],
              },
            ],
          },
        },

        price: { $last: '$price' },

        reserveA: { $max: '$reserveA' },
        reserveB: { $max: '$reserveB' },

        volumeUSD: { $sum: '$volumeUSD' },

        usdReserveA: { $max: '$usdReserveA' },
        usdReserveB: { $max: '$usdReserveB' },
      },
    })
  }

  query.push({ $sort: { _id: 1 } })

  const charts = await SwapChartPoint.aggregate(query)
  res.json(charts)
})

swap.get('/pools/:id', async (req, res) => {
  const network: Network = req.app.get('network')
  const { id } = req.params

  const filter: { chain: string, id?: number } = { chain: network.name }

  if (id) filter.id = parseInt(id)

  const pool = await SwapPool.findOne(filter).lean()
  res.json(pool)
})

swap.get('/pools/positions/:id', async (req, res) => {
  const network: Network = req.app.get('network')
  const redis = req.app.get('redisClient')

  const positions = JSON.parse(await redis.get(`positions_${network.name}`))
  const p = positions.find(p => p.id == req.params.id)

  if (!p) return res.status(404).send('Position is not found')

  const stats = await getPositionStats(network.name, p)

  res.json({ ...p, ...stats })
})

swap.get('/pools/:id/positions', async (req, res) => {
  const network: Network = req.app.get('network')
  const redis = req.app.get('redisClient')

  const pool = await getPoolInstance(network.name, req.params.id)
  const positions = JSON.parse(await redis.get(`positions_${network.name}`))

  const result = positions.filter(p => p.pool == req.params.id).map(p => {
    const position = new Position({ ...p, pool })
    p.amountA = position.amountA.toAsset()
    p.amountB = position.amountB.toAsset()

    return p
  })

  res.json(result)
})

swap.get('/pools/:id/table-positions', async (req, res) => {
  const network: Network = req.app.get('network')
  const redis = req.app.get('redisClient')

  const positions = JSON.parse(await redis.get(`positions_${network.name}`))
  res.json(positions.filter(p => p.pool == req.params.id))
})

swap.get('/pools/:id/ticks', async (req, res) => {
  const network: Network = req.app.get('network')

  const ticks = await getRedisTicks(network.name, req.params.id)
  res.json(Array.from(ticks.values()))
})

swap.get('/pools/:id/liquidityChartSeries', async (req, res) => {
  const network: Network = req.app.get('network')
  const { id } = req.params
  const { inverted }: any = req.query

  const pool: any = await getPoolInstance(network.name, id)

  let { tokenA, tokenB } = pool

  if (inverted.toLowerCase() == 'true') {
    [tokenA, tokenB] = [tokenB, tokenA]
  }

  const series = getLiquidityRangeChart(pool, tokenA, tokenB) || []

  const result = series.map(s => {
    const y = Number(s.liquidityActive.toString())

    return {
      x: Number(s.price0),
      y: y > 0 ? y : 0 // TODO This is hotfix, might be bug in calculation
    }
  })

  res.json(result)
})

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
