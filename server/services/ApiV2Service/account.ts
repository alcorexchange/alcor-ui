import JSBI from 'jsbi'
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
  let liquidity = JSBI.BigInt(0)
  let collectedFees = { tokenA: 0, tokenB: 0, inUSD: 0 }

  //console.log()

  for (const h of history) {
    if (h.type === 'burn') {
      liquidity = JSBI.subtract(liquidity, JSBI.BigInt(h.liquidity))
      sub += h.totalUSDValue
    }

    if (h.type === 'mint') {
      liquidity = JSBI.add(liquidity, JSBI.BigInt(h.liquidity))
      total += h.totalUSDValue
    }

    if (h.type === 'collect') {
      collectedFees.tokenA += h.tokenA
      collectedFees.tokenB += h.tokenB
      collectedFees.inUSD += h.totalUSDValue
      sub += h.totalUSDValue
    }

    if (h.type == 'mint') total += h.totalUSDValue

    // Might be after close
    if (['burn', 'collect'].includes(h.type)) sub += h.totalUSDValue
  }

  const absoluteTotal = +(total - sub).toFixed(4)

  let closed = JSBI.equal(liquidity, JSBI.BigInt(0))

  return { absoluteTotal, closed, collectedFees }
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
    fullPositions.push({ ...position, stats })
  }

  res.json(fullPositions)
})
