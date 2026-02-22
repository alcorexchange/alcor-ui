import bigInt from 'big-integer'
import { Asset } from '@wharfkit/antelope'
import { Router } from 'express'
import { cacheSeconds } from 'route-cache'
import { Token, TickMath, TICK_SPACINGS, nearestUsableTick, tickToPrice } from '@alcorexchange/alcor-swap-sdk'

import { getChainRpc, fetchAllRows } from '../../../utils/eosjs'
import { parseAssetPlain } from '../../../utils'
import { getIncentives } from '../apiV2Service/farms'
import { getAccountPoolPositions, getPositionStats } from '../apiV2Service/account'
import { getRedisPosition } from '../swapV2Service/utils'
import { PositionHistory, SwapPool } from '../../models'
import { redis } from '../../utils'
import { sqrt } from '../../../utils/bigint'

export const amm = Router()
const PrecisionMultiplier = bigInt('1000000000000000000')
const APR_PERIOD_DAYS = 7
const HISTORY_DEFAULT_LIMIT = 100
const HISTORY_MAX_LIMIT = 500
const HISTORY_TYPES = new Set(['mint', 'burn', 'collect'])

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

function parseAssetAmount(assetString) {
  if (!assetString || typeof assetString !== 'string') return null
  const [amountStr, symbol] = assetString.split(' ')
  if (!amountStr || !symbol) return null
  const amount = Number(amountStr.replace(/,/g, ''))
  if (!Number.isFinite(amount)) return null
  const precision = amountStr.includes('.') ? amountStr.split('.')[1].length : 0
  return { amount, symbol, precision }
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

    const product = BigInt(tokenAQuantity.units.toString()) * BigInt(tokenBQuantity.units.toString())
    const absoluteTotalStaked = sqrt(product) || BigInt(1)
    const stakedPercent_bn = (BigInt(incentive.totalStakingWeight || 0) * BigInt(100) * BigInt(1000)) / absoluteTotalStaked
    const stakedPercent = Number(stakedPercent_bn) / 1000

    const tvlUSD = pool.tvlUSD * (stakedPercent / 100)
    const effectiveTvlUSD = tvlUSD > 0 ? tvlUSD : 1

    const rewardPerDay = Number(incentive.rewardPerDay ?? 0)
    const rewardSymbol = incentive?.reward?.symbol?.symbol ?? incentive?.reward?.symbol
    const rewardContract = incentive?.reward?.contract
    const rewardTokenId = rewardSymbol && rewardContract ? `${String(rewardSymbol).toLowerCase()}-${rewardContract}` : null
    const rewardToken = rewardTokenId ? tokensMap.get(rewardTokenId) : null
    const rewardTokenPrice = rewardToken?.usd_price ?? 0
    const dayRewardInUSD = rewardPerDay * rewardTokenPrice

    const apr = (dayRewardInUSD / effectiveTvlUSD) * 365 * 100
    return Number.isFinite(apr) ? Number(apr.toFixed(2)) : 0
  } catch (e) {
    return null
  }
}

function calcPoolSharePct(poolLiquidityValue, posLiquidityValue, inRange) {
  if (!inRange) return 0

  const poolLiquidity = bigInt(String(poolLiquidityValue ?? 0))
  const posLiquidity = bigInt(String(posLiquidityValue ?? 0))
  if (poolLiquidity.leq(0) || posLiquidity.leq(0)) return 0

  // Percent with 6 decimals precision: 100 * 1e6 = 1e8
  const scaled = posLiquidity.multiply(100000000).divide(poolLiquidity)
  return scaled.toJSNumber() / 1000000
}

function getPoolVolumeUSD(pool, days) {
  if (days === 1) return Number(pool?.volumeUSD24 ?? 0)
  if (days === 7) return Number(pool?.volumeUSDWeek ?? 0)
  if (days === 30) return Number(pool?.volumeUSDMonth ?? 0)
  return Number(pool?.volumeUSD24 ?? 0)
}

function getPoolLpFeeRate(pool) {
  const feeRate = Number(pool?.fee ?? 0) / 1000000
  if (!Number.isFinite(feeRate) || feeRate <= 0) return 0
  return feeRate
}

function calcEstimatedFeesUSD(pool, poolSharePct, days = 1) {
  const volume = getPoolVolumeUSD(pool, days)
  const lpFeeRate = getPoolLpFeeRate(pool)
  const shareRate = Number(poolSharePct ?? 0) / 100

  if (!Number.isFinite(volume) || volume <= 0) return 0
  if (!Number.isFinite(lpFeeRate) || lpFeeRate <= 0) return 0
  if (!Number.isFinite(shareRate) || shareRate <= 0) return 0

  return Number((volume * lpFeeRate * shareRate).toFixed(4))
}

