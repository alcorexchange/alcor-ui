import { Router } from 'express'
import { cacheSeconds } from 'route-cache'
import { SwapPool, PositionHistory } from '../../models'

function positionIdHandler(req, res, next) {
  const [poolId, posId] = req.params.position_id.split('-')

  // TODO Regex
  //if (!position_id || poo.match(/.*-.*_.*-[A-Za-z0-9.]+$/) == null)

  if (!poolId || !posId)
    return res.status(403).send('Invalid ticker_id')

  req.params.position_id = { poolId: parseInt(poolId), posId: parseInt(posId) }
  next()
}

export const swap = Router()

// swap.get('/pools', cacheSeconds(60, (req, res) => {
//   return req.originalUrl + '|' + req.app.get('network').name
// }), async (req, res) => {

swap.get('/pools', async (req, res) => {
  const network: Network = req.app.get('network')

  const pools = await SwapPool.find({ chain: network.name }).select('tokenA tokenB').lean()
  res.json(pools)
})

swap.get('/position/:position_id', positionIdHandler, async (req, res) => {
  const network: Network = req.app.get('network')

  const { poolId, posId } = req.params.position_id as any

  const history = await PositionHistory.find({ chain: network.name, pool: poolId, id: posId }).lean()

  const total = history.filter(h => 'mint' == h.type).reduce((total, i) => total + i.totalUSDValue, 0)
  const sub = history.filter(h => ['burn', 'collect'].includes(h.type)).reduce((total, i) => total + i.totalUSDValue, 0)

  const absoluteTotal = total - sub

  res.json({ absoluteTotal })
})
