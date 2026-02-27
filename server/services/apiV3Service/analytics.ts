import { Asset } from '@wharfkit/antelope'
import { Router } from 'express'
import { cacheSeconds } from 'route-cache'

import { SwapPool, Market, GlobalStats, SwapBar, Bar, Swap, Match, SwapChartPoint } from '../../models'
import { getTokens, fetchPlatformBalances } from '../../utils'
import { getRedis } from '../redis'
import { getScamLists } from '../apiV2Service/config'
import { getSwapBarPriceAsString } from '../../../utils/amm'
import { resolutions as candleResolutions, normalizeResolution } from '../updaterService/charts'
import { getIncentives } from '../apiV2Service/farms'
import { getOrderbook } from '../orderbookService/start'
import { sqrt } from '../../../utils/bigint'
import fs from 'fs'
import path from 'path'

export const analytics = Router()

const WINDOW_MAP_MS: Record<string, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
}

const RESOLUTION_MS: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
}

const PRICE_SCALE = 100000000
const DEFAULT_ORDERBOOK_DEPTH = 100
const MIN_STAKED_TVL_USD = 1
const APR_PERIOD_DAYS = 7
const OVERVIEW_CACHE_SECONDS = 900

type TokenInfo = {
  id?: string
  symbol?: string
  contract?: string
  name?: string
  usd_price?: number
}

function getWindow(queryWindow: any) {
  const raw = String(queryWindow || '30d').toLowerCase()
  if (raw === 'all') return { label: 'all', since: null, ms: null }
  const ms = WINDOW_MAP_MS[raw] || WINDOW_MAP_MS['30d']
  return { label: raw in WINDOW_MAP_MS ? raw : '30d', since: new Date(Date.now() - ms), ms }
}

function getResolution(queryResolution: any) {
  const raw = String(queryResolution || '1d').toLowerCase()
  return RESOLUTION_MS[raw] || RESOLUTION_MS['1d']
}

function normalizeCandleResolution(input: any) {
  const raw = String(input || '1h').toLowerCase()
  if (raw === '1h') return '60'
  if (raw === '4h') return '240'
  if (raw === '1d' || raw === 'd') return '1D'
  if (raw === '1w' || raw === 'w') return '1W'
  if (raw === '1m' || raw === 'm') return '1M'
  return normalizeResolution(raw)
}

function safeNumber(value: any, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function getPoolLpFeeRate(pool: any) {
  const feeRate = safeNumber(pool?.fee) / 1000000
  if (!Number.isFinite(feeRate) || feeRate <= 0) return 0
  return feeRate
}

function normalizeSwapChartVolumeUSD(value: any) {
  // SwapChartPoint stores both legs in USD (A+B), while API stats use averaged USD ((A+B)/2).
  return safeNumber(value) / 2
}

function calcPoolFeeApr7d(pool: any) {
  const volume7d = safeNumber(pool?.volumeUSDWeek)
  const tvlUSD = safeNumber(pool?.tvlUSD)
  const lpFeeRate = getPoolLpFeeRate(pool)
  if (!Number.isFinite(volume7d) || volume7d <= 0) return 0
  if (!Number.isFinite(tvlUSD) || tvlUSD <= 0) return 0
  if (!Number.isFinite(lpFeeRate) || lpFeeRate <= 0) return 0

  const apr = ((volume7d * lpFeeRate) / tvlUSD) * (365 / APR_PERIOD_DAYS) * 100
  return Number.isFinite(apr) ? Number(apr.toFixed(2)) : 0
}

function parseIncludes(input: any) {
  const raw = String(input || '').toLowerCase()
  if (!raw) return new Set<string>()
  return new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))
}

function getOverviewCacheKey(req: any) {
  const network = req.app.get('network')
  const window = getWindow(req.query.window)
  const include = Array.from(parseIncludes(req.query.include)).sort().join(',')
  return `overview|${network?.name || 'unknown'}|window:${window.label}|include:${include}`
}

function parseSearchTerms(input: any) {
  const raw = String(input || '').toLowerCase().trim()
  if (!raw) return []
  return raw.split(/[\s,/|]+/).map((s) => s.trim()).filter(Boolean)
}