function calcEstimatedFees24hUSD(pool, poolSharePct) {
  return calcEstimatedFeesUSD(pool, poolSharePct, 1)
}

function calcEstimatedFees7dUSD(pool, poolSharePct) {
  return calcEstimatedFeesUSD(pool, poolSharePct, APR_PERIOD_DAYS)
}

function calcAprFromFees(estimatedFeesUSD, totalValueUSD, periodDays = APR_PERIOD_DAYS) {
  const fees = Number(estimatedFeesUSD ?? 0)
  const tvl = Number(totalValueUSD ?? 0)
  if (!Number.isFinite(fees) || fees <= 0) return 0
  if (!Number.isFinite(tvl) || tvl <= 0) return 0

  const apr = (fees / tvl) * (365 / periodDays) * 100
  return Number.isFinite(apr) ? Number(apr.toFixed(2)) : 0
}

function calcPositionFarmApr(incentives) {
  const total = incentives
    .filter((i) => i?.staked && !i?.isFinished)
    .reduce((sum, i) => sum + Number(i?.apr ?? 0), 0)

  return Number.isFinite(total) ? Number(total.toFixed(2)) : 0
}

function parseTruthy(value) {
  if (value === undefined || value === null) return false
  const normalized = String(value).trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

function parseLimit(value, fallback = HISTORY_DEFAULT_LIMIT) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.min(Math.floor(n), HISTORY_MAX_LIMIT)
}

function parseOptionalInt(value) {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.floor(n)
}

function parseHistoryTypes(value): string[] {
  if (value === undefined || value === null || value === '') {
    return ['mint', 'burn', 'collect']
  }

  const values = String(value)
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)

  if (!values.length || values.includes('all')) {
    return ['mint', 'burn', 'collect']
  }

  const uniq = [...new Set(values)]
  const allowed = uniq.filter((t) => HISTORY_TYPES.has(t))

  return allowed.length ? allowed : ['mint', 'burn', 'collect']
}

function parseHistoryCursor(timeValue, idValue) {
  const timeNum = Number(timeValue)
  if (!Number.isFinite(timeNum)) return null

  const time = new Date(timeNum)
  if (Number.isNaN(time.getTime())) return null

  const id =
    typeof idValue === 'string' && /^[a-f0-9]{24}$/i.test(idValue.trim())
      ? idValue.trim()
      : null

  return { time, id }
}

function parseHistorySearch(value) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return null

  const poolId = /^\d+$/.test(raw) ? Number(raw) : null

  return {
    raw,
    lower: raw.toLowerCase(),
    upper: raw.toUpperCase(),
    poolId,
  }
}

async function resolvePoolIdsBySearch(networkName, search) {
  if (!search || search.poolId !== null) return null

  const pools = await SwapPool.find({
    chain: networkName,
    $or: [
      { 'tokenA.id': search.lower },
      { 'tokenB.id': search.lower },
      { 'tokenA.symbol': search.upper },
      { 'tokenB.symbol': search.upper },
      { 'tokenA.contract': search.lower },
      { 'tokenB.contract': search.lower },
    ],
  })
    .select('id -_id')
    .lean()

  return pools
    .map((p) => Number(p.id))
    .filter((id) => Number.isFinite(id))
}

function mapHistoryItem(item) {
  return {
    positionId: Number(item.id),
    poolId: Number(item.pool),
    owner: item.owner,
    type: item.type,
    tokenA: Number(item.tokenA || 0),
    tokenB: Number(item.tokenB || 0),
    tokenAUSDPrice: Number(item.tokenAUSDPrice || 0),
    tokenBUSDPrice: Number(item.tokenBUSDPrice || 0),
    totalUSDValue: Number(item.totalUSDValue || 0),
    liquidity: item.liquidity != null ? String(item.liquidity) : '0',
    trxId: item.trx_id,
    time: item.time,
  }
}

