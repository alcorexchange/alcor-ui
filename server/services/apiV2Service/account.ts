import bigInt from 'big-integer'
import { asset } from 'eos-common'
import { cacheSeconds } from 'route-cache'
import { Position as PositionClass } from '@alcorexchange/alcor-swap-sdk'

import { Router } from 'express'
import { Match, Swap, PositionHistory, Position } from '../../models'
import { getRedisPosition, getPoolInstance } from '../swapV2Service/utils'
import { getChainRpc, fetchAllRows } from '../../../utils/eosjs'
import { updatePool } from '../swapV2Service'
import { redis } from '../../utils'
import { getIncentives } from './farms'

// TODO Account validation
export const account = Router()
const PrecisionMultiplier = bigInt('1000000000000000000')

export async function getAccountPoolPositions(chain: string, account: string) {
  const startTime = performance.now()

  // Use owner index for fast lookup
  const accountPositions = JSON.parse(await redis().get(`positions_${chain}_owner_${account}`)) || []

  const tokenPrices = JSON.parse(await redis().get(`${chain}_token_prices`))
  const historyCache = new Map()

  const result = await Promise.all(accountPositions.map(async (position) => {
    try {
      const stats = await getPositionStats(chain, position, tokenPrices, historyCache)
      return { ...position, ...stats }
    } catch (err) {
      console.error(`Failed to get stats for position ${position.id}`, err)
      return null
    }
  }))

  const endTime = performance.now()
  console.log(`getAccountPoolPositions(${chain}: ${account}):`, `${Math.round(endTime - startTime)}ms`)

  return result.filter(Boolean)
}

async function getCurrentPositionState(chain, plainPosition, tokenPrices = null) {
  const pool = await getPoolInstance(chain, plainPosition.pool)
  const position = new PositionClass({ ...plainPosition, pool })

  const inRange = position.inRange
  const amountA = position.amountA.toAsset()
  const amountB = position.amountB.toAsset()

  let fees
  try {
    fees = await position.getFees()
  } catch (e) {
    console.log(`Error get fees for position(${chain}): `, plainPosition)
    await updatePool(chain, plainPosition.pool)
    throw e
  }

  const feesA = fees.feesA.toAsset()
  const feesB = fees.feesB.toAsset()

  // 🧠 грузим только если не передали
  const tokens = tokenPrices || JSON.parse(await redis().get(`${chain}_token_prices`))

  const tokenA = tokens.find(t => t.id === position.pool.tokenA.id)
  const tokenB = tokens.find(t => t.id === position.pool.tokenB.id)

  const tokenAUSDPrice = tokenA?.usd_price || 0
  const tokenBUSDPrice = tokenB?.usd_price || 0

  const totalFeesUSD = parseFloat(feesA) * tokenAUSDPrice + parseFloat(feesB) * tokenBUSDPrice
  const totalValue =
    parseFloat(position.amountA.toFixed()) * tokenAUSDPrice +
    parseFloat(position.amountB.toFixed()) * tokenBUSDPrice +
    totalFeesUSD

  return {
    inRange,
    feesA,
    feesB,
    amountA,
    amountB,
    totalValue: parseFloat(totalValue.toFixed(2)),
    totalFeesUSD: parseFloat(totalFeesUSD.toFixed(2))
  }
}

export async function getPositionStats(
  chain: string,
  redisPosition,
  tokenPrices = null,
  historyCache: Map<string, any[]> = new Map()
) {
  const idKey = `${chain}:${redisPosition.id}:${redisPosition.owner}`

  let history: any[]
  if (historyCache.has(idKey)) {
    history = historyCache.get(idKey)
  } else {
    history = await PositionHistory.find({
      chain,
      id: redisPosition.id,
      owner: redisPosition.owner
    }).sort({ time: 1, type: 1 }).lean()

    historyCache.set(idKey, history)
  }

  let mintedUSD = 0
  let burnedUSD = 0
  let liquidity = BigInt(0)
  const collectedFees = { tokenA: 0, tokenB: 0, inUSD: 0, lastCollectTime: null }

  for (const h of history) {
    const eventUSD = Number(h.totalUSDValue || 0)

    if (h.type === 'burn') {
      liquidity -= BigInt(h.liquidity)
      burnedUSD += eventUSD
    }

    if (h.type === 'mint') {
      liquidity += BigInt(h.liquidity)
      mintedUSD += eventUSD
    }

    if (h.type === 'collect') {
      collectedFees.tokenA += h.tokenA
      collectedFees.tokenB += h.tokenB
      collectedFees.inUSD += eventUSD
      collectedFees.lastCollectTime = h.time
    }
  }

  // Net liquidity capital still invested into the position (mints - burns).
  const depositedUSDTotal = +(mintedUSD - burnedUSD).toFixed(4)
  const closed = liquidity === BigInt(0)

  const stats = { depositedUSDTotal, closed, collectedFees }

  let current: { feesA: string, feesB: string, totalValue: number, totalFeesUSD: number, pNl?: number } = {
    feesA: '0.0000',
    feesB: '0.0000',
    totalValue: 0,
    totalFeesUSD: 0,
    pNl: 0
  }

  if (redisPosition) {
    current = await getCurrentPositionState(chain, redisPosition, tokenPrices)
    // Temporary pragmatic PnL: fees-only (claimed + currently unclaimed),
    // without principal mark-to-market effects.
    current.pNl = +((current.totalFeesUSD + collectedFees.inUSD).toFixed(4))
  }

  return { ...stats, ...current }
}