function buildPoolSearchStack(pool: any, tokensById: Map<string, any>) {
  const tokenA = pool?.tokenA || {}
  const tokenB = pool?.tokenB || {}
  const tokenAInfo = tokensById.get(tokenA.id) || {}
  const tokenBInfo = tokensById.get(tokenB.id) || {}

  return [
    tokenA.id,
    tokenA.symbol,
    tokenA.contract,
    tokenAInfo.id,
    tokenAInfo.symbol,
    tokenAInfo.contract,
    tokenAInfo.name,
    tokenB.id,
    tokenB.symbol,
    tokenB.contract,
    tokenBInfo.id,
    tokenBInfo.symbol,
    tokenBInfo.contract,
    tokenBInfo.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

async function getEosAirdropLogo(chain: string, symbol: string, contract: string): Promise<string | null> {
  const redis = getRedis()
  const key = `${chain}:${symbol.toUpperCase()}:${contract}`
  try {
    return await redis.hGet('eos_airdrops_logos', key)
  } catch (e) {
    return null
  }
}

function getLocalLogoUrl(networkName: string, tokenId: string, symbol: string, contract: string) {
  const iconPath = path.join(process.cwd(), 'assets', 'tokens', networkName, `${symbol}_${contract}.png`)
  if (fs.existsSync(iconPath)) {
    return `https://${networkName}.alcor.exchange/api/v2/tokens/${tokenId}/logo`
  }
  return null
}

async function getLogoUrl(networkName: string, token: any) {
  if (!token || !networkName) return null
  const tokenId = String(token.id || '')
  const symbol = String(token.symbol || '').toLowerCase()
  const contract = String(token.contract || '')

  const local = getLocalLogoUrl(networkName, tokenId, symbol, contract)
  if (local) return local

  return await getEosAirdropLogo(networkName, symbol, contract)
}

const fundamentalsCache = new Map<string, any>()

function loadFundamentals(networkName: string) {
  if (fundamentalsCache.has(networkName)) return fundamentalsCache.get(networkName)

  try {
    const filePath = path.join(process.cwd(), 'assets', 'fundamentals', `${networkName}.json`)
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    fundamentalsCache.set(networkName, parsed)
    return parsed
  } catch (e) {
    fundamentalsCache.set(networkName, null)
    return null
  }
}

function getFundamental(networkName: string, token: any) {
  if (!token || !networkName) return null
  const byChain = loadFundamentals(networkName)
  if (!byChain) return null
  const symbol = String(token.symbol || '').toUpperCase()
  const contract = String(token.contract || '')
  const key = `${symbol}@${contract}`
  return byChain[key] || null
}

function pickPoolVolumes(pool: any, window: string) {
  if (window === '24h') return { a: safeNumber(pool.volumeA24), b: safeNumber(pool.volumeB24), usd: safeNumber(pool.volumeUSD24) }
  if (window === '7d') return { a: safeNumber(pool.volumeAWeek), b: safeNumber(pool.volumeBWeek), usd: safeNumber(pool.volumeUSDWeek) }
  if (window === '30d') return { a: safeNumber(pool.volumeAMonth), b: safeNumber(pool.volumeBMonth), usd: safeNumber(pool.volumeUSDMonth) }
  if (window === '90d') return { a: safeNumber(pool.volumeAMonth), b: safeNumber(pool.volumeBMonth), usd: safeNumber(pool.volumeUSDMonth) }
  return { a: safeNumber(pool.volumeAMonth), b: safeNumber(pool.volumeBMonth), usd: safeNumber(pool.volumeUSDMonth) }
}

function pickMarketVolume(market: any, window: string) {
  if (window === '24h') return safeNumber(market.volume24)
  if (window === '7d') return safeNumber(market.volumeWeek)
  if (window === '30d') return safeNumber(market.volumeMonth)
  if (window === '90d') return safeNumber(market.volumeMonth)
  return safeNumber(market.volumeMonth)
}

function pickMarketVolumeUsd(market: any, window: string, priceMap: Map<string, number>) {
  const volumeQuote = pickMarketVolume(market, window)
  const quoteId = market?.quote_token?.id
  const quotePrice = safeNumber(priceMap.get(quoteId), 0)
  return volumeQuote * quotePrice
}

function computeInverseChangePercent(changePercent: number) {
  const changeDec = changePercent / 100
  const denom = 1 + changeDec
  if (denom === 0) return null
  const inverted = (-changeDec / denom) * 100
  return Number.isFinite(inverted) ? Number(inverted.toFixed(2)) : null
}

function pickPoolForToken(poolsByToken: Map<string, any[]>, tokenId: string, baseTokenId: string | null, usdTokenId: string | null) {
  const pools = poolsByToken.get(tokenId) || []
  if (pools.length === 0) return null

  if (baseTokenId) {
    const pool = pools.find((p) => p.tokenA.id === baseTokenId || p.tokenB.id === baseTokenId)
    if (pool) return pool
  }

  if (usdTokenId) {
    const pool = pools.find((p) => p.tokenA.id === usdTokenId || p.tokenB.id === usdTokenId)
    if (pool) return pool
  }

  return pools.slice().sort((a, b) => safeNumber(b.tvlUSD) - safeNumber(a.tvlUSD))[0] || null
}

function computeTokenPriceChange24(pool: any, tokenId: string) {
  if (!pool) return null
  const changePercent = safeNumber(pool.change24, null as any)
  if (changePercent === null) return null

  if (pool.tokenA?.id === tokenId) return Number(changePercent.toFixed(2))
  if (pool.tokenB?.id === tokenId) return computeInverseChangePercent(changePercent)
  return Number(changePercent.toFixed(2))
}

async function loadTokenScores(chain: string) {
  const redis = getRedis()
  try {
    const raw = await redis.get(`${chain}_token_scores`)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

async function loadTokenHoldersStats(chain: string, tokenIds: string[]) {
  const redis = getRedis()
  if (!tokenIds.length) return new Map<string, any>()

  const values = await redis.hmGet(`${chain}_token_holders_stats`, tokenIds)
  const result = new Map<string, any>()

  for (let i = 0; i < tokenIds.length; i += 1) {
    const raw = values[i]
    if (!raw) continue
    try {
      result.set(tokenIds[i], JSON.parse(raw))
    } catch (e) {
      // ignore bad data
    }
  }

  return result
}

function buildTokenStats(tokens: any[], pools: any[], markets: any[], window: string, tokenTvlMap?: Map<string, number>) {
  const tokenStats = new Map<string, any>()
  const priceMap = new Map<string, number>(tokens.map((t) => [t.id, safeNumber(t.usd_price)]))

  for (const token of tokens) {
    tokenStats.set(token.id, {
      tvlUSD: tokenTvlMap?.get(token.id) ?? 0,
      swapVolumeUSD: 0,
      spotVolumeUSD: 0,
      poolsCount: 0,
      spotPairsCount: 0,
    })
  }

  for (const pool of pools) {
    const tokenAId = pool?.tokenA?.id
    const tokenBId = pool?.tokenB?.id
    if (!tokenStats.has(tokenAId) && !tokenStats.has(tokenBId)) continue

    const volumes = pickPoolVolumes(pool, window)

    if (tokenStats.has(tokenAId)) {
      const stats = tokenStats.get(tokenAId)
      const price = priceMap.get(tokenAId) || 0
      stats.swapVolumeUSD += volumes.a * price
      stats.poolsCount += 1
    }

    if (tokenStats.has(tokenBId)) {
      const stats = tokenStats.get(tokenBId)
      const price = priceMap.get(tokenBId) || 0
      stats.swapVolumeUSD += volumes.b * price
      stats.poolsCount += 1
    }
  }

  for (const market of markets) {
    const baseId = market?.base_token?.id
    const quoteId = market?.quote_token?.id
    const volumeQuote = pickMarketVolume(market, window)
    const quotePrice = priceMap.get(quoteId) || 0
    const volumeUSD = volumeQuote * quotePrice

    if (tokenStats.has(baseId)) {
      const stats = tokenStats.get(baseId)
      stats.spotVolumeUSD += volumeUSD
      stats.spotPairsCount += 1
    }

    if (tokenStats.has(quoteId)) {
      const stats = tokenStats.get(quoteId)
      stats.spotVolumeUSD += volumeUSD
      stats.spotPairsCount += 1
    }
  }

  return tokenStats
}

async function buildPoolTxStats(chain: string, poolIds: number[], since?: Date | null) {
  if (!poolIds.length) return new Map<number, number>()
  const match: any = { chain, pool: { $in: poolIds } }
  if (since) match.time = { $gte: since }

  const rows = await Swap.aggregate([
    { $match: match },
    { $group: { _id: '$pool', swaps: { $sum: 1 } } },
  ])

  const map = new Map<number, number>()
  for (const row of rows) {
    map.set(Number(row._id), Number(row.swaps || 0))
  }
  return map
}

async function buildMarketTxStats(chain: string, marketIds: number[], since?: Date | null) {
  if (!marketIds.length) return new Map<number, number>()
  const match: any = { chain, market: { $in: marketIds } }
  if (since) match.time = { $gte: since }

  const rows = await Match.aggregate([
    { $match: match },
    { $group: { _id: '$market', matches: { $sum: 1 } } },
  ])

  const map = new Map<number, number>()
  for (const row of rows) {
    map.set(Number(row._id), Number(row.matches || 0))
  }
  return map
}

async function buildOrderbookDepth(chain: string, market: any, priceMap: Map<string, number>, depthLimit = DEFAULT_ORDERBOOK_DEPTH) {
  const quotePrecision = market?.quote_token?.symbol?.precision ?? 0
  const basePrecision = market?.base_token?.symbol?.precision ?? 0
  const quoteId = market?.quote_token?.id
  const quotePrice = priceMap.get(quoteId) || 0

  const buyBook = await getOrderbook(chain, 'buy', market.id)
  const sellBook = await getOrderbook(chain, 'sell', market.id)

  const buyRows = Array.from(buyBook.values()).slice(0, depthLimit)
  const sellRows = Array.from(sellBook.values()).slice(0, depthLimit)

  let bidDepthQuote = 0
  for (const row of buyRows) {
    const bidAmount = Number(row?.[1] || 0)
    bidDepthQuote += bidAmount / Math.pow(10, quotePrecision)
  }

  let askDepthQuote = 0
  for (const row of sellRows) {
    const unitPrice = Number(row?.[0] || 0) / PRICE_SCALE
    const askAmountBase = Number(row?.[2] || 0) / Math.pow(10, basePrecision)
    askDepthQuote += askAmountBase * unitPrice
  }

  return {
    bidDepthQuote: Number(bidDepthQuote.toFixed(6)),
    askDepthQuote: Number(askDepthQuote.toFixed(6)),
    bidDepthUsd: Number((bidDepthQuote * quotePrice).toFixed(6)),
    askDepthUsd: Number((askDepthQuote * quotePrice).toFixed(6)),
  }
}

async function buildTokenTxStats(chain: string, tokens: any[], pools: any[], markets: any[], since?: Date | null) {
  const tokenStats = new Map<string, { swapTx: number, spotTx: number }>()
  const tokenIds = new Set(tokens.map((t) => t.id))

  for (const t of tokens) {
    tokenStats.set(t.id, { swapTx: 0, spotTx: 0 })
  }

  const poolTokens = new Map<number, { tokenA: string, tokenB: string }>(
    pools.map((p) => [p.id, { tokenA: p.tokenA.id, tokenB: p.tokenB.id }])
  )

  const marketTokens = new Map<number, { base: string, quote: string }>(
    markets.map((m) => [m.id, { base: m.base_token.id, quote: m.quote_token.id }])
  )

  const swapMatch: any = { chain }
  if (since) swapMatch.time = { $gte: since }

  const swapByPool = await Swap.aggregate([
    { $match: swapMatch },
    { $group: { _id: '$pool', trades: { $sum: 1 } } },
  ])

  for (const row of swapByPool) {
    const tokensPair = poolTokens.get(row._id)
    if (!tokensPair) continue

    for (const tokenId of [tokensPair.tokenA, tokensPair.tokenB]) {
      if (!tokenIds.has(tokenId)) continue
      const stat = tokenStats.get(tokenId)
      if (stat) stat.swapTx += Number(row.trades || 0)
    }
  }

  const spotMatch: any = { chain }
  if (since) spotMatch.time = { $gte: since }

  const matchByMarket = await Match.aggregate([
    { $match: spotMatch },
    { $group: { _id: '$market', trades: { $sum: 1 } } },
  ])

  for (const row of matchByMarket) {
    const tokensPair = marketTokens.get(row._id)
    if (!tokensPair) continue

    for (const tokenId of [tokensPair.base, tokensPair.quote]) {
      if (!tokenIds.has(tokenId)) continue
      const stat = tokenStats.get(tokenId)
      if (stat) stat.spotTx += Number(row.trades || 0)
    }
  }

  return tokenStats
}

function toPoolCard(pool: any, window: string) {
  const volumes = pickPoolVolumes(pool, window)
  const feeApr = calcPoolFeeApr7d(pool)
  return {
    id: pool.id,
    fee: pool.fee,
    tokenA: pool.tokenA,
    tokenB: pool.tokenB,
    price: {
      aPerB: safeNumber(pool.priceA),
      bPerA: safeNumber(pool.priceB),
      change24h: safeNumber(pool.change24),
    },
    liquidity: {
      tvl: safeNumber(pool.tvlUSD),
    },
    volume: {
      usd: volumes.usd,
    },
    apr: {
      periodDays: APR_PERIOD_DAYS,
      fee: feeApr,
      farm: null,
      total: feeApr,
    },
    tx: {
      swaps: null,
    },
  }
}

function toFarmCard(incentive: any, pool: any, tokensMap: Map<string, TokenInfo>, window: string) {
  if (!incentive || !pool) return null

  const rewardSymbol = incentive?.reward?.symbol?.symbol ?? incentive?.reward?.symbol ?? null
  const rewardContract = incentive?.reward?.contract ?? null
  const rewardTokenId =
    rewardSymbol && rewardContract ? `${String(rewardSymbol).toLowerCase()}-${rewardContract}` : null
  const rewardToken = rewardTokenId ? tokensMap.get(rewardTokenId) : null
  const rewardTokenPrice = safeNumber(rewardToken?.usd_price, 0)

  const rewardPerDay = safeNumber(incentive.rewardPerDay, 0)
  const rewardPerDayUSD = rewardPerDay * rewardTokenPrice

  const apr = calcIncentiveApr(incentive, pool, tokensMap)
  const utilizationPct = calcIncentiveStakePercent(incentive, pool)
  const stakedTvlUSD = utilizationPct === null
    ? null
    : safeNumber(pool.tvlUSD) * (utilizationPct / 100)

  const poolTvlUSD = safeNumber(pool.tvlUSD)
  const poolVolumeUSD = pickPoolVolumes(pool, window).usd

  return {
    id: incentive.id,
    poolId: pool.id,
    isFinished: Boolean(incentive.isFinished),
    daysRemain: safeNumber(incentive.daysRemain),
    periodFinish: incentive.periodFinish ?? null,
    reward: incentive.reward?.quantity ?? null,
    rewardSymbol,
    rewardTokenId,
    rewardTokenPrice,
    rewardPerDay,
    rewardPerDayUSD: Number.isFinite(rewardPerDayUSD) ? Number(rewardPerDayUSD.toFixed(2)) : 0,
    apr,
    utilizationPct: utilizationPct === null ? null : Number(utilizationPct.toFixed(4)),
    stakedTvlUSD: stakedTvlUSD === null ? null : Number(stakedTvlUSD.toFixed(2)),
    poolTvlUSD,
    poolVolumeUSD,
    pool: toPoolCard(pool, window),
  }
}

function calcIncentiveApr(incentive: any, pool: any, tokensMap: Map<string, TokenInfo>) {
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
    const stakedPercentBn = (BigInt(incentive.totalStakingWeight || 0) * BigInt(100) * BigInt(1000)) / absoluteTotalStaked
    const stakedPercent = Number(stakedPercentBn) / 1000

    const tvlUSD = safeNumber(pool.tvlUSD) * (stakedPercent / 100)
    const effectiveTvlUSD = tvlUSD > 0 ? tvlUSD : MIN_STAKED_TVL_USD

    const rewardPerDay = safeNumber(incentive.rewardPerDay)
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

function calcIncentiveStakePercent(incentive: any, pool: any) {
  if (!pool || !incentive) return null

  try {
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
    const stakedPercentBn = (BigInt(incentive.totalStakingWeight || 0) * BigInt(100) * BigInt(1000)) / absoluteTotalStaked
    const stakedPercent = Number(stakedPercentBn) / 1000

    return Number.isFinite(stakedPercent) ? stakedPercent : null
  } catch (e) {
    return null
  }
}

async function loadIncentivesByPool(network: Network) {
  const incentives = await getIncentives(network)
  const incentivesByPool = new Map<number, any[]>()
  for (const incentive of incentives) {
    if (!incentivesByPool.has(incentive.poolId)) incentivesByPool.set(incentive.poolId, [])
    incentivesByPool.get(incentive.poolId)?.push(incentive)
  }
  return incentivesByPool
}

function toMarketCard(market: any, window: string, priceMap: Map<string, number>) {
  const volumeUSD = pickMarketVolumeUsd(market, window, priceMap)
  const lastPrice = safeNumber(market.last_price)
  const ask = safeNumber(market.ask)
  const bid = safeNumber(market.bid)
  const spread = lastPrice > 0 ? ((ask - bid) / lastPrice) * 100 : null

  return {
    id: market.id,
    base: market.base_token,
    quote: market.quote_token,
    price: {
      last: lastPrice,
      change24h: safeNumber(market.change24),
    },
    spread: Number.isFinite(spread) ? Number(spread.toFixed(2)) : null,
    volume: {
      usd: Number(volumeUSD.toFixed(2)),
    },
    orders: {
      bidDepthUsd: null,
      askDepthUsd: null,
    },
    tx: {
      matches: null,
    },
  }
}

function attachPoolTx(card: any, swaps?: number | null) {
  if (swaps === null || swaps === undefined) return card
  return {
    ...card,
    tx: { swaps },
  }
}

function attachMarketTxAndDepth(card: any, matches?: number | null, depth?: any | null) {
  const next = { ...card }
  if (matches !== null && matches !== undefined) {
    next.tx = { matches }
  }
  if (depth) {
    next.orders = {
      bidDepthUsd: depth.bidDepthUsd,
      askDepthUsd: depth.askDepthUsd,
    }
  }
  return next
}

function attachIncentives(poolCard: any, pool: any, incentivesByPool: Map<number, any[]>, tokensMap: Map<string, TokenInfo>) {
  const incentives = incentivesByPool.get(pool.id) || []
  const mapped = incentives.map((i) => {
    const rewardSymbol = i?.reward?.symbol?.symbol ?? i?.reward?.symbol
    const rewardContract = i?.reward?.contract
    const rewardTokenId = rewardSymbol && rewardContract ? `${String(rewardSymbol).toLowerCase()}-${rewardContract}` : null
    const rewardToken = rewardTokenId ? tokensMap.get(rewardTokenId) : null
    const rewardTokenPrice = safeNumber(rewardToken?.usd_price, 0)
    const rewardPerDay = safeNumber(i?.rewardPerDay)
    const rewardPerDayUSD = rewardPerDay * rewardTokenPrice
    const utilizationPct = calcIncentiveStakePercent(i, pool)

    return {
      incentiveId: i?.id ?? i?.incentiveId ?? null,
      poolId: i?.poolId ?? pool.id,
      reward: i?.reward ?? null,
      rewardPerDay,
      rewardPerDayUSD: Number.isFinite(rewardPerDayUSD) ? Number(rewardPerDayUSD.toFixed(2)) : 0,
      periodFinish: i?.periodFinish ?? null,
      isFinished: Boolean(i?.isFinished),
      daysRemain: safeNumber(i?.daysRemain),
      rewardTokenId,
      utilizationPct: utilizationPct === null ? null : Number(utilizationPct.toFixed(4)),
      apr: calcIncentiveApr(i, pool, tokensMap),
    }
  })

  const farmApr = calcPoolFarmApr(pool, incentivesByPool, tokensMap)
  const feeApr = safeNumber(poolCard?.apr?.fee)
  const totalApr = Number((feeApr + farmApr).toFixed(2))

  return {
    ...poolCard,
    incentives: mapped,
    apr: {
      periodDays: APR_PERIOD_DAYS,
      fee: feeApr,
      farm: farmApr,
      total: totalApr,
    },
  }
}

function calcPoolFarmApr(pool: any, incentivesByPool: Map<number, any[]>, tokensMap: Map<string, TokenInfo>) {
  if (!pool) return 0
  const incentives = incentivesByPool.get(pool.id) || []
  const total = incentives
    .filter((i) => !i?.isFinished)
    .reduce((sum, i) => sum + safeNumber(calcIncentiveApr(i, pool, tokensMap)), 0)

  return Number.isFinite(total) ? Number(total.toFixed(2)) : 0
}

function buildMeta(network, window: string) {
  return {
    chain: network.name,
    ts: new Date().toISOString(),
    window,
    baseToken: network?.baseToken ? `${network.baseToken.symbol}-${network.baseToken.contract}`.toLowerCase() : null,
    usdToken: network?.USD_TOKEN || null,
  }
}

analytics.get('/overview', cacheSeconds(OVERVIEW_CACHE_SECONDS, (req, res) => {
  return getOverviewCacheKey(req)
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const includes = parseIncludes(req.query.include)
  const includeIncentives = includes.has('incentives')
  const includeTx = includes.has('tx')
  const includeDepth = includes.has('depth')

  const tokens = (await getTokens(network.name)) || []
  const holdersStats = await loadTokenHoldersStats(network.name, tokens.map((t) => t.id))
  const priceMap = new Map<string, number>(tokens.map((t) => [t.id, safeNumber(t.usd_price)]))

  const pools = await SwapPool.find({ chain: network.name }).lean()
  const markets = await Market.find({ chain: network.name }).lean()

  const { tokenTvlMap } = await fetchPlatformBalances(network, tokens)
  const tokenStats = buildTokenStats(tokens, pools, markets, window.label, tokenTvlMap)
  const tokenTxStats = await buildTokenTxStats(network.name, tokens, pools, markets, window.since)
  const tokenScores = await loadTokenScores(network.name)

  const topPoolsRaw = [...pools]
    .sort((a, b) => pickPoolVolumes(b, window.label).usd - pickPoolVolumes(a, window.label).usd)
    .slice(0, 10)

  const incentivesByPool = includeIncentives ? await loadIncentivesByPool(network) : new Map()
  const tokensMap = includeIncentives ? new Map<string, TokenInfo>(
    tokens.map((t) => [t.id, t])
  ) : new Map()

  const poolTxStats = includeTx ? await buildPoolTxStats(network.name, topPoolsRaw.map((p) => p.id), window.since) : new Map()

  const topPools = topPoolsRaw.map((p) => {
    let card = toPoolCard(p, window.label)
    if (includeIncentives) card = attachIncentives(card, p, incentivesByPool, tokensMap)
    if (includeTx) card = attachPoolTx(card, poolTxStats.get(p.id) ?? 0)
    return card
  })

  const topSpotPairsRaw = [...markets]
    .sort((a, b) => pickMarketVolumeUsd(b, window.label, priceMap) - pickMarketVolumeUsd(a, window.label, priceMap))
    .slice(0, 10)

  const marketTxStats = includeTx ? await buildMarketTxStats(network.name, topSpotPairsRaw.map((m) => m.id), window.since) : new Map()

  const topSpotPairs = await Promise.all(topSpotPairsRaw.map(async (m) => {
    let card = toMarketCard(m, window.label, priceMap)
    if (includeTx) card = attachMarketTxAndDepth(card, marketTxStats.get(m.id) ?? 0, null)
    if (includeDepth) {
      const depth = await buildOrderbookDepth(network.name, m, priceMap)
      card = attachMarketTxAndDepth(card, includeTx ? (marketTxStats.get(m.id) ?? 0) : null, depth)
    }
    return card
  }))

  const baseTokenId = network?.baseToken ? `${network.baseToken.symbol}-${network.baseToken.contract}`.toLowerCase() : null
  const usdTokenId = network?.USD_TOKEN || null

  const poolsByToken = new Map<string, any[]>()
  for (const pool of pools) {
    const tokenAId = pool?.tokenA?.id
    const tokenBId = pool?.tokenB?.id
    if (tokenAId) {
      if (!poolsByToken.has(tokenAId)) poolsByToken.set(tokenAId, [])
      poolsByToken.get(tokenAId)?.push(pool)
    }
    if (tokenBId) {
      if (!poolsByToken.has(tokenBId)) poolsByToken.set(tokenBId, [])
      poolsByToken.get(tokenBId)?.push(pool)
    }
  }

  const topTokens = (await Promise.all(tokens.map(async (t) => {
      const stats = tokenStats.get(t.id) || {}
      const score = tokenScores?.[t.id]?.score ?? null
      const firstSeenAt = tokenScores?.[t.id]?.firstSeenAt ?? null
      const holders = holdersStats.get(t.id) || null
      const tx = tokenTxStats.get(t.id) || { swapTx: 0, spotTx: 0 }
      const volumeSwap = safeNumber(stats.swapVolumeUSD)
      const volumeSpot = safeNumber(stats.spotVolumeUSD)
      const logoUrl = await getLogoUrl(network.name, t)

      const tokenPool = pickPoolForToken(poolsByToken, t.id, baseTokenId, usdTokenId)
      const priceChange24h = computeTokenPriceChange24(tokenPool, t.id)

      return {
        id: t.id,
        symbol: t.symbol,
        contract: t.contract,
        name: t.name || null,
        decimals: t.decimals,
        logo: logoUrl,
        logoUrl,
        price: { usd: safeNumber(t.usd_price), change24h: priceChange24h },
        liquidity: { tvl: safeNumber(stats.tvlUSD) },
        volume: { swap: volumeSwap, spot: volumeSpot, total: volumeSwap + volumeSpot },
        pairs: { pools: stats.poolsCount || 0, spots: stats.spotPairsCount || 0 },
        createdAt: firstSeenAt,
        tx: { swap: tx.swapTx, spot: tx.spotTx, total: tx.swapTx + tx.spotTx },
        holders: holders ? {
          count: holders.holders ?? null,
          change1h: holders.change1h ?? null,
          change6h: holders.change6h ?? null,
          change24h: holders.change24h ?? null,
          truncated: holders.truncated ?? false,
        } : null,
        scores: { total: score },
      }
    })))
    .sort((a, b) => safeNumber(b.scores.total) - safeNumber(a.scores.total))
    .slice(0, 10)

  const resolution = window.ms ? Math.max(Math.floor(window.ms / 30), 60 * 60 * 1000) : 24 * 60 * 60 * 1000
  const $match = {
    chain: network.name,
    ...(window.since ? { time: { $gte: window.since } } : {}),
  }

  const $group = {
    _id: {
      $toDate: {
        $subtract: [
          { $toLong: '$time' },
          { $mod: [{ $toLong: '$time' }, resolution] },
        ],
      },
    },
    totalValueLocked: { $last: '$totalValueLocked' },
    swapTradingVolume: { $sum: '$swapTradingVolume' },
    spotTradingVolume: { $sum: '$spotTradingVolume' },
    swapFees: { $sum: '$swapFees' },
    spotFees: { $sum: '$spotFees' },
  }

  const chart = await GlobalStats.aggregate([
    { $match },
    { $sort: { time: 1 } },
    { $group },
    { $sort: { _id: 1 } },
  ])

  const [stats] = await GlobalStats.aggregate([
    { $match },
    { $sort: { time: 1 } },
    {
      $group: {
        _id: '$chain',
        totalValueLocked: { $last: '$totalValueLocked' },
        swapTradingVolume: { $sum: '$swapTradingVolume' },
        spotTradingVolume: { $sum: '$spotTradingVolume' },
        swapFees: { $sum: '$swapFees' },
        spotFees: { $sum: '$spotFees' },
        dailyActiveUsers: { $avg: '$dailyActiveUsers' },
        swapTransactions: { $sum: '$swapTransactions' },
        spotTransactions: { $sum: '$spotTransactions' },
        totalLiquidityPools: { $max: '$totalLiquidityPools' },
        totalSpotPairs: { $max: '$totalSpotPairs' },
      },
    },
  ])

  const chartPoints = chart.map((i) => {
    const swapVolume = safeNumber(i.swapTradingVolume)
    const spotVolume = safeNumber(i.spotTradingVolume)
    const swapFees = safeNumber(i.swapFees)
    const spotFees = safeNumber(i.spotFees)
    const volume = swapVolume + spotVolume
    const fees = swapFees + spotFees

    return {
      t: i._id,
      tvl: safeNumber(i.totalValueLocked),
      volume,
      fees,
      swapVolume,
      spotVolume,
      swapFees,
      spotFees,
    }
  })

  res.json({
    meta: buildMeta(network, window.label),
    stats: {
      tvl: safeNumber(stats?.totalValueLocked),
      volume: safeNumber(stats?.swapTradingVolume) + safeNumber(stats?.spotTradingVolume),
      fees: safeNumber(stats?.swapFees) + safeNumber(stats?.spotFees),
      swapVolume: safeNumber(stats?.swapTradingVolume),
      spotVolume: safeNumber(stats?.spotTradingVolume),
      swapFees: safeNumber(stats?.swapFees),
      spotFees: safeNumber(stats?.spotFees),
      swapTx: safeNumber(stats?.swapTransactions),
      spotTx: safeNumber(stats?.spotTransactions),
      dauAvg: safeNumber(stats?.dailyActiveUsers),
      poolsTotal: safeNumber(stats?.totalLiquidityPools),
      spotPairsTotal: safeNumber(stats?.totalSpotPairs),
    },
    charts: {
      tvl: chartPoints.map((i) => ({ t: i.t, v: i.tvl })),
      volume: chartPoints.map((i) => ({ t: i.t, v: i.volume })),
      fees: chartPoints.map((i) => ({ t: i.t, v: i.fees })),
      swapVolume: chartPoints.map((i) => ({ t: i.t, v: i.swapVolume })),
      spotVolume: chartPoints.map((i) => ({ t: i.t, v: i.spotVolume })),
      swapFees: chartPoints.map((i) => ({ t: i.t, v: i.swapFees })),
      spotFees: chartPoints.map((i) => ({ t: i.t, v: i.spotFees })),
      items: chartPoints,
    },
    topPools,
    topTokens,
    topSpotPairs,
  })
})

analytics.get('/tokens', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const includes = parseIncludes(req.query.include)
  const includeFundamental = includes.has('fundamental')
  const hasLogo = String(req.query.hasLogo || '').toLowerCase()
  const search = String(req.query.search || '').toLowerCase()

  let tokens = (await getTokens(network.name)) || []
  if (search) {
    tokens = tokens.filter((t) =>
      String(t.symbol || '').toLowerCase().includes(search) ||
      String(t.contract || '').toLowerCase().includes(search) ||
      String(t.id || '').toLowerCase().includes(search)
    )
  }

  const pools = await SwapPool.find({ chain: network.name }).lean()
  const markets = await Market.find({ chain: network.name }).lean()

  const baseTokenId = network?.baseToken ? `${network.baseToken.symbol}-${network.baseToken.contract}`.toLowerCase() : null
  const usdTokenId = network?.USD_TOKEN || null

  const poolsByToken = new Map<string, any[]>()
  for (const pool of pools) {
    const tokenAId = pool?.tokenA?.id
    const tokenBId = pool?.tokenB?.id
    if (tokenAId) {
      if (!poolsByToken.has(tokenAId)) poolsByToken.set(tokenAId, [])
      poolsByToken.get(tokenAId)?.push(pool)
    }
    if (tokenBId) {
      if (!poolsByToken.has(tokenBId)) poolsByToken.set(tokenBId, [])
      poolsByToken.get(tokenBId)?.push(pool)
    }
  }

  const { tokenTvlMap } = await fetchPlatformBalances(network, tokens)
  const tokenStats = buildTokenStats(tokens, pools, markets, window.label, tokenTvlMap)
  const tokenTxStats = await buildTokenTxStats(network.name, tokens, pools, markets, window.since)
  const tokenScores = await loadTokenScores(network.name)
  const holdersStats = await loadTokenHoldersStats(network.name, tokens.map((t) => t.id))

  const result = await Promise.all(tokens.map(async (t) => {
    const stats = tokenStats.get(t.id) || {}
    const score = tokenScores?.[t.id]?.score ?? null
    const firstSeenAt = tokenScores?.[t.id]?.firstSeenAt ?? null
    const holders = holdersStats.get(t.id) || null
    const tx = tokenTxStats.get(t.id) || { swapTx: 0, spotTx: 0 }
    const volumeSwap = safeNumber(stats.swapVolumeUSD)
    const volumeSpot = safeNumber(stats.spotVolumeUSD)
    const logoUrl = await getLogoUrl(network.name, t)

    const tokenPool = pickPoolForToken(poolsByToken, t.id, baseTokenId, usdTokenId)
    const priceChange24h = computeTokenPriceChange24(tokenPool, t.id)

    const fundamental = includeFundamental ? getFundamental(network.name, t) : null

    return {
      id: t.id,
      symbol: t.symbol,
      contract: t.contract,
      name: t.name || null,
      decimals: t.decimals,
      logo: logoUrl,
      logoUrl,
      price: { usd: safeNumber(t.usd_price), change24h: priceChange24h },
      liquidity: { tvl: safeNumber(stats.tvlUSD) },
      volume: { swap: volumeSwap, spot: volumeSpot, total: volumeSwap + volumeSpot },
      pairs: { pools: stats.poolsCount || 0, spots: stats.spotPairsCount || 0 },
      createdAt: firstSeenAt,
      tx: { swap: tx.swapTx, spot: tx.spotTx, total: tx.swapTx + tx.spotTx },
      holders: holders ? {
        count: holders.holders ?? null,
        change1h: holders.change1h ?? null,
        change6h: holders.change6h ?? null,
        change24h: holders.change24h ?? null,
        truncated: holders.truncated ?? false,
      } : null,
      fundamental,
      scores: { total: score },
    }
  }))

  let filtered = result
  if (hasLogo === 'true') {
    filtered = filtered.filter((t) => Boolean(t.logoUrl))
  } else if (hasLogo === 'false') {
    filtered = filtered.filter((t) => !t.logoUrl)
  }

  const sort = String(req.query.sort || 'score').toLowerCase()
  const order = String(req.query.order || 'desc').toLowerCase()
  const dir = order === 'asc' ? 1 : -1

  filtered.sort((a, b) => {
    let av = 0
    let bv = 0
    if (sort === 'volume') {
      av = a.volume.total
      bv = b.volume.total
    } else if (sort === 'tvl') {
      av = a.liquidity.tvl
      bv = b.liquidity.tvl
    } else if (sort === 'holders') {
      av = a.holders?.count ?? 0
      bv = b.holders?.count ?? 0
    } else if (sort === 'created' || sort === 'createdat' || sort === 'age') {
      const aHas = Boolean(a.createdAt)
      const bHas = Boolean(b.createdAt)
      if (!aHas && bHas) return 1
      if (aHas && !bHas) return -1
      av = aHas ? new Date(a.createdAt).getTime() : 0
      bv = bHas ? new Date(b.createdAt).getTime() : 0
    } else if (sort === 'tx') {
      av = a.tx?.total ?? 0
      bv = b.tx?.total ?? 0
    } else if (sort === 'price') {
      av = a.price.usd
      bv = b.price.usd
    } else {
      av = safeNumber(a.scores.total)
      bv = safeNumber(b.scores.total)
    }
    return (av - bv) * dir
  })

  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50')), 1), 500)
  const page = Math.max(parseInt(String(req.query.page || '1')), 1)
  const start = (page - 1) * limit

  res.json({
    meta: buildMeta(network, window.label),
    items: filtered.slice(start, start + limit),
    page,
    limit,
    total: filtered.length,
  })
})

analytics.get('/tokens/:id', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const includes = parseIncludes(req.query.include)
  const includeTx = includes.has('tx')
  const includeDepth = includes.has('depth')
  const hideScam = String(req.query.hide_scam || '').toLowerCase() === 'true'
  const tokenId = String(req.params.id || '').toLowerCase()

  const tokens = (await getTokens(network.name)) || []
  const token = tokens.find((t) => String(t.id).toLowerCase() === tokenId)

  if (!token) return res.status(404).send('Token is not found')

  const pools = await SwapPool.find({ chain: network.name, $or: [{ 'tokenA.id': token.id }, { 'tokenB.id': token.id }] }).lean()
  let markets = await Market.find({ chain: network.name, $or: [{ 'base_token.id': token.id }, { 'quote_token.id': token.id }] }).lean()
  if (hideScam) {
    const { scam_contracts, scam_tokens } = await getScamLists(network)
    markets = markets.filter((m) =>
      !scam_contracts.has(m.base_token.contract) &&
      !scam_contracts.has(m.quote_token.contract) &&
      !scam_tokens.has(m.base_token.id) &&
      !scam_tokens.has(m.quote_token.id)
    )
  }

  const { tokenTvlMap } = await fetchPlatformBalances(network, tokens)
  const tokenStats = buildTokenStats([token], pools, markets, window.label, tokenTvlMap).get(token.id)
  const tokenScores = await loadTokenScores(network.name)
  const tokenTxStats = await buildTokenTxStats(network.name, [token], pools, markets, window.since)
  const holdersStats = await loadTokenHoldersStats(network.name, [token.id])
  const score = tokenScores?.[token.id] || null
  const firstSeenAt = tokenScores?.[token.id]?.firstSeenAt ?? null
  const holders = holdersStats.get(token.id) || null
  const tx = tokenTxStats.get(token.id) || { swapTx: 0, spotTx: 0 }

  const baseTokenId = network?.baseToken ? `${network.baseToken.symbol}-${network.baseToken.contract}`.toLowerCase() : null
  const usdTokenId = network?.USD_TOKEN || null
  const tokenPool = pickPoolForToken(new Map([[token.id, pools]]), token.id, baseTokenId, usdTokenId)
  const priceChange24h = computeTokenPriceChange24(tokenPool, token.id)

  const fundamental = getFundamental(network.name, token)

  const priceMap = new Map<string, number>(tokens.map((t) => [t.id, safeNumber(t.usd_price)]))
  const marketTxStats = includeTx ? await buildMarketTxStats(network.name, markets.map((m) => m.id), window.since) : new Map()

  const spotPairs = await Promise.all(markets.map(async (m) => {
    let card = toMarketCard(m, window.label, priceMap)
    if (includeTx) card = attachMarketTxAndDepth(card, marketTxStats.get(m.id) ?? 0, null)
    if (includeDepth) {
      const depth = await buildOrderbookDepth(network.name, m, priceMap)
      card = attachMarketTxAndDepth(card, includeTx ? (marketTxStats.get(m.id) ?? 0) : null, depth)
    }
    return card
  }))

  res.json({
    meta: buildMeta(network, window.label),
    token: {
      id: token.id,
      symbol: token.symbol,
      contract: token.contract,
      name: token.name || null,
      decimals: token.decimals,
      logo: getLogoUrl(network.name, token.id),
      price: { usd: safeNumber(token.usd_price), change24h: priceChange24h },
      liquidity: { tvl: safeNumber(tokenStats?.tvlUSD) },
      volume: {
        swap: safeNumber(tokenStats?.swapVolumeUSD),
        spot: safeNumber(tokenStats?.spotVolumeUSD),
        total: safeNumber(tokenStats?.swapVolumeUSD) + safeNumber(tokenStats?.spotVolumeUSD),
      },
      pairs: { pools: tokenStats?.poolsCount || 0, spots: tokenStats?.spotPairsCount || 0 },
      createdAt: firstSeenAt,
      tx: { swap: tx.swapTx, spot: tx.spotTx, total: tx.swapTx + tx.spotTx },
      holders: holders ? {
        count: holders.holders ?? null,
        change1h: holders.change1h ?? null,
        change6h: holders.change6h ?? null,
        change24h: holders.change24h ?? null,
        truncated: holders.truncated ?? false,
      } : null,
      fundamental,
      scores: score ? { total: score.score, details: score } : { total: null, details: null },
    },
    pools: pools.map((p) => toPoolCard(p, window.label)),
    spotPairs,
  })
})

analytics.get('/tokens/:id/pools', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const includes = parseIncludes(req.query.include)
  const includeIncentives = includes.has('incentives')
  const tokenId = String(req.params.id || '').toLowerCase()

  const pools = await SwapPool.find({
    chain: network.name,
    $or: [{ 'tokenA.id': tokenId }, { 'tokenB.id': tokenId }],
  }).lean()

  const tokens = includeIncentives ? (await getTokens(network.name)) || [] : []
  const tokensMap = new Map<string, TokenInfo>(
    tokens.map((t) => [t.id, t])
  )
  const incentivesByPool = includeIncentives ? await loadIncentivesByPool(network) : new Map()

  const items = pools.map((p) => {
    const card = toPoolCard(p, window.label)
    return includeIncentives ? attachIncentives(card, p, incentivesByPool, tokensMap) : card
  })

  res.json({
    meta: buildMeta(network, window.label),
    items,
  })
})

analytics.get('/tokens/:id/spot-pairs', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const includes = parseIncludes(req.query.include)
  const includeTx = includes.has('tx')
  const includeDepth = includes.has('depth')
  const hideScam = String(req.query.hide_scam || '').toLowerCase() === 'true'
  const tokenId = String(req.params.id || '').toLowerCase()

  let markets = await Market.find({
    chain: network.name,
    $or: [{ 'base_token.id': tokenId }, { 'quote_token.id': tokenId }],
  }).lean()
  if (hideScam) {
    const { scam_contracts, scam_tokens } = await getScamLists(network)
    markets = markets.filter((m) =>
      !scam_contracts.has(m.base_token.contract) &&
      !scam_contracts.has(m.quote_token.contract) &&
      !scam_tokens.has(m.base_token.id) &&
      !scam_tokens.has(m.quote_token.id)
    )
  }

  const tokens = (await getTokens(network.name)) || []
  const priceMap = new Map<string, number>(tokens.map((t) => [t.id, safeNumber(t.usd_price)]))
  const marketTxStats = includeTx ? await buildMarketTxStats(network.name, markets.map((m) => m.id), window.since) : new Map()

  const items = await Promise.all(markets.map(async (m) => {
    let card = toMarketCard(m, window.label, priceMap)
    if (includeTx) card = attachMarketTxAndDepth(card, marketTxStats.get(m.id) ?? 0, null)
    if (includeDepth) {
      const depth = await buildOrderbookDepth(network.name, m, priceMap)
      card = attachMarketTxAndDepth(card, includeTx ? (marketTxStats.get(m.id) ?? 0) : null, depth)
    }
    return card
  }))

  res.json({
    meta: buildMeta(network, window.label),
    items,
  })
})

analytics.get('/pools', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const includes = parseIncludes(req.query.include)
  const includeIncentives = includes.has('incentives')
  const includeTx = includes.has('tx')
  const hideScam = String(req.query.hide_scam || '').toLowerCase() === 'true'
  const search = String(req.query.search || '').toLowerCase().trim()
  const sort = String(req.query.sort || 'volume').toLowerCase()
  const order = String(req.query.order || 'desc').toLowerCase()
  const dir = order === 'asc' ? 1 : -1

  let pools = await SwapPool.find({ chain: network.name }).lean()

  if (hideScam) {
    const { scam_contracts, scam_tokens } = await getScamLists(network)
    pools = pools.filter((p) =>
      !scam_contracts.has(p.tokenA.contract) &&
      !scam_contracts.has(p.tokenB.contract) &&
      !scam_tokens.has(p.tokenA.id) &&
      !scam_tokens.has(p.tokenB.id)
    )
  }

  const needsTokens = includeIncentives || Boolean(search)
  const tokens = needsTokens ? (await getTokens(network.name)) || [] : []
  const tokensById = needsTokens ? new Map<string, any>(tokens.map((t) => [t.id, t])) : new Map()
  const tokensMap = new Map<string, TokenInfo>(
    tokens.map((t) => [t.id, t])
  )
  const incentivesByPool = includeIncentives ? await loadIncentivesByPool(network) : new Map()
  const aprByPool = new Map<number, number>()

  if (search) {
    const terms = parseSearchTerms(search)
    if (terms.length) {
      pools = pools.filter((p) => {
        const stack = buildPoolSearchStack(p, tokensById)
        return terms.every((term) => stack.includes(term))
      })
    }
  }

  if (sort === 'apr') {
    for (const pool of pools) {
      const feeApr = calcPoolFeeApr7d(pool)
      const farmApr = includeIncentives ? calcPoolFarmApr(pool, incentivesByPool, tokensMap) : 0
      const totalApr = Number((feeApr + farmApr).toFixed(2))
      aprByPool.set(Number(pool.id), totalApr)
    }
  }

  pools.sort((a, b) => {
    let av = 0
    let bv = 0
    if (sort === 'apr') {
      av = aprByPool.get(Number(a.id)) ?? 0
      bv = aprByPool.get(Number(b.id)) ?? 0
    } else if (sort === 'tvl') {
      av = safeNumber(a.tvlUSD)
      bv = safeNumber(b.tvlUSD)
    } else {
      av = pickPoolVolumes(a, window.label).usd
      bv = pickPoolVolumes(b, window.label).usd
    }
    return (av - bv) * dir
  })

  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50')), 1), 500)
  const page = Math.max(parseInt(String(req.query.page || '1')), 1)
  const start = (page - 1) * limit

  const pagePools = pools.slice(start, start + limit)
  const poolTxStats = includeTx ? await buildPoolTxStats(network.name, pagePools.map((p) => p.id), window.since) : new Map()

  res.json({
    meta: buildMeta(network, window.label),
    items: pagePools.map((p) => {
      let card = toPoolCard(p, window.label)
      if (includeIncentives) card = attachIncentives(card, p, incentivesByPool, tokensMap)
      if (includeTx) card = attachPoolTx(card, poolTxStats.get(p.id) ?? 0)
      return card
    }),
    page,
    limit,
    total: pools.length,
  })
})

analytics.get('/farms', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const status = String(req.query.status || 'active').toLowerCase()
  const sort = String(req.query.sort || 'apr').toLowerCase()
  const order = String(req.query.order || 'desc').toLowerCase()
  const dir = order === 'asc' ? 1 : -1
  const hideScam = String(req.query.hide_scam || '').toLowerCase() === 'true'
  const search = String(req.query.search || '').toLowerCase().trim()
  const searchTerms = parseSearchTerms(search)
  const minPoolTvl = Number(req.query.min_pool_tvl ?? req.query.min_tvl ?? 0)
  const minStakedTvl = Number(req.query.min_staked_tvl ?? 0)

  let pools = await SwapPool.find({ chain: network.name }).lean()

  if (hideScam) {
    const { scam_contracts, scam_tokens } = await getScamLists(network)
    pools = pools.filter((p) =>
      !scam_contracts.has(p.tokenA.contract) &&
      !scam_contracts.has(p.tokenB.contract) &&
      !scam_tokens.has(p.tokenA.id) &&
      !scam_tokens.has(p.tokenB.id)
    )
  }

  const poolsById = new Map<number, any>(pools.map((p) => [Number(p.id), p]))
  const tokens = (await getTokens(network.name)) || []
  const tokensMap = new Map<string, TokenInfo>(tokens.map((t) => [t.id, t]))

  let incentives = await getIncentives(network)
  if (status === 'active') {
    incentives = incentives.filter((i) => !i.isFinished)
  } else if (status === 'finished') {
    incentives = incentives.filter((i) => i.isFinished)
  }

  const items = incentives.map((inc) => {
    const pool = poolsById.get(Number(inc.poolId))
    if (!pool) return null

    const rewardSymbol = inc?.reward?.symbol?.symbol ?? inc?.reward?.symbol ?? null
    const rewardContract = inc?.reward?.contract ?? null
    const rewardTokenId =
      rewardSymbol && rewardContract ? `${String(rewardSymbol).toLowerCase()}-${rewardContract}` : null
    const rewardToken = rewardTokenId ? tokensMap.get(rewardTokenId) : null

    if (searchTerms.length) {
      const searchStack = [
        rewardSymbol,
        rewardContract,
        rewardTokenId,
        rewardToken?.name,
        buildPoolSearchStack(pool, tokensMap),
        String(pool?.id || ''),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      if (!searchTerms.every((term) => searchStack.includes(term))) return null
    }

    return toFarmCard(inc, pool, tokensMap, window.label)
  }).filter(Boolean)

  const filteredItems = items.filter((item) => {
    const poolTvl = safeNumber(item.poolTvlUSD)
    const stakedTvl = safeNumber(item.stakedTvlUSD)

    if (Number.isFinite(minPoolTvl) && minPoolTvl > 0 && poolTvl < minPoolTvl) return false
    if (Number.isFinite(minStakedTvl) && minStakedTvl > 0 && stakedTvl < minStakedTvl) return false
    return true
  })

  filteredItems.sort((a, b) => {
    let av = 0
    let bv = 0
    if (sort === 'rewards') {
      av = safeNumber(a.rewardPerDayUSD)
      bv = safeNumber(b.rewardPerDayUSD)
    } else if (sort === 'tvl') {
      av = safeNumber(a.poolTvlUSD)
      bv = safeNumber(b.poolTvlUSD)
    } else if (sort === 'staked') {
      av = safeNumber(a.stakedTvlUSD)
      bv = safeNumber(b.stakedTvlUSD)
    } else if (sort === 'remaining') {
      av = safeNumber(a.daysRemain)
      bv = safeNumber(b.daysRemain)
    } else if (sort === 'utilization') {
      av = safeNumber(a.utilizationPct)
      bv = safeNumber(b.utilizationPct)
    } else if (sort === 'volume') {
      av = safeNumber(a.poolVolumeUSD)
      bv = safeNumber(b.poolVolumeUSD)
    } else {
      av = safeNumber(a.apr)
      bv = safeNumber(b.apr)
    }
    return (av - bv) * dir
  })

  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50')), 1), 500)
  const page = Math.max(parseInt(String(req.query.page || '1')), 1)
  const start = (page - 1) * limit

  res.json({
    meta: buildMeta(network, window.label),
    items: filteredItems.slice(start, start + limit),
    page,
    limit,
    total: filteredItems.length,
  })
})

analytics.get('/pools/:id', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const includes = parseIncludes(req.query.include)
  const includeIncentives = includes.has('incentives')
  const includeFarmCards = includes.has('farm_cards') || includes.has('farms')
  const incentivesFilter = String(req.query.incentives || 'active').toLowerCase()
  const id = parseInt(String(req.params.id || ''), 10)

  if (!Number.isFinite(id)) return res.status(400).send('Invalid pool id')

  const pool = await SwapPool.findOne({ chain: network.name, id }).lean()
  if (!pool) return res.status(404).send('Pool is not found')

  const needIncentives = includeIncentives || includeFarmCards
  const tokens = needIncentives ? (await getTokens(network.name)) || [] : []
  const tokensMap = new Map<string, TokenInfo>(
    tokens.map((t) => [t.id, t])
  )
  const incentivesByPool = needIncentives ? await loadIncentivesByPool(network) : new Map()
  let card: any = toPoolCard(pool, window.label)
  if (includeIncentives) {
    card = attachIncentives(card, pool, incentivesByPool, tokensMap)
    if (incentivesFilter === 'active') {
      card.incentives = card.incentives.filter((i) => !i.isFinished)
    } else if (incentivesFilter === 'finished') {
      card.incentives = card.incentives.filter((i) => i.isFinished)
    }
  }
  if (includeFarmCards) {
    let incs = incentivesByPool.get(pool.id) || []
    if (incentivesFilter === 'active') {
      incs = incs.filter((i) => !i.isFinished)
    } else if (incentivesFilter === 'finished') {
      incs = incs.filter((i) => i.isFinished)
    }
    card = { ...card, farms: incs.map((i) => toFarmCard(i, pool, tokensMap, window.label)).filter(Boolean) }
  }
  const poolTxStats = await buildPoolTxStats(network.name, [pool.id], window.since)
  card = attachPoolTx(card, poolTxStats.get(pool.id) ?? 0)

  res.json({
    meta: buildMeta(network, window.label),
    pool: card,
  })
})