async function fetchHistoryPage(query, limit) {
  const rows = await PositionHistory.find(query)
    .sort({ time: -1, _id: -1 })
    .limit(limit + 1)
    .select('id pool owner type tokenA tokenAUSDPrice tokenB tokenBUSDPrice totalUSDValue liquidity trx_id time')
    .lean()

  const hasMore = rows.length > limit
  const slice = hasMore ? rows.slice(0, limit) : rows
  const items = slice.map(mapHistoryItem)

  let nextCursor = null
  if (hasMore && slice.length) {
    const last = slice[slice.length - 1] as any
    nextCursor = {
      cursorTime: new Date(last.time).getTime(),
      cursorId: String(last._id),
    }
  }

  return { items, pageInfo: { hasMore, nextCursor } }
}

function safeNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function buildPositionsSummary(items) {
  const totals = items.reduce((acc, item) => {
    acc.estimatedFees24hUSD += safeNumber(item?.estimatedFees24hUSD)
    acc.estimatedFees7dUSD += safeNumber(item?.estimatedFees7dUSD)
    acc.totalValueUSD += safeNumber(item?.totalValueUSD)
    acc.totalFeesUSD += safeNumber(item?.totalFeesUSD)
    acc.pnlUSD += safeNumber(item?.pnlUSD)
    return acc
  }, {
    estimatedFees24hUSD: 0,
    estimatedFees7dUSD: 0,
    totalValueUSD: 0,
    totalFeesUSD: 0,
    pnlUSD: 0,
  })

  return {
    positions: items.length,
    estimatedFees24hUSD: Number(totals.estimatedFees24hUSD.toFixed(4)),
    estimatedFees7dUSD: Number(totals.estimatedFees7dUSD.toFixed(4)),
    totalValueUSD: Number(totals.totalValueUSD.toFixed(4)),
    totalFeesUSD: Number(totals.totalFeesUSD.toFixed(4)),
    pnlUSD: Number(totals.pnlUSD.toFixed(4)),
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

async function buildPositionsResponse(network, positions, incentivesFilter) {
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
  const tokensMap = new Map<string, { usd_price?: number }>(
    tokenPrices.map((t) => [t.id, t])
  )

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

    const rawPoolIncentives = (incentivesByPool.get(pool.id) || []).map((inc) => {
      const stake = stakeRows.find((s) => s.incentiveId === inc.id)
      const apr = calcIncentiveApr(inc, pool, tokensMap)
      const staked = stakedIncentiveIds.has(inc.id)

      let userSharePercent = null
      let dailyRewards = null
      let farmedReward = null
      let hasClaimableReward = false

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
        hasClaimableReward = reward.gt(0)

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
        hasClaimableReward,
      }
    })
    let poolIncentives = rawPoolIncentives

    if (incentivesFilter === 'active') {
      poolIncentives = poolIncentives.filter((i) => !i.isFinished || i.hasClaimableReward)
    } else if (incentivesFilter === 'finished') {
      poolIncentives = poolIncentives.filter((i) => i.isFinished)
    }
    poolIncentives = poolIncentives.map(({ hasClaimableReward, ...rest }) => rest)

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
    const amountAUsd = Number(amountA || 0) * (tokensMap.get(tokenA.id)?.usd_price ?? 0)
    const amountBUsd = Number(amountB || 0) * (tokensMap.get(tokenB.id)?.usd_price ?? 0)
    const totalAmountsUsd = amountAUsd + amountBUsd
    const percentA = totalAmountsUsd > 0 ? (amountAUsd / totalAmountsUsd) * 100 : 0
    const percentB = totalAmountsUsd > 0 ? (amountBUsd / totalAmountsUsd) * 100 : 0

    const feesAParsed = parseAssetAmount(pos.feesA)
    const feesBParsed = parseAssetAmount(pos.feesB)
    const feesAUsd = feesAParsed
      ? feesAParsed.amount * (tokensMap.get(tokenA.id)?.usd_price ?? 0)
      : 0
    const feesBUsd = feesBParsed
      ? feesBParsed.amount * (tokensMap.get(tokenB.id)?.usd_price ?? 0)
      : 0

    const poolSharePct = calcPoolSharePct(pool.liquidity, pos.liquidity, Boolean(pos.inRange))
    const estimatedFees24hUSD = calcEstimatedFees24hUSD(pool, poolSharePct)
    const estimatedFees7dUSD = calcEstimatedFees7dUSD(pool, poolSharePct)
    const feeApr7d = calcAprFromFees(estimatedFees7dUSD, pos.totalValue, APR_PERIOD_DAYS)
    const farmApr = calcPositionFarmApr(rawPoolIncentives)
    const totalApr = Number((feeApr7d + farmApr).toFixed(2))

    return {
      id: String(pos.id),
      owner: pos.owner,
      pool: pool.id,
      poolId: pool.id,
      tickLower: hasTicks ? tickLower : null,
      tickUpper: hasTicks ? tickUpper : null,
      liquidity: pos.liquidity != null ? String(pos.liquidity) : '0',
      feeGrowthInsideALastX64: pos.feeGrowthInsideALastX64 != null ? String(pos.feeGrowthInsideALastX64) : null,
      feeGrowthInsideBLastX64: pos.feeGrowthInsideBLastX64 != null ? String(pos.feeGrowthInsideBLastX64) : null,
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
      feesAUsd,
      feesBUsd,
      amountAUsd,
      amountBUsd,
      percentA: Number(percentA.toFixed(2)),
      percentB: Number(percentB.toFixed(2)),
      pnlUSD: Number(pos.pNl ?? 0),
      poolSharePct,
      estimatedFees24hUSD,
      estimatedFees7dUSD,
      apr: {
        periodDays: APR_PERIOD_DAYS,
        fee: feeApr7d,
        farm: farmApr,
        total: totalApr,
      },
      currentPriceA: pool.priceA ?? null,
      currentPriceB: pool.priceB ?? null,
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

  return response
}

amm.get('/account/:account/positions', async (req, res) => {
  const network = req.app.get('network')
  const account = req.params.account
  const incentivesFilter = String(req.query?.incentives || 'active').toLowerCase()
  const summaryParam = req.query?.summary ?? req.query?.withSummary
  const withSummary = summaryParam === undefined ? true : parseTruthy(summaryParam)

  try {
    const positions = await getAccountPoolPositions(network.name, account)
    const response = await buildPositionsResponse(network, positions, incentivesFilter)

    if (withSummary) {
      res.json({
        items: response,
        summary: buildPositionsSummary(response),
      })
      return
    }

    res.json(response)
  } catch (err) {
    console.error('Error in v3 positions:', err)
    res.status(500).json({ error: 'Failed to load positions' })
  }
})

amm.get('/account/:account/history', async (req, res) => {
  const network = req.app.get('network')
  const account = String(req.params.account || '').trim()

  if (!account) {
    res.status(400).json({ error: 'Invalid account' })
    return
  }

  try {
    const limit = parseLimit(req.query.limit)
    const types = parseHistoryTypes(req.query.types ?? req.query.type)
    const poolId = parseOptionalInt(req.query.poolId)
    const positionId = parseOptionalInt(req.query.positionId ?? req.query.id)
    const search = parseHistorySearch(req.query.search)
    const cursor = parseHistoryCursor(req.query.cursorTime, req.query.cursorId)

    const query: any = { chain: network.name, owner: account }

    if (types.length < HISTORY_TYPES.size) query.type = { $in: types }
    if (positionId !== null) query.id = positionId

    const searchPoolIds = await resolvePoolIdsBySearch(network.name, search)
    if (searchPoolIds && searchPoolIds.length === 0) {
      res.json({ items: [], pageInfo: { hasMore: false, nextCursor: null } })
      return
    }

    if (search?.poolId !== null) {
      if (poolId !== null && poolId !== search.poolId) {
        res.json({ items: [], pageInfo: { hasMore: false, nextCursor: null } })
        return
      }
      query.pool = search.poolId
    } else if (poolId !== null) {
      query.pool = poolId
    } else if (searchPoolIds) {
      query.pool = { $in: searchPoolIds }
    }

    if (cursor) {
      if (cursor.id) {
        query.$or = [
          { time: { $lt: cursor.time } },
          { time: cursor.time, _id: { $lt: cursor.id } },
        ]
      } else {
        query.time = { $lt: cursor.time }
      }
    }

    const result = await fetchHistoryPage(query, limit)
    res.json(result)
  } catch (err) {
    console.error('Error in v3 account history:', err)
    res.status(500).json({ error: 'Failed to load account history' })
  }
})

amm.get('/positions/:id', async (req, res) => {
  const network = req.app.get('network')
  const incentivesFilter = String(req.query?.incentives || 'active').toLowerCase()
  const id = Number(req.params.id)

  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Invalid position id' })
    return
  }

  try {
    const redisPosition = await getRedisPosition(network.name, id)
    if (!redisPosition) {
      res.status(404).json({ error: 'Position not found' })
      return
    }

    const tokenPrices = JSON.parse(await redis().get(`${network.name}_token_prices`))
    const stats = await getPositionStats(network.name, redisPosition, tokenPrices, new Map())
    const positions = [{ ...redisPosition, ...stats }]

    const response = await buildPositionsResponse(network, positions, incentivesFilter)
    res.json(response[0] ?? null)
  } catch (err) {
    console.error('Error in v3 position:', err)
    res.status(500).json({ error: 'Failed to load position' })
  }
})

amm.get('/positions/:id/history', async (req, res) => {
  const network = req.app.get('network')
  const id = Number(req.params.id)

  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Invalid position id' })
    return
  }

  try {
    const limit = parseLimit(req.query.limit)
    const types = parseHistoryTypes(req.query.types ?? req.query.type)
    const poolId = parseOptionalInt(req.query.poolId)
    const owner = typeof req.query.owner === 'string' ? req.query.owner.trim() : ''
    const cursor = parseHistoryCursor(req.query.cursorTime, req.query.cursorId)

    const query: any = { chain: network.name, id }
    if (types.length < HISTORY_TYPES.size) query.type = { $in: types }
    if (poolId !== null) query.pool = poolId
    if (owner) query.owner = owner

    if (cursor) {
      if (cursor.id) {
        query.$or = [
          { time: { $lt: cursor.time } },
          { time: cursor.time, _id: { $lt: cursor.id } },
        ]
      } else {
        query.time = { $lt: cursor.time }
      }
    }

    const result = await fetchHistoryPage(query, limit)
    res.json(result)
  } catch (err) {
    console.error('Error in v3 position history:', err)
    res.status(500).json({ error: 'Failed to load position history' })
  }
})