async function loadUserFarms(network: Network, account: string) {
  const rpc = getChainRpc(network.name)
  const positions = await getAccountPoolPositions(network.name, account)

  const positionIds = positions.map(p => Number(p.id))
  const positionMap = new Map(positions.map(p => [Number(p.id), p]))

  const stakingposRequests = positionIds.map(posId =>
    fetchAllRows(rpc, {
      code: network.amm.contract,
      scope: network.amm.contract,
      table: 'stakingpos',
      lower_bound: posId,
      upper_bound: posId
    })
  )

  const stakingRows = (await Promise.all(stakingposRequests)).flat()

  const stakedPositions = stakingRows.filter(i => positionIds.includes(i.posId))
  const farmPositions = []

  for (const sp of stakedPositions) {
    const pos = positionMap.get(sp.posId)
    if (pos) {
      pos.incentiveIds = sp.incentiveIds
      farmPositions.push(pos)
    }
  }

  const userIncentiveIds = [...new Set(farmPositions.flatMap(p => p.incentiveIds))]

  const stakeRequests = userIncentiveIds.map(async (scope) => {
    const rows = await fetchAllRows(rpc, {
      code: network.amm.contract,
      scope,
      table: 'stakes',
      lower_bound: Math.min(...positionIds),
      upper_bound: Math.max(...positionIds)
    })

    return rows
      .filter(r => positionIds.includes(r.posId))
      .map(r => {
        const pos = positionMap.get(r.posId)
        return {
          ...r,
          incentiveId: scope,
          incentive: scope,
          pool: pos?.pool,
          poolStats: pos?.pool
        }
      })
  })

  const userStakes = (await Promise.all(stakeRequests)).flat()

  return userStakes
}

const getLastTimeRewardApplicable = periodFinish => {
  const currentTime = Math.floor(Date.now() / 1000)
  return currentTime < periodFinish ? currentTime : periodFinish
}

const getRewardPerToken = incentive => {
  const totalStakingWeight = bigInt(incentive.totalStakingWeight)
  const rewardPerTokenStored = bigInt(incentive.rewardPerTokenStored)
  const periodFinish = incentive.periodFinish
  const lastUpdateTime = bigInt(incentive.lastUpdateTime)
  const rewardRateE18 = bigInt(incentive.rewardRateE18)

  if (totalStakingWeight.eq(0)) {
    return rewardPerTokenStored
  }

  return rewardPerTokenStored.add(
    bigInt(getLastTimeRewardApplicable(periodFinish)).subtract(lastUpdateTime)
      .multiply(rewardRateE18).divide(totalStakingWeight)
  )
}

function calculateUserFarms(incentives, plainUserStakes) {
  const userStakes = []

  const positionMap = new Map()
  for (const stake of plainUserStakes) {
    positionMap.set(stake.posId, stake)
  }

  for (const r of plainUserStakes) {
    // ⚠ здесь была ошибка: ты писал `=` вместо `===` в find
    r.incentive = incentives.find(i => i.id === r.incentive)

    const totalStakingWeight = r.incentive.totalStakingWeight
    const stakingWeight = bigInt(r.stakingWeight)
    const userRewardPerTokenPaid = bigInt(r.userRewardPerTokenPaid)
    const rewards = bigInt(r.rewards)

    const reward = stakingWeight
      .multiply(getRewardPerToken(r.incentive).subtract(userRewardPerTokenPaid))
      .divide(PrecisionMultiplier)
      .add(rewards)

    const rewardToken = asset(r.incentive.reward.quantity)
    rewardToken.set_amount(reward)
    r.farmedReward = rewardToken.to_string()

    r.userSharePercent =
      Math.round(parseFloat(stakingWeight.toString()) * 100 /
      bigInt.max(totalStakingWeight, 1).toJSNumber() * 10000) / 10000

    r.dailyRewards = r.incentive.isFinished
      ? 0
      : r.incentive.rewardPerDay * r.userSharePercent / 100

    r.dailyRewards += ' ' + r.incentive.reward.quantity.split(' ')[1]

    // 🧠 Берём из Map вместо .find
    const pos = positionMap.get(r.posId)
    if (pos) {
      r.pool = pos.pool
      r.poolStats = pos.pool
    }

    r.incentive = r.incentive.id

    userStakes.push(r)
  }

  return userStakes
}

account.get('/:account', async (req, res) => {
  const network: Network = req.app.get('network')

  const { account } = req.params

  res.json({ account, todo: 'some account data' })
})