analytics.get('/spot-pairs', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const includes = parseIncludes(req.query.include)
  const includeTx = includes.has('tx')
  const includeDepth = includes.has('depth')
  const hideScam = String(req.query.hide_scam || '').toLowerCase() === 'true'

  let markets = await Market.find({ chain: network.name }).lean()
  if (hideScam) {
    const { scam_contracts, scam_tokens } = await getScamLists(network)
    markets = markets.filter((m) =>
      !scam_contracts.has(m.base_token.contract) &&
      !scam_contracts.has(m.quote_token.contract) &&
      !scam_tokens.has(m.base_token.id) &&
      !scam_tokens.has(m.quote_token.id)
    )
  }
  const tokens = (await getTokens(network.name)) || []
  const priceMap = new Map<string, number>(tokens.map((t) => [t.id, safeNumber(t.usd_price)]))

  const sort = String(req.query.sort || 'volume').toLowerCase()
  const order = String(req.query.order || 'desc').toLowerCase()
  const dir = order === 'asc' ? 1 : -1

  markets.sort((a, b) => {
    let av = 0
    let bv = 0
    if (sort === 'price') {
      av = safeNumber(a.last_price)
      bv = safeNumber(b.last_price)
    } else {
      av = pickMarketVolumeUsd(a, window.label, priceMap)
      bv = pickMarketVolumeUsd(b, window.label, priceMap)
    }
    return (av - bv) * dir
  })

  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50')), 1), 500)
  const page = Math.max(parseInt(String(req.query.page || '1')), 1)
  const start = (page - 1) * limit

  const pageMarkets = markets.slice(start, start + limit)
  const marketTxStats = includeTx ? await buildMarketTxStats(network.name, pageMarkets.map((m) => m.id), window.since) : new Map()

  const items = await Promise.all(pageMarkets.map(async (m) => {
    let card = toMarketCard(m, window.label, priceMap)
    if (includeTx) card = attachMarketTxAndDepth(card, marketTxStats.get(m.id) ?? 0, null)
    if (includeDepth) {
      const depth = await buildOrderbookDepth(network.name, m, priceMap)
      card = attachMarketTxAndDepth(card, includeTx ? (marketTxStats.get(m.id) ?? 0) : null, depth)
    }
    return card
  }))

  res.json({
    meta: buildMeta(network, window.label),
    items,
    page,
    limit,
    total: markets.length,
  })
})

