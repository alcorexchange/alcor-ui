import { Router } from 'express'
import { cacheSeconds } from 'route-cache'
import { SwapPool, PositionHistory, Position } from '../../models'

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

  const pools = await SwapPool.find({ chain: network.name }).select('tokenA tokenB').lean()
  res.json(pools)
})

swap.get('/pools/:id', async (req, res) => {
  const network: Network = req.app.get('network')
  const { id } = req.params

  const filter: { chain: string, id?: number } = { chain: network.name }

  if (id) filter.id = parseInt(id)

  const pools = await SwapPool.find(filter).select('tokenA tokenB').lean()
  res.json(pools)
})

swap.get('/pools/:id/positions', async (req, res) => {
  // TODO Pool share, top providers etc
  const network: Network = req.app.get('network')
  
  const positions = await Position.find({ chain: network.name, pool: parseInt(req.params.id)}).lean()
  res.json(positions)
})

swap.get('/position-stats/:position_id', positionIdHandler, async (req, res) => {
  // TODO Test first positions in a pool
  const network: Network = req.app.get('network')

  const { poolId, posId } = req.params.position_id as any

  // TODO Handle reopen new position after closing (maybe we should check it in api)
  // TODO Price for first position what creating pool will be wrong
  // Need sort here and check for 'closed'
  const history = await PositionHistory.find({ chain: network.name, pool: poolId, id: posId }).lean()

  const total = history.filter(h => 'mint' == h.type).reduce((total, i) => total + i.totalUSDValue, 0)
  const sub = history.filter(h => ['burn', 'collect'].includes(h.type)).reduce((total, i) => total + i.totalUSDValue, 0)

  const absoluteTotal = total - sub

  res.json({ absoluteTotal })
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

// pools.get('/:pair_id/charts', defCache, async (req, res) => {
//   const network = req.app.get('network')
//   const { pair_id } = req.params

//   const { period } = req.query
//   const timeframe = (period && period in timeframes) ? timeframes[period] : Date.now()

//   const $match = { chain: network.name, pool: parseInt(pair_id), time: { $gte: new Date(Date.now() - timeframe) } }

//   const query = [{ $match }]

//   if (timeframe != '24H') {
//     query.push({
//       $group:
//       {
//         _id: {
//           $toDate: {
//             $subtract: [
//               { $toLong: '$time' },
//               { $mod: [{ $toLong: '$time' }, timepoints[period] || 60 * 60 * 24 * 1000] }
//             ]
//           }
//         },

//         price: { $avg: '$price' },
//         price_r: { $avg: '$price_r' },

//         liquidity1: { $avg: '$liquidity1' },
//         liquidity2: { $avg: '$liquidity2' },

//         volume1: { $sum: '$volume1' },
//         volume2: { $sum: '$volume2' }
//       }
//     })

//     query.push({ $project: { time: { $toLong: '$_id' }, price: 1, price_r: 1, liquidity1: 1, liquidity2: 1, volume1: 1, volume2: 1 } })
//   } else {

//   }

//   query.push({
//     $project: {
//       time: { $toLong: '$time' },
//       price: 1,
//       price_r: 1,
//       liquidity1: 1,
//       liquidity2: 1,
//       volume1: 1,
//       volume2: 1
//     }
//   })

//   query.push({ $sort: { time: 1 } })

//   const charts = await PoolChartPoint.aggregate(query)
//   res.json(charts)
// })