amm.get('/pools/:id/positions', async (req, res) => {
  const network = req.app.get('network')
  const incentivesFilter = String(req.query?.incentives || 'active').toLowerCase()
  const id = Number(req.params.id)

  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Invalid pool id' })
    return
  }

  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '200')), 1), 500)
    const page = Math.max(parseInt(String(req.query.page || '1')), 1)
    const start = (page - 1) * limit
    const sort = String(req.query.sort || '').toLowerCase()
    const order = String(req.query.order || 'desc').toLowerCase()
    const dir = order === 'asc' ? 1 : -1

    const allPositions = JSON.parse(await redis().get(`positions_${network.name}`) || '[]') || []
    const poolPositions = allPositions.filter((p) => Number(p.pool) === id)
    const slice = poolPositions.slice(start, start + limit)

    const tokenPrices = JSON.parse(await redis().get(`${network.name}_token_prices`) || '[]')
    const historyCache = new Map()

    const positionsWithStats = await Promise.all(
      slice.map(async (pos) => ({
        ...pos,
        ...(await getPositionStats(network.name, pos, tokenPrices, historyCache)),
      }))
    )

    const response = await buildPositionsResponse(network, positionsWithStats, incentivesFilter)
    if (sort === 'totalvalueusd') {
      response.sort((a, b) => ((a?.totalValueUSD ?? 0) - (b?.totalValueUSD ?? 0)) * dir)
    } else if (sort === 'totalfeesusd') {
      response.sort((a, b) => ((a?.totalFeesUSD ?? 0) - (b?.totalFeesUSD ?? 0)) * dir)
    }
    res.json({ items: response, page, limit, total: poolPositions.length })
  } catch (err) {
    console.error('Error in v3 pool positions:', err)
    res.status(500).json({ error: 'Failed to load pool positions' })
  }
})

amm.get('/pools/:id/history', async (req, res) => {
  const network = req.app.get('network')
  const id = Number(req.params.id)

  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Invalid pool id' })
    return
  }

  try {
    const limit = parseLimit(req.query.limit)
    const types = parseHistoryTypes(req.query.types ?? req.query.type)
    const positionId = parseOptionalInt(req.query.positionId ?? req.query.id)
    const owner = typeof req.query.owner === 'string' ? req.query.owner.trim() : ''
    const cursor = parseHistoryCursor(req.query.cursorTime, req.query.cursorId)

    const query: any = { chain: network.name, pool: id }
    if (types.length < HISTORY_TYPES.size) query.type = { $in: types }
    if (positionId !== null) query.id = positionId
    if (owner) query.owner = owner

    if (cursor) {
      if (cursor.id) {
        query.$or = [
          { time: { $lt: cursor.time } },
          { time: cursor.time, _id: { $lt: cursor.id } },
        ]
      } else {
        query.time = { $lt: cursor.time }
      }
    }

    const result = await fetchHistoryPage(query, limit)
    res.json(result)
  } catch (err) {
    console.error('Error in v3 pool history:', err)
    res.status(500).json({ error: 'Failed to load pool history' })
  }
})