analytics.get('/spot-pairs/:id', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const includes = parseIncludes(req.query.include)
  const includeTx = includes.has('tx')
  const includeDepth = includes.has('depth')
  const id = parseInt(String(req.params.id || ''), 10)

  if (!Number.isFinite(id)) return res.status(400).send('Invalid market id')

  const market = await Market.findOne({ chain: network.name, id }).lean()
  if (!market) return res.status(404).send('Market is not found')

  const tokens = (await getTokens(network.name)) || []
  const priceMap = new Map<string, number>(tokens.map((t) => [t.id, safeNumber(t.usd_price)]))

  let card = toMarketCard(market, window.label, priceMap)
  if (includeTx) {
    const marketTxStats = await buildMarketTxStats(network.name, [market.id], window.since)
    card = attachMarketTxAndDepth(card, marketTxStats.get(market.id) ?? 0, null)
  }
  if (includeDepth) {
    const depth = await buildOrderbookDepth(network.name, market, priceMap)
    card = attachMarketTxAndDepth(card, includeTx ? card.tx?.matches ?? 0 : null, depth)
  }

  res.json({
    meta: buildMeta(network, window.label),
    market: card,
  })
})

analytics.get('/global/charts', cacheSeconds(120, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const resolution = getResolution(req.query.resolution)

  const $match = {
    chain: network.name,
    ...(window.since ? { time: { $gte: window.since } } : {}),
  }

  const $group = {
    _id: {
      $toDate: {
        $subtract: [
          { $toLong: '$time' },
          { $mod: [{ $toLong: '$time' }, resolution] },
        ],
      },
    },
    totalValueLocked: { $last: '$totalValueLocked' },
    swapTradingVolume: { $sum: '$swapTradingVolume' },
    spotTradingVolume: { $sum: '$spotTradingVolume' },
    swapFees: { $sum: '$swapFees' },
    spotFees: { $sum: '$spotFees' },
  }

  const rows = await GlobalStats.aggregate([
    { $match },
    { $sort: { time: 1 } },
    { $group },
    { $sort: { _id: 1 } },
  ])

  const items = rows.map((i) => {
    const tvl = safeNumber(i.totalValueLocked)
    const swapVolume = safeNumber(i.swapTradingVolume)
    const spotVolume = safeNumber(i.spotTradingVolume)
    const swapFees = safeNumber(i.swapFees)
    const spotFees = safeNumber(i.spotFees)
    const volume = swapVolume + spotVolume
    const fees = swapFees + spotFees

    return {
      t: i._id,
      tvl,
      volume,
      fees,
      swapVolume,
      spotVolume,
      swapFees,
      spotFees,
    }
  })

  res.json({
    meta: buildMeta(network, window.label),
    charts: {
      tvl: items.map((i) => ({ t: i.t, v: i.tvl })),
      volume: items.map((i) => ({ t: i.t, v: i.volume })),
      fees: items.map((i) => ({ t: i.t, v: i.fees })),
      swapVolume: items.map((i) => ({ t: i.t, v: i.swapVolume })),
      spotVolume: items.map((i) => ({ t: i.t, v: i.spotVolume })),
      swapFees: items.map((i) => ({ t: i.t, v: i.swapFees })),
      spotFees: items.map((i) => ({ t: i.t, v: i.spotFees })),
    },
    items,
  })
})

