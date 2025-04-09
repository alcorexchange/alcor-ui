import bigInt from 'big-integer'
import { asset } from 'eos-common'
import { cacheSeconds } from 'route-cache'
import { Position as PositionClass } from '@alcorexchange/alcor-swap-sdk'

import { Router } from 'express'
import { createClient } from 'redis'
import { Match, Swap, PositionHistory, Position } from '../../models'
import { getRedisPosition, getPoolInstance } from '../swapV2Service/utils'
import { getChainRpc, fetchAllRows } from '../../../utils/eosjs'
import { updatePool } from '../swapV2Service'
import { getIncentives } from './farms'

// TODO Account validation
export const account = Router()

const redis = createClient()
const publisher = redis.duplicate()

const PrecisionMultiplier = bigInt('1000000000000000000')

export async function getAccountPoolPositions(chain: string, account: string) {
  const startTime = performance.now()

  if (!redis.isOpen) await redis.connect()
  const positions = JSON.parse(await redis.get(`positions_${chain}`)) || []

  const result = []
  for (const position of positions.filter(p => p.owner == account)) {
    const stats = await getPositionStats(chain, position)

    result.push({ ...position, ...stats })
  }

  const endTime = performance.now()

  console.log(`getAccountPoolPositions(${chain}: ${account}):`, `${Math.round(endTime - startTime)}ms`)

  return result
}