account.get('/:account/deals', async (req, res) => {
  const network = req.app.get('network')
  const { account } = req.params
  const { from, to, limit = 500, skip = 0, market } = req.query

  const baseMatch: any = { chain: network.name }

  if (typeof market == 'string') {
    baseMatch.market = parseInt(market, 10)
  }

  if (typeof from == 'string' && typeof to == 'string') {
    baseMatch.time = {
      $gte: new Date(parseFloat(from) * 1000),
      $lte: new Date(parseFloat(to) * 1000),
    }
  }

  // Запрос для asker
  const askerQuery: any = [
    { $match: { ...baseMatch, asker: account } },
    { $sort: { time: -1 } },
    {
      $project: {
        time: 1,
        bid: 1,
        ask: 1,
        unit_price: 1,
        trx_id: 1,
        market: 1,
        type: 1,
        bidder: 1,
        asker: 1,
      },
    },
    { $skip: parseInt(String(skip)) },
    { $limit: parseInt(String(limit)) },
  ]

  // Запрос для bidder
  const bidderQuery: any = [
    { $match: { ...baseMatch, bidder: account } },
    { $sort: { time: -1 } },
    {
      $project: {
        time: 1,
        bid: 1,
        ask: 1,
        unit_price: 1,
        trx_id: 1,
        market: 1,
        type: 1,
        bidder: 1,
        asker: 1,
      },
    },
    { $skip: parseInt(String(skip), 10) },
    { $limit: parseInt(String(limit), 10) },
  ]

  try {
    // Параллельное выполнение обоих запросов
    const [askerResults, bidderResults] = await Promise.all([Match.aggregate(askerQuery), Match.aggregate(bidderQuery)])

    // Объединяем результаты и сортируем по времени
    const combinedResults = [...askerResults, ...bidderResults]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, parseInt(String(limit)))

    res.json(combinedResults)
  } catch (error) {
    console.error('Error fetching deals:', error)
    res.status(500).json({ error: 'An error occurred while fetching deals.' })
  }
})

account.get('/:account/poolsPositionsIn', async (req, res) => {
  const network: Network = req.app.get('network')

  const { account } = req.params

  const pools = await Position.distinct('pool', { chain: network.name, owner: account }).lean()

  res.json(pools)
})

account.get('/:account/positions', async (req, res) => {
  const network: Network = req.app.get('network')
  const account = req.params.account

  try {
    const historyCache = new Map()
    const tokenPrices = JSON.parse(await redis().get(`${network.name}_token_prices`))

    // Use owner index for fast lookup
    const accountPositions = JSON.parse(await redis().get(`positions_${network.name}_owner_${account}`)) || []

    const result = await Promise.all(accountPositions.map(async (position) => {
      try {
        const stats = await getPositionStats(network.name, position, tokenPrices, historyCache)
        return { ...position, ...stats }
      } catch (err) {
        console.error('Error calculating position stats:', err)
        return null
      }
    }))

    res.json(result.filter(Boolean))
  } catch (err) {
    console.error('Error in /positions:', err)
    res.status(500).json({ error: 'Failed to load positions' })
  }
})

account.get('/:account/farms', cacheSeconds(2, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')

  const incentives = await getIncentives(network)
  const plainFarms = await loadUserFarms(network, req.params.account)
  const stakes = calculateUserFarms(incentives, plainFarms)

  res.json(stakes)
})

account.get('/:account/positions-stats', async (req, res) => {
  const network: Network = req.app.get('network')
  const { account } = req.params

  try {
    const ids = await PositionHistory.distinct('id', {
      chain: network.name,
      owner: account
    }).lean()

    const tokenPrices = JSON.parse(await redis().get(`${network.name}_token_prices`))
    const historyCache = new Map()

    const fullPositions = await Promise.all(ids.map(async (id) => {
      try {
        const redisPosition = await getRedisPosition(network.name, id)
        if (!redisPosition) {
          console.warn('NO FOUND POSITION FOR EXISTING HISTORY:', network.name, id)
          return null
        }

        const stats = await getPositionStats(network.name, redisPosition, tokenPrices, historyCache)
        return { id, ...stats }
      } catch (err) {
        console.error('Error processing position stats:', id, err)
        return null
      }
    }))

    res.json(fullPositions.filter(Boolean))
  } catch (err) {
    console.error('Error in /positions-stats:', err)
    res.status(500).json({ error: 'Failed to fetch positions stats' })
  }
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

  const senderPositions = await Swap.find({ chain: network.name, sender: account })
    .sort({ time: -1 })
    .skip(skip)
    .limit(limit)
    .select('sender receiver pool time tokenA tokenB totalUSDVolume sqrtPriceX64 trx_id type')
    .lean()

  const recipientPositions = await Swap.find({ chain: network.name, recipient: account })
    .sort({ time: -1 })
    .skip(skip)
    .limit(limit)
    .select('sender receiver pool time tokenA tokenB totalUSDVolume sqrtPriceX64 trx_id type')
    .lean()

  // Объедините результаты и отсортируйте их по времени
  const combinedPositions = [...senderPositions, ...recipientPositions]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, limit)

  res.json(combinedPositions)
})