analytics.get('/pools/:id/charts', cacheSeconds(120, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const id = parseInt(String(req.params.id || ''), 10)
  if (!Number.isFinite(id)) return res.status(400).send('Invalid pool id')

  const resolution = getResolution(req.query.resolution)
  const window = getWindow(req.query.window)

  const fromInput = req.query.from
  const toInput = req.query.to
  const hasCustomRange = fromInput !== undefined || toInput !== undefined

  const fromMs = fromInput !== undefined ? Number(fromInput) : null
  const toMs = toInput !== undefined ? Number(toInput) : null

  if (fromInput !== undefined && !Number.isFinite(fromMs)) return res.status(400).send('Invalid from')
  if (toInput !== undefined && !Number.isFinite(toMs)) return res.status(400).send('Invalid to')

  const from = Number.isFinite(fromMs) ? new Date(fromMs as number) : null
  const to = Number.isFinite(toMs) ? new Date(toMs as number) : null
  if (from && to && from > to) return res.status(400).send('Invalid time range')

  const pool = await SwapPool.findOne({ chain: network.name, id }).lean()
  if (!pool) return res.status(404).send('Pool is not found')

  const $match: any = {
    chain: network.name,
    pool: id,
  }

  const since = hasCustomRange ? from : window.since
  if (since || to) {
    $match.time = {}
    if (since) $match.time.$gte = since
    if (to) $match.time.$lte = to
  }

  const rows = await SwapChartPoint.aggregate([
    { $match },
    { $sort: { time: 1 } },
    {
      $group: {
        _id: {
          $toDate: {
            $subtract: [
              { $toLong: '$time' },
              { $mod: [{ $toLong: '$time' }, resolution] },
            ],
          },
        },
        usdReserveA: { $last: '$usdReserveA' },
        usdReserveB: { $last: '$usdReserveB' },
        volumeUSD: { $sum: '$volumeUSD' },
      },
    },
    { $sort: { _id: 1 } },
  ])

  const feeRate = getPoolLpFeeRate(pool)
  const items = rows.map((row) => {
    const tvl = safeNumber(row.usdReserveA) + safeNumber(row.usdReserveB)
    const volume = normalizeSwapChartVolumeUSD(row.volumeUSD)
    const fees = volume * feeRate

    return {
      t: row._id,
      tvl: Number(tvl.toFixed(8)),
      volume: Number(volume.toFixed(8)),
      fees: Number(fees.toFixed(8)),
    }
  })

  res.json({
    meta: buildMeta(network, hasCustomRange ? 'custom' : window.label),
    poolId: id,
    feeRate,
    charts: {
      tvl: items.map((i) => ({ t: i.t, v: i.tvl })),
      volume: items.map((i) => ({ t: i.t, v: i.volume })),
      fees: items.map((i) => ({ t: i.t, v: i.fees })),
    },
    items,
  })
})

