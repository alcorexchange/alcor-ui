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
