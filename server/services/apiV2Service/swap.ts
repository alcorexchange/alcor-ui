import { Router } from 'express'
import { cacheSeconds } from 'route-cache'
import { SwapPool, SwapChartPoint, Position } from '../../models'
import { getRedisTicks } from '../swapV2Service/utils'

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

swap.get('/', async (req, res) => {
  const network: Network = req.app.get('network')

  const pools = await SwapPool.find({ chain: network.name }).lean()
  res.json(pools)
})

swap.get('/:id', async (req, res) => {
  const network: Network = req.app.get('network')
  const { id } = req.params

  const filter: { chain: string, id?: number } = { chain: network.name }

  if (id) filter.id = parseInt(id)

  const pools = await SwapPool.find(filter).lean()
  res.json(pools)
})

swap.get('/:id/positions', async (req, res) => {
  // TODO Pool share, top providers etc
  const network: Network = req.app.get('network')

  const positions = await Position.find({
    chain: network.name,
    pool: parseInt(req.params.id),
  }).lean()

  res.json(positions)
})

swap.get('/:id/ticks', async (req, res) => {
  const network: Network = req.app.get('network')

  const ticks = await getRedisTicks(network.name, req.params.id)
  res.json(Array.from(ticks.values()))
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

//swap.get('/:id/charts', defCache, async (req, res) => {
swap.get('/:id/charts', async (req, res) => {
  const network = req.app.get('network')
  const { id } = req.params

  const period = parseInt(String(req.query.period))
  const timeframe =
    period && period in timeframes ? timeframes[period] : Date.now()

  const $match = {
    chain: network.name,
    pool: parseInt(id),
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

        reserveA: { $last: '$reserveA' },
        reserveB: { $last: '$reserveB' },

        volumeUSD: { $sum: '$volumeUSD' },

        usdReserveA: { $last: '$usdReserveA' },
        usdReserveB: { $last: '$usdReserveB' },
      },
    })
  }

  query.push({ $sort: { _id: 1 } })

  const charts = await SwapChartPoint.aggregate(query)
  res.json(charts)
})