analytics.get('/pools/:id/candles', cacheSeconds(120, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const id = parseInt(String(req.params.id || ''), 10)
  if (!Number.isFinite(id)) return res.status(400).send('Invalid pool id')

  const resolutionRaw = normalizeCandleResolution(req.query.resolution || '1h')
  const frame = candleResolutions[resolutionRaw]
  if (!frame) return res.status(400).send('Invalid resolution')

  const from = req.query.from ? new Date(Number(req.query.from)) : null
  const to = req.query.to ? new Date(Number(req.query.to)) : null
  const volumeField = String(req.query.volumeField || 'volumeUSD')
  const reverse = String(req.query.reverse || '').toLowerCase() === 'true'

  const pool = await SwapPool.findOne({ chain: network.name, id }).lean()
  if (!pool) return res.status(404).send('Pool is not found')

  const tokenA = pool.tokenA
  const tokenB = pool.tokenB

  const query: any = {
    chain: network.name,
    pool: id,
    timeframe: String(resolutionRaw),
  }

  if (from || to) {
    query.time = {}
    if (from) query.time.$gte = from
    if (to) query.time.$lte = to
  }

  const candles = await SwapBar.find(query).sort({ time: 1 }).lean()
  const items = candles.map((c) => {
    const volume = (c as any)[volumeField]
    const item = {
      time: c.time,
      open: getSwapBarPriceAsString(c.open, tokenA, tokenB, reverse),
      high: getSwapBarPriceAsString(c.high, tokenA, tokenB, reverse),
      low: getSwapBarPriceAsString(c.low, tokenA, tokenB, reverse),
      close: getSwapBarPriceAsString(c.close, tokenA, tokenB, reverse),
      volume,
    }
    if (reverse) {
      [item.high, item.low] = [item.low, item.high]
    }
    return item
  })

  res.json({
    meta: buildMeta(network, String(req.query.window || 'custom')),
    timeframe: resolutionRaw,
    frame,
    items,
  })
})

analytics.get('/spot-pairs/:id/candles', cacheSeconds(120, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const id = parseInt(String(req.params.id || ''), 10)
  if (!Number.isFinite(id)) return res.status(400).send('Invalid market id')

  const resolutionRaw = normalizeCandleResolution(req.query.resolution || '1h')
  const frame = candleResolutions[resolutionRaw]
  if (!frame) return res.status(400).send('Invalid resolution')

  const from = req.query.from ? new Date(Number(req.query.from)) : null
  const to = req.query.to ? new Date(Number(req.query.to)) : null

  const query: any = {
    chain: network.name,
    market: id,
    timeframe: String(resolutionRaw),
  }

  if (from || to) {
    query.time = {}
    if (from) query.time.$gte = from
    if (to) query.time.$lte = to
  }

  const candles = await Bar.find(query).sort({ time: 1 }).lean()
  const items = candles.map((c) => ({
    time: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }))

  res.json({
    meta: buildMeta(network, String(req.query.window || 'custom')),
    timeframe: resolutionRaw,
    frame,
    items,
  })
})
