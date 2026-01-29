import bigInt from 'big-integer'
import { Asset } from '@wharfkit/antelope'
import { Router } from 'express'
import { cacheSeconds } from 'route-cache'
import { Token, TickMath, TICK_SPACINGS, nearestUsableTick, tickToPrice } from '@alcorexchange/alcor-swap-sdk'

import { getChainRpc, fetchAllRows } from '../../../utils/eosjs'
import { parseAssetPlain } from '../../../utils'
import { getIncentives } from '../apiV2Service/farms'
import { getAccountPoolPositions } from '../apiV2Service/account'
import { SwapPool } from '../../models'
import { redis } from '../../utils'

export const amm = Router()
const PrecisionMultiplier = bigInt('1000000000000000000')

function formatAmount(value, decimals) {
  if (value === null || value === undefined) return '0'
  const num = Number(value)
  if (!Number.isFinite(num)) return '0'
  const maxDecimals = Math.min(Math.max(decimals ?? 0, 0), 8)
  return num.toLocaleString('en', { maximumFractionDigits: maxDecimals })
}

function formatAssetAmount(assetString) {
  if (!assetString || typeof assetString !== 'string') return '0'
  const [amount] = assetString.split(' ')
  const decimals = amount.includes('.') ? amount.split('.')[1].length : 0
  return formatAmount(amount, decimals)
}

function getLogoUrl(networkName, tokenId) {
  if (!tokenId) return null
  return `https://${networkName}.alcor.exchange/api/v2/tokens/${tokenId}/logo`
}

function isTicksAtLimit(fee, tickLower, tickUpper) {
  if (!fee || tickLower === null || tickUpper === null) {
    return { LOWER: false, UPPER: false }
  }
  const spacing = TICK_SPACINGS[fee]
  if (!spacing) return { LOWER: false, UPPER: false }
  return {
    LOWER: tickLower === nearestUsableTick(TickMath.MIN_TICK, spacing),
    UPPER: tickUpper === nearestUsableTick(TickMath.MAX_TICK, spacing),
  }
}

function getRewardPerToken(incentive) {
  const totalStakingWeight = bigInt(incentive.totalStakingWeight)
  const rewardPerTokenStored = bigInt(incentive.rewardPerTokenStored)
  const periodFinish = incentive.periodFinish
  const lastUpdateTime = bigInt(incentive.lastUpdateTime)
  const rewardRateE18 = bigInt(incentive.rewardRateE18)

  if (totalStakingWeight.eq(0)) {
    return rewardPerTokenStored
  }

  const currentTime = Math.floor(Date.now() / 1000)
  const lastTimeRewardApplicable = currentTime < periodFinish ? currentTime : periodFinish

  return rewardPerTokenStored.add(
    bigInt(lastTimeRewardApplicable)
      .subtract(lastUpdateTime)
      .multiply(rewardRateE18)
      .divide(totalStakingWeight)
  )
}

function calcIncentiveApr(incentive, pool, tokensMap) {
  if (!pool || !tokensMap) return null

  try {
    const tokenAKey = pool.tokenA.id
    const tokenBKey = pool.tokenB.id
    const tokenA = tokensMap.get(tokenAKey)
    const tokenB = tokensMap.get(tokenBKey)

    if (!tokenA || !tokenB) return null

    const tokenAQuantity = Asset.fromFloat(
      pool.tokenA.quantity,
      Asset.Symbol.fromParts(pool.tokenA.symbol, pool.tokenA.decimals)
    )
    const tokenBQuantity = Asset.fromFloat(
      pool.tokenB.quantity,
      Asset.Symbol.fromParts(pool.tokenB.symbol, pool.tokenB.decimals)
    )

    const absoluteTotalStaked = bigInt(tokenAQuantity.units.toString()).multiply(
      bigInt(tokenBQuantity.units.toString())
    )
    const denominator = absoluteTotalStaked.equals(0) ? bigInt(1) : absoluteTotalStaked
    const stakedPercent_bn = bigInt(incentive.totalStakingWeight)
      .multiply(100)
      .multiply(1000)
      .divide(denominator)
    const stakedPercent = stakedPercent_bn.toJSNumber() / 1000

    const tvlUSD = pool.tvlUSD * (stakedPercent / 100)
    if (!tvlUSD || tvlUSD <= 0) return 0

    const rewardPerDay = Number(incentive.rewardPerDay ?? 0)
    const rewardSymbol = incentive?.reward?.symbol?.symbol ?? incentive?.reward?.symbol
    const rewardContract = incentive?.reward?.contract
    const rewardTokenId = rewardSymbol && rewardContract ? `${String(rewardSymbol).toLowerCase()}-${rewardContract}` : null
    const rewardToken = rewardTokenId ? tokensMap.get(rewardTokenId) : null
    const rewardTokenPrice = rewardToken?.usd_price ?? 0
    const dayRewardInUSD = rewardPerDay * rewardTokenPrice

    const apr = (dayRewardInUSD / tvlUSD) * 365 * 100
    return Number.isFinite(apr) ? Number(apr.toFixed(2)) : 0
  } catch (e) {
    return null
  }
}

