import { Router } from 'express'
import { cacheSeconds } from 'route-cache'
import { SwapPool, PositionHistory, Position } from '../../models'

// TODO Account validation
export const account = Router()

async function getPositionStats(chain, pool, id, owner) {
  // Will sort "closed" to the end
  const history = await PositionHistory.find({ chain, pool, id, owner }).sort({ time: 1, type: 1 }).lean()

  let total = 0
  let sub = 0
  let closed = false

  for (const h of history) {
    if (h.type == 'mint') {
      if (closed) {
        // Pool id are incremented by 1 from last one, so different positions might got repeated
        // so we clear counters if there where already closed position with that id
        total = 0
        sub = 0
        closed = false
      }

      total += h.totalUSDValue
    }

    // Might be after close
    if (['burn', 'collect'].includes(h.type)) sub += h.totalUSDValue

    if (h.type == 'closed') closed = true
  }

  const absoluteTotal = +(total - sub).toFixed(4)
  console.log({ id, total, sub })

  return { absoluteTotal, closed }
}


account.get('/:account', async (req, res) => {
  const network: Network = req.app.get('network')

  const { account } = req.params

  res.json({ account, todo: 'some account data' })
})


account.get('/:account/poolsPositionsIn', async (req, res) => {
  const network: Network = req.app.get('network')

  const { account } = req.params

  const pools = await Position.distinct('pool', { chain: network.name, owner: account }).lean()

  res.json(pools)
})

account.get('/:account/positions', async (req, res) => {
  const network: Network = req.app.get('network')

  const { account } = req.params

  // Closed/not closed
  // TODO Not closed
  const positions = await Position.find({ chain: network.name, owner: account }).lean()

  const fullPositions = []
  for (const position of positions) {
    const stats = await getPositionStats(network.name, position.pool, position.id, position.owner)
    fullPositions.push({ ...position, ...stats })
  }

  res.json(fullPositions)
})
