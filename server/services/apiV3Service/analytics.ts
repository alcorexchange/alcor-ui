import bigInt from 'big-integer'
import { Asset } from '@wharfkit/antelope'
import { Router } from 'express'
import { cacheSeconds } from 'route-cache'

import { SwapPool, Market, GlobalStats, SwapBar, Bar } from '../../models'
import { getTokens } from '../../utils'
import { getRedis } from '../redis'
import { getScamLists } from '../apiV2Service/config'
import { getSwapBarPriceAsString } from '../../../utils/amm'
import { resolutions as candleResolutions, normalizeResolution } from '../updaterService/charts'
import { getIncentives } from '../apiV2Service/farms'

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

function parseIncludes(input: any) {
  const raw = String(input || '').toLowerCase()
  if (!raw) return new Set<string>()
  return new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))
}

function getLogoUrl(networkName, tokenId) {
  if (!tokenId) return null
  return `https://${networkName}.alcor.exchange/api/v2/tokens/${tokenId}/logo`
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

async function loadTokenScores(chain: string) {
  const redis = getRedis()
  try {
    const raw = await redis.get(`${chain}_token_scores`)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

function buildTokenStats(tokens: any[], pools: any[], markets: any[], window: string) {
  const tokenStats = new Map<string, any>()
  const priceMap = new Map<string, number>(tokens.map((t) => [t.id, safeNumber(t.usd_price)]))

  for (const token of tokens) {
    tokenStats.set(token.id, {
      tvlUSD: 0,
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

    const tvlUSD = safeNumber(pool.tvlUSD)
    const volumes = pickPoolVolumes(pool, window)

    if (tokenStats.has(tokenAId)) {
      const stats = tokenStats.get(tokenAId)
      const price = priceMap.get(tokenAId) || 0
      stats.tvlUSD += tvlUSD / 2
      stats.swapVolumeUSD += volumes.a * price
      stats.poolsCount += 1
    }

    if (tokenStats.has(tokenBId)) {
      const stats = tokenStats.get(tokenBId)
      const price = priceMap.get(tokenBId) || 0
      stats.tvlUSD += tvlUSD / 2
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

function toPoolCard(pool: any, window: string) {
  const volumes = pickPoolVolumes(pool, window)
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
    tx: {
      swaps: null,
    },
  }
}

function calcIncentiveApr(incentive: any, pool: any, tokensMap: Map<string, { usd_price?: number }>) {
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
    const stakedPercentBn = bigInt(incentive.totalStakingWeight)
      .multiply(100)
      .multiply(1000)
      .divide(denominator)
    const stakedPercent = stakedPercentBn.toJSNumber() / 1000

    const tvlUSD = safeNumber(pool.tvlUSD) * (stakedPercent / 100)
    if (!tvlUSD || tvlUSD <= 0) return 0

    const rewardPerDay = safeNumber(incentive.rewardPerDay)
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
  const volumeQuote = pickMarketVolume(market, window)
  const quoteId = market?.quote_token?.id
  const quotePrice = priceMap.get(quoteId) || 0
  const volumeUSD = volumeQuote * quotePrice
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

function attachIncentives(poolCard: any, pool: any, incentivesByPool: Map<number, any[]>, tokensMap: Map<string, { usd_price?: number }>) {
  const incentives = incentivesByPool.get(pool.id) || []
  const mapped = incentives.map((i) => {
    const rewardSymbol = i?.reward?.symbol?.symbol ?? i?.reward?.symbol
    const rewardContract = i?.reward?.contract
    const rewardTokenId = rewardSymbol && rewardContract ? `${String(rewardSymbol).toLowerCase()}-${rewardContract}` : null

    return {
      incentiveId: i?.id ?? i?.incentiveId ?? null,
      poolId: i?.poolId ?? pool.id,
      reward: i?.reward ?? null,
      rewardPerDay: safeNumber(i?.rewardPerDay),
      periodFinish: i?.periodFinish ?? null,
      isFinished: Boolean(i?.isFinished),
      daysRemain: safeNumber(i?.daysRemain),
      rewardTokenId,
      apr: calcIncentiveApr(i, pool, tokensMap),
    }
  })

  return { ...poolCard, incentives: mapped }
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

analytics.get('/overview', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const includes = parseIncludes(req.query.include)
  const includeIncentives = includes.has('incentives')

  const tokens = (await getTokens(network.name)) || []
  const priceMap = new Map<string, number>(tokens.map((t) => [t.id, safeNumber(t.usd_price)]))

  const pools = await SwapPool.find({ chain: network.name }).lean()
  const markets = await Market.find({ chain: network.name }).lean()

  const tokenStats = buildTokenStats(tokens, pools, markets, window.label)
  const tokenScores = await loadTokenScores(network.name)

  const topPoolsRaw = [...pools]
    .sort((a, b) => pickPoolVolumes(b, window.label).usd - pickPoolVolumes(a, window.label).usd)
    .slice(0, 10)

  const incentivesByPool = includeIncentives ? await loadIncentivesByPool(network) : new Map()
  const tokensMap = includeIncentives ? new Map<string, { usd_price?: number }>(
    tokens.map((t) => [t.id, t])
  ) : new Map()

  const topPools = topPoolsRaw.map((p) => {
    const card = toPoolCard(p, window.label)
    return includeIncentives ? attachIncentives(card, p, incentivesByPool, tokensMap) : card
  })

  const topSpotPairs = [...markets]
    .sort((a, b) => pickMarketVolume(b, window.label) - pickMarketVolume(a, window.label))
    .slice(0, 10)
    .map((m) => toMarketCard(m, window.label, priceMap))

  const topTokens = tokens
    .map((t) => {
      const stats = tokenStats.get(t.id) || {}
      const score = tokenScores?.[t.id]?.score ?? null
      const volumeSwap = safeNumber(stats.swapVolumeUSD)
      const volumeSpot = safeNumber(stats.spotVolumeUSD)

      return {
        id: t.id,
        symbol: t.symbol,
        contract: t.contract,
        name: t.name || null,
        decimals: t.decimals,
        logo: getLogoUrl(network.name, t.id),
        price: { usd: safeNumber(t.usd_price) },
        liquidity: { tvl: safeNumber(stats.tvlUSD) },
        volume: { swap: volumeSwap, spot: volumeSpot, total: volumeSwap + volumeSpot },
        pairs: { pools: stats.poolsCount || 0, spots: stats.spotPairsCount || 0 },
        scores: { total: score },
      }
    })
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
  }

  const chart = await GlobalStats.aggregate([
    { $match },
    { $group },
    { $sort: { _id: 1 } },
  ])

  const [stats] = await GlobalStats.aggregate([
    { $match },
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

  res.json({
    meta: buildMeta(network, window.label),
    stats: {
      tvl: safeNumber(stats?.totalValueLocked),
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
      tvl: chart.map((i) => ({ t: i._id, v: safeNumber(i.totalValueLocked) })),
      swapVolume: chart.map((i) => ({ t: i._id, v: safeNumber(i.swapTradingVolume) })),
      spotVolume: chart.map((i) => ({ t: i._id, v: safeNumber(i.spotTradingVolume) })),
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

  const tokenStats = buildTokenStats(tokens, pools, markets, window.label)
  const tokenScores = await loadTokenScores(network.name)

  const result = tokens.map((t) => {
    const stats = tokenStats.get(t.id) || {}
    const score = tokenScores?.[t.id]?.score ?? null
    const volumeSwap = safeNumber(stats.swapVolumeUSD)
    const volumeSpot = safeNumber(stats.spotVolumeUSD)

    return {
      id: t.id,
      symbol: t.symbol,
      contract: t.contract,
      name: t.name || null,
      decimals: t.decimals,
      logo: getLogoUrl(network.name, t.id),
      price: { usd: safeNumber(t.usd_price) },
      liquidity: { tvl: safeNumber(stats.tvlUSD) },
      volume: { swap: volumeSwap, spot: volumeSpot, total: volumeSwap + volumeSpot },
      pairs: { pools: stats.poolsCount || 0, spots: stats.spotPairsCount || 0 },
      scores: { total: score },
    }
  })

  const sort = String(req.query.sort || 'score').toLowerCase()
  const order = String(req.query.order || 'desc').toLowerCase()
  const dir = order === 'asc' ? 1 : -1

  result.sort((a, b) => {
    let av = 0
    let bv = 0
    if (sort === 'volume') {
      av = a.volume.total
      bv = b.volume.total
    } else if (sort === 'tvl') {
      av = a.liquidity.tvl
      bv = b.liquidity.tvl
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
    items: result.slice(start, start + limit),
    page,
    limit,
    total: result.length,
  })
})

analytics.get('/tokens/:id', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const tokenId = String(req.params.id || '').toLowerCase()

  const tokens = (await getTokens(network.name)) || []
  const token = tokens.find((t) => String(t.id).toLowerCase() === tokenId)

  if (!token) return res.status(404).send('Token is not found')

  const pools = await SwapPool.find({ chain: network.name, $or: [{ 'tokenA.id': token.id }, { 'tokenB.id': token.id }] }).lean()
  const markets = await Market.find({ chain: network.name, $or: [{ 'base_token.id': token.id }, { 'quote_token.id': token.id }] }).lean()

  const tokenStats = buildTokenStats([token], pools, markets, window.label).get(token.id)
  const tokenScores = await loadTokenScores(network.name)
  const score = tokenScores?.[token.id] || null

  res.json({
    meta: buildMeta(network, window.label),
    token: {
      id: token.id,
      symbol: token.symbol,
      contract: token.contract,
      name: token.name || null,
      decimals: token.decimals,
      logo: getLogoUrl(network.name, token.id),
      price: { usd: safeNumber(token.usd_price) },
      liquidity: { tvl: safeNumber(tokenStats?.tvlUSD) },
      volume: {
        swap: safeNumber(tokenStats?.swapVolumeUSD),
        spot: safeNumber(tokenStats?.spotVolumeUSD),
        total: safeNumber(tokenStats?.swapVolumeUSD) + safeNumber(tokenStats?.spotVolumeUSD),
      },
      pairs: { pools: tokenStats?.poolsCount || 0, spots: tokenStats?.spotPairsCount || 0 },
      scores: score ? { total: score.score, details: score } : { total: null, details: null },
    },
    pools: pools.map((p) => toPoolCard(p, window.label)),
    spotPairs: markets.map((m) => toMarketCard(m, window.label, new Map<string, number>(tokens.map((t) => [t.id, safeNumber(t.usd_price)])))),
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
  const tokensMap = new Map<string, { usd_price?: number }>(
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
  const tokenId = String(req.params.id || '').toLowerCase()

  const markets = await Market.find({
    chain: network.name,
    $or: [{ 'base_token.id': tokenId }, { 'quote_token.id': tokenId }],
  }).lean()

  const tokens = (await getTokens(network.name)) || []
  const priceMap = new Map<string, number>(tokens.map((t) => [t.id, safeNumber(t.usd_price)]))

  res.json({
    meta: buildMeta(network, window.label),
    items: markets.map((m) => toMarketCard(m, window.label, priceMap)),
  })
})

analytics.get('/pools', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const includes = parseIncludes(req.query.include)
  const includeIncentives = includes.has('incentives')
  const hideScam = String(req.query.hide_scam || '').toLowerCase() === 'true'

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

  const sort = String(req.query.sort || 'volume').toLowerCase()
  const order = String(req.query.order || 'desc').toLowerCase()
  const dir = order === 'asc' ? 1 : -1

  pools.sort((a, b) => {
    let av = 0
    let bv = 0
    if (sort === 'tvl') {
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

  const tokens = includeIncentives ? (await getTokens(network.name)) || [] : []
  const tokensMap = new Map<string, { usd_price?: number }>(
    tokens.map((t) => [t.id, t])
  )
  const incentivesByPool = includeIncentives ? await loadIncentivesByPool(network) : new Map()

  res.json({
    meta: buildMeta(network, window.label),
    items: pools
      .slice(start, start + limit)
      .map((p) => {
        const card = toPoolCard(p, window.label)
        return includeIncentives ? attachIncentives(card, p, incentivesByPool, tokensMap) : card
      }),
    page,
    limit,
    total: pools.length,
  })
})

analytics.get('/pools/:id', cacheSeconds(60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const includes = parseIncludes(req.query.include)
  const includeIncentives = includes.has('incentives')
  const id = parseInt(String(req.params.id || ''), 10)

  if (!Number.isFinite(id)) return res.status(400).send('Invalid pool id')

  const pool = await SwapPool.findOne({ chain: network.name, id }).lean()
  if (!pool) return res.status(404).send('Pool is not found')

  const tokens = includeIncentives ? (await getTokens(network.name)) || [] : []
  const tokensMap = new Map<string, { usd_price?: number }>(
    tokens.map((t) => [t.id, t])
  )
  const incentivesByPool = includeIncentives ? await loadIncentivesByPool(network) : new Map()
  const baseCard = toPoolCard(pool, window.label)
  const card = includeIncentives ? attachIncentives(baseCard, pool, incentivesByPool, tokensMap) : baseCard

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

  const markets = await Market.find({ chain: network.name }).lean()
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
      av = pickMarketVolume(a, window.label)
      bv = pickMarketVolume(b, window.label)
    }
    return (av - bv) * dir
  })

  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50')), 1), 500)
  const page = Math.max(parseInt(String(req.query.page || '1')), 1)
  const start = (page - 1) * limit

  res.json({
    meta: buildMeta(network, window.label),
    items: markets.slice(start, start + limit).map((m) => toMarketCard(m, window.label, priceMap)),
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
  const id = parseInt(String(req.params.id || ''), 10)

  if (!Number.isFinite(id)) return res.status(400).send('Invalid market id')

  const market = await Market.findOne({ chain: network.name, id }).lean()
  if (!market) return res.status(404).send('Market is not found')

  const tokens = (await getTokens(network.name)) || []
  const priceMap = new Map<string, number>(tokens.map((t) => [t.id, safeNumber(t.usd_price)]))

  res.json({
    meta: buildMeta(network, window.label),
    market: toMarketCard(market, window.label, priceMap),
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
    { $group },
    { $sort: { _id: 1 } },
  ])

  res.json({
    meta: buildMeta(network, window.label),
    items: rows.map((i) => ({
      t: i._id,
      tvl: safeNumber(i.totalValueLocked),
      swapVolume: safeNumber(i.swapTradingVolume),
      spotVolume: safeNumber(i.spotTradingVolume),
      swapFees: safeNumber(i.swapFees),
      spotFees: safeNumber(i.spotFees),
    })),
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
    return {
      time: c.time,
      open: getSwapBarPriceAsString(c.open, tokenA, tokenB, reverse),
      high: getSwapBarPriceAsString(c.high, tokenA, tokenB, reverse),
      low: getSwapBarPriceAsString(c.low, tokenA, tokenB, reverse),
      close: getSwapBarPriceAsString(c.close, tokenA, tokenB, reverse),
      volume,
    }
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
