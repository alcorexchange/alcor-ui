import JSBI from 'jsbi'
import { Router } from 'express'
import { createClient } from 'redis'
import { Swap, SwapPool, PositionHistory, Position } from '../../models'
import { getRedisPosition, getPoolInstance } from '../swapV2Service/utils'

import { Position as PositionClass } from '../../../assets/libs/swap-sdk/entities/position'

// TODO Account validation
export const account = Router()

const redis = createClient()


async function getCurrentPositionState(chain, plainPosition) {
  const pool = await getPoolInstance(chain, plainPosition.pool)

  const position = new PositionClass({ ...plainPosition, pool })
  const fees = await position.getFees()

  const feesA = fees.feesA.toFixed()
  const feesB = fees.feesB.toFixed()

  const tokens = JSON.parse(await redis.get(`${chain}_token_prices`))

  const tokenA = tokens.find(t => t.id == position.pool.tokenA.id)
  const tokenB = tokens.find(t => t.id == position.pool.tokenB.id)

  const tokenAUSDPrice = tokenA?.usd_price || 0
  const tokenBUSDPrice = tokenB?.usd_price || 0

  const totalValue =
    parseFloat(position.amountA.toFixed()) * tokenAUSDPrice +
    parseFloat(position.amountB.toFixed()) * tokenBUSDPrice +
    parseFloat(feesA) * tokenAUSDPrice +
    parseFloat(feesB) * tokenBUSDPrice

  return {
    feesA,
    feesB,
    totalValue: parseFloat(totalValue.toFixed(2))
  }
}


async function getPositionStats(chain, id, owner, redisPosition) {
  if (!redis.isOpen) await redis.connect()
  // Will sort "closed" to the end
  const history = await PositionHistory.find({ chain, id, owner }).sort({ time: 1, type: 1 }).lean()

  let total = 0
  let sub = 0
  let liquidity = JSBI.BigInt(0)
  let collectedFees = { tokenA: 0, tokenB: 0, inUSD: 0 }

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
      //sub += h.totalUSDValue
    }

    // Might be after close
    if (['burn', 'collect'].includes(h.type)) sub += h.totalUSDValue
  }

  const depositedUSDTotal = +(total - sub).toFixed(4)
  let closed = JSBI.equal(liquidity, JSBI.BigInt(0))

  const stats = { depositedUSDTotal, closed, collectedFees }

  let current: { feesA: string, feesB: string, totalValue: number, pNl?: number } = { feesA: '0.0000', feesB: '0.0000', totalValue: 0 }

  if (redisPosition) {
    current = await getCurrentPositionState(chain, redisPosition)
    current.pNl = (current.totalValue + collectedFees.inUSD) - depositedUSDTotal
  }

  return { ...stats, ...current }
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
  const redis = req.app.get('redisClient')

  const positions = JSON.parse(await redis.get(`positions_${network.name}`))

  res.json(positions.filter(p => p.owner == req.params.account))
})

account.get('/:account/positions-stats', async (req, res) => {
  const network: Network = req.app.get('network')

  const { account } = req.params

  const positions = await PositionHistory.distinct('id', { chain: network.name, owner: account }).lean()

  const fullPositions = []
  for (const id of positions) {
    const redisPosition = await getRedisPosition(network.name, id)

    const stats = await getPositionStats(network.name, id, account, redisPosition)
    fullPositions.push({ id, ...stats })
  }

  res.json(fullPositions)
})

account.get('/:account/positions-history', async (req, res) => {
  const network: Network = req.app.get('network')
  const { account } = req.params

  const limit = parseInt(String(req.query?.limit) || '200')
  const skip = parseInt(String(req.query?.skip) || '0')

  const positions = await PositionHistory.find({ chain: network.name, owner: account })
    .sort({ time: -1 })
    .skip(skip).limit(limit).select('id owner pool time tokenA tokenAUSDPrice tokenB tokenBUSDPrice totalUSDValue trx_id type').lean()

  res.json(positions)
})

account.get('/:account/swap-history', async (req, res) => {
  const network: Network = req.app.get('network')
  const { account } = req.params

  const limit = parseInt(String(req.query?.limit) || '200')
  const skip = parseInt(String(req.query?.skip) || '0')

  const positions = await Swap.find({ chain: network.name, $or: [{ sender: account }, { recipient: account }] })
    .sort({ time: -1 })
    .skip(skip).limit(limit).select('sender receiver pool time tokenA tokenB totalUSDVolume sqrtPriceX64 trx_id type').lean()

  res.json(positions)
})