async function loadUserStakes(network, positionIds) {
  if (!positionIds.length) return []
  const rpc = getChainRpc(network.name)

  const stakingposRequests = positionIds.map((posId) =>
    fetchAllRows(rpc, {
      code: network.amm.contract,
      scope: network.amm.contract,
      table: 'stakingpos',
      lower_bound: posId,
      upper_bound: posId,
    })
  )

  const stakingRows = (await Promise.all(stakingposRequests)).flat()
  const stakedPositions = stakingRows.filter((i) => positionIds.includes(i.posId))
  const incentiveIds = [...new Set(stakedPositions.flatMap((sp) => sp.incentiveIds || []))]

  const minPosId = Math.min(...positionIds)
  const maxPosId = Math.max(...positionIds)

  const stakeRequests = incentiveIds.map(async (scope) => {
    const rows = await fetchAllRows(rpc, {
      code: network.amm.contract,
      scope,
      table: 'stakes',
      lower_bound: minPosId,
      upper_bound: maxPosId,
    })

    return rows
      .filter((r) => positionIds.includes(r.posId))
      .map((r) => ({
        ...r,
        incentiveId: scope,
      }))
  })

  return (await Promise.all(stakeRequests)).flat()
}

amm.get('/account/:account/positions', cacheSeconds(2, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name + '|' + req.params.account
}), async (req, res) => {
  const network = req.app.get('network')
  const account = req.params.account
  const incentivesFilter = String(req.query?.incentives || 'active').toLowerCase()

  try {
    const positions = await getAccountPoolPositions(network.name, account)
    const positionIds = positions.map((p) => Number(p.id)).filter((id) => Number.isFinite(id))

    const poolIds = positions.map((p) => Number(p.pool)).filter((id) => Number.isFinite(id))
    const pools = await SwapPool.find({ chain: network.name, id: { $in: poolIds } }).lean()
    const poolMap = new Map(pools.map((p) => [Number(p.id), p]))

    const incentives = await getIncentives(network)
    const incentivesByPool = new Map()
    for (const incentive of incentives) {
      if (!incentivesByPool.has(incentive.poolId)) incentivesByPool.set(incentive.poolId, [])
      incentivesByPool.get(incentive.poolId).push(incentive)
    }

    const tokenPrices = JSON.parse(await redis().get(`${network.name}_token_prices`)) || []
    const tokensMap = new Map(tokenPrices.map((t) => [t.id, t]))

    const userStakes = await loadUserStakes(network, positionIds)
    const stakesByPos = new Map()
    for (const stake of userStakes) {
      if (!stakesByPos.has(stake.posId)) stakesByPos.set(stake.posId, [])
      stakesByPos.get(stake.posId).push(stake)
    }

    const response = positions.map((pos) => {
      const pool = poolMap.get(Number(pos.pool))
      if (!pool) return null

      const tokenA = pool.tokenA
      const tokenB = pool.tokenB
      const tokenAForSdk = new Token(tokenA.contract, tokenA.decimals, tokenA.symbol)
      const tokenBForSdk = new Token(tokenB.contract, tokenB.decimals, tokenB.symbol)

      const tickLower = Number(pos.tickLower)
      const tickUpper = Number(pos.tickUpper)
      const hasTicks = Number.isFinite(tickLower) && Number.isFinite(tickUpper)
      const limits = hasTicks ? isTicksAtLimit(pool.fee, tickLower, tickUpper) : { LOWER: false, UPPER: false }

      const priceLower = !hasTicks
        ? '-'
        : limits.LOWER
            ? '0'
            : tickToPrice(tokenAForSdk, tokenBForSdk, tickLower).toSignificant(5)
      const priceUpper = !hasTicks
        ? '-'
        : limits.UPPER
            ? 'INF'
            : tickToPrice(tokenAForSdk, tokenBForSdk, tickUpper).toSignificant(5)

      const stakeRows = stakesByPos.get(Number(pos.id)) || []
      const stakedIncentiveIds = new Set(stakeRows.map((s) => s.incentiveId))

      let poolIncentives = (incentivesByPool.get(pool.id) || []).map((inc) => {
        const stake = stakeRows.find((s) => s.incentiveId === inc.id)
        const apr = calcIncentiveApr(inc, pool, tokensMap)
        const staked = stakedIncentiveIds.has(inc.id)

        let userSharePercent = null
        let dailyRewards = null
        let farmedReward = null

        if (stake) {
          const totalStakingWeight = bigInt(inc.totalStakingWeight)
          const stakingWeight = bigInt(stake.stakingWeight)
          const userRewardPerTokenPaid = bigInt(stake.userRewardPerTokenPaid)
          const rewards = bigInt(stake.rewards)

          const reward = stakingWeight
            .multiply(getRewardPerToken(inc).subtract(userRewardPerTokenPaid))
            .divide(PrecisionMultiplier)
            .add(rewards)

          if (!totalStakingWeight.eq(0)) {
            userSharePercent =
              Math.round(parseFloat(stakingWeight.toString()) * 100 /
                totalStakingWeight.toJSNumber() * 10000) / 10000
          } else {
            userSharePercent = 0
          }

          const rewardSymbol = inc.reward?.symbol?.symbol ?? inc.reward?.symbol
          const rewardPrecision = inc.reward?.symbol?.precision ?? 0

          const rewardAsset = Asset.fromUnits(
            reward.toString(),
            Asset.Symbol.fromParts(rewardSymbol, rewardPrecision)
          )
          farmedReward = rewardAsset.toString()

          const daily = inc.isFinished
            ? 0
            : (inc.rewardPerDay * userSharePercent / 100)
          dailyRewards = `${Number(daily).toFixed(rewardPrecision)} ${rewardSymbol}`
        }

        const rewardSymbol = inc.reward?.symbol?.symbol ?? inc.reward?.symbol
        const rewardContract = inc.reward?.contract
        const rewardTokenId = rewardSymbol && rewardContract ? `${String(rewardSymbol).toLowerCase()}-${rewardContract}` : null

        return {
          id: inc.id,
          rewardPerDay: inc.rewardPerDay,
          reward: inc.reward?.quantity,
          rewardSymbol,
          rewardTokenId,
          daysRemain: inc.daysRemain,
          isFinished: inc.isFinished,
          apr,
          staked,
          userSharePercent,
          dailyRewards,
          farmedReward,
        }
      })

      if (incentivesFilter === 'active') {
        poolIncentives = poolIncentives.filter((i) => !i.isFinished)
      } else if (incentivesFilter === 'finished') {
        poolIncentives = poolIncentives.filter((i) => i.isFinished)
      }

      const stakeStatus = poolIncentives.length === 0
        ? null
        : poolIncentives.every((i) => i.staked)
            ? 'staked'
            : poolIncentives.some((i) => i.staked)
                ? 'partiallyStaked'
                : 'notStaked'

      const availableIncentives = poolIncentives.filter((i) => !i.isFinished && !i.staked)

      const amountA = typeof pos.amountA === 'string' ? parseAssetPlain(pos.amountA).amount : pos.amountA
      const amountB = typeof pos.amountB === 'string' ? parseAssetPlain(pos.amountB).amount : pos.amountB

      return {
        id: String(pos.id),
        owner: pos.owner,
        poolId: pool.id,
        feePct: pool.fee / 10000,
        inRange: Boolean(pos.inRange),
        priceLower,
        priceUpper,
        amountA: formatAmount(amountA, tokenA.decimals),
        amountB: formatAmount(amountB, tokenB.decimals),
        totalValueUSD: Number(pos.totalValue ?? 0),
        totalFeesUSD: Number(pos.totalFeesUSD ?? 0),
        feesA: formatAssetAmount(pos.feesA),
        feesB: formatAssetAmount(pos.feesB),
        tokenA: {
          symbol: tokenA.symbol,
          contract: tokenA.contract,
          decimals: tokenA.decimals,
          id: tokenA.id,
        },
        tokenB: {
          symbol: tokenB.symbol,
          contract: tokenB.contract,
          decimals: tokenB.decimals,
          id: tokenB.id,
        },
        farm: {
          stakeStatus,
          activeIncentives: poolIncentives.filter((i) => !i.isFinished).length,
          incentives: poolIncentives,
          availableIncentives,
        },
      }
    }).filter(Boolean)

    res.json(response)
  } catch (err) {
    console.error('Error in v3 positions:', err)
    res.status(500).json({ error: 'Failed to load positions' })
  }
})