async function getCurrentPositionState(chain, plainPosition) {
  const pool = await getPoolInstance(chain, plainPosition.pool)

  const position = new PositionClass({ ...plainPosition, pool })

  // console.log(pool.tickDataProvider)
  // console.log(position)

  const inRange = position.inRange
  const amountA = position.amountA.toAsset()
  const amountB = position.amountB.toAsset()

  let fees
  try {
    fees = await position.getFees()
  } catch (e) {
    console.log(`Error get fees for position(${chain}): `, plainPosition)
    await updatePool(chain, plainPosition.id)
    throw e
  }

  const feesA = fees.feesA.toAsset()
  const feesB = fees.feesB.toAsset()

  const tokens = JSON.parse(await redis.get(`${chain}_token_prices`))

  const tokenA = tokens.find(t => t.id == position.pool.tokenA.id)
  const tokenB = tokens.find(t => t.id == position.pool.tokenB.id)

  const tokenAUSDPrice = tokenA?.usd_price || 0
  const tokenBUSDPrice = tokenB?.usd_price || 0

  const totalFeesUSD = (parseFloat(feesA) * tokenAUSDPrice) + (parseFloat(feesB) * tokenBUSDPrice)

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

export async function getPositionStats(chain, redisPosition) {
  if (!redis.isOpen) await redis.connect()
  // Will sort "closed" to the end
  const startTime = performance.now()
  const history = await PositionHistory.find({ chain, id: redisPosition.id, owner: redisPosition.owner }).sort({ time: 1, type: 1 }).lean()
  const endTime = performance.now()

  // console.log('getAccountPoolPositions mongo query time:', `${Math.round(endTime - startTime)}ms`,
  //   { chain, id: redisPosition.id, owner: redisPosition.owner }
  // )

  let total = 0
  let sub = 0
  let liquidity = BigInt(0)
  const collectedFees = { tokenA: 0, tokenB: 0, inUSD: 0, lastCollectTime: null }

  for (const h of history) {
    if (h.type === 'burn') {
      liquidity = liquidity - BigInt(h.liquidity)
      sub += h.totalUSDValue
    }

    if (h.type === 'mint') {
      liquidity = liquidity + BigInt(h.liquidity)
      total += h.totalUSDValue
    }

    if (h.type === 'collect') {
      collectedFees.tokenA += h.tokenA
      collectedFees.tokenB += h.tokenB
      collectedFees.inUSD += h.totalUSDValue
      collectedFees.lastCollectTime = h.time
    }

    // Might be after close
    if (['burn', 'collect'].includes(h.type)) sub += h.totalUSDValue
  }

  const depositedUSDTotal = +(total - sub).toFixed(4)
  const closed = liquidity == BigInt(0)

  const stats = { depositedUSDTotal, closed, collectedFees }

  let current: { feesA: string, feesB: string, totalValue: number, pNl?: number } = { feesA: '0.0000', feesB: '0.0000', totalValue: 0 }

  if (redisPosition) {
    current = await getCurrentPositionState(chain, redisPosition)
    // pNL is not cout current fees
    current.pNl = (current.totalValue + collectedFees.inUSD) - depositedUSDTotal
  }

  return { ...stats, ...current }
}

async function loadUserFarms(network: Network, account: string) {
  const rpc = getChainRpc(network.name)
  const positions = await getAccountPoolPositions(network.name, account)

  const positionIds = positions.map(p => Number(p.id))

  const stakingpos_requests = positionIds.map(posId => {
    return fetchAllRows(rpc, {
      code: network.amm.contract,
      scope: network.amm.contract,
      table: 'stakingpos',
      lower_bound: posId,
      upper_bound: posId
    })
  })

  const rows = (await Promise.all(stakingpos_requests)).flat(1)

  //const rows = stakingpos_requests.flat(2)
  //console.log({ rows })
  // const rows = await fetchAllRows(this.$rpc, {
  //   code: rootState.network.amm.contract,
  //   scope: rootState.network.amm.contract,
  //   table: 'stakingpos',
  //   lower_bound: Math.min(positionIds),
  //   upper_bound: Math.max(positionIds)
  // })

  const farmPositions = []
  const stakedPositions = rows.filter(i => positionIds.includes(i.posId))

  for (const sp of stakedPositions) {
    const position = positions.find(p => p.id == sp.posId)
    position.incentiveIds = sp.incentiveIds

    farmPositions.push(position)
  }

  const userUnicueIncentives = [...new Set(farmPositions.map(p => p.incentiveIds).flat(1))]

  // Fetching stakes amounts of positions
  const userStakes = []
  for (const incentiveScope of userUnicueIncentives) {
    const rows = await fetchAllRows(rpc, {
      code: network.amm.contract,
      scope: incentiveScope,
      table: 'stakes',
      lower_bound: Math.min(...positionIds),
      upper_bound: Math.max(...positionIds)
    })

    const stakes = rows.filter(r => positionIds.includes(r.posId)).map(r => {
      r.incentiveId = incentiveScope
      r.incentive = incentiveScope
      r.pool = positions.find(p => p.id == r.posId).pool
      r.poolStats = positions.find(p => p.id == r.posId).pool
      return r
    })

    userStakes.push(...stakes)
  }

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

  for (const r of plainUserStakes) {
    r.incentive = incentives.find(i => i.id = r.incentive)
    const totalStakingWeight = r.incentive.totalStakingWeight
    const stakingWeight = bigInt(r.stakingWeight)
    const userRewardPerTokenPaid = bigInt(r.userRewardPerTokenPaid)
    const rewards = bigInt(r.rewards)

    //console.log(stakingWeight.toString(), totalStakingWeight.toString())

    const reward = stakingWeight.multiply(
      getRewardPerToken(r.incentive).subtract(userRewardPerTokenPaid)).divide(PrecisionMultiplier).add(rewards)

    const rewardToken = asset(r.incentive.reward.quantity)

    rewardToken.set_amount(reward)
    r.farmedReward = rewardToken.to_string()

    //r.userSharePercent = stakingWeight.multiply(100).divide(bigInt.max(totalStakingWeight, 1)).toJSNumber()
    r.userSharePercent = Math.round(parseFloat(stakingWeight.toString()) * 100 / bigInt.max(totalStakingWeight, 1).toJSNumber() * 10000) / 10000
    r.dailyRewards = r.incentive.isFinished ? 0 : r.incentive.rewardPerDay * r.userSharePercent / 100
    r.dailyRewards += ' ' + r.incentive.reward.quantity.split(' ')[1]

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

account.get('/:account/positions', cacheSeconds(2, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name + '|' + req.params.account
}), async (req, res) => {
  const network: Network = req.app.get('network')

  const result = await getAccountPoolPositions(network.name, req.params.account)

  res.json(result)
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

  const positions = await PositionHistory.distinct('id', { chain: network.name, owner: account }).lean()

  const fullPositions = []
  for (const id of positions) {
    const redisPosition = await getRedisPosition(network.name, id)

    if (!redisPosition) {
      console.log('NO FOUND POSITION FOR EXISTING HISTORY:', network.name, id)
      continue
    }

    const stats = await getPositionStats(network.name, redisPosition)
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
