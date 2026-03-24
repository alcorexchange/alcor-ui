import config from '../../../config'

import { Swap, SwapBar, SwapPool, Match, Market } from '../../models'
import { fetchPlatformBalances, getTokens } from '../../utils'
import { getRedis } from '../redis'
import { getSwapBarPriceAsString } from '../../../utils/amm'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS
const MONTH_MS = 30 * DAY_MS
const QUARTER_MS = 90 * DAY_MS

const SCORE_WINDOW_DAYS = 30
const SCORE_WINDOW_LABEL = '30d'
const SCORE_TIMEFRAME = '1D'

const TRADERS_FULL_SCORE_AT = 500
const LIQUIDITY_FULL_SCORE_AT_USD = 50_000
const TRADERS_HARD_CAP_MIN = 20
const TVL_HARD_CAP_MIN_USD = 2_500
const TURNOVER_SCORE_MIN = 0.1
const TURNOVER_SCORE_MAX = 3

const COMPONENT_WEIGHTS = {
  traders: 25,
  volume: 20,
  liquidity: 15,
  holders: 10,
  activity: 10,
  stability: 10,
  age: 10,
} as const

const MAX_SANE_PRICE = 100000
const MAX_SANE_VOLUME = 1_000_000_000

type TokenStat = {
  volumeUsd30d: number
  volumeUsd7d: number
  trades30d: number
  trades7d: number
  uniqueTraders30d: Set<string>
  uniqueTraders7d: Set<string>
  uniqueTraders24h: Set<string>
  uniqueTradersPrev24h: Set<string>
  uniqueTradersPrev7d: Set<string>
  firstSeenAt: Date | null
  holders: number | null
}

type PoolTokenPair = {
  id: number
  tokenA: any
  tokenB: any
  firstSeenAt: Date | null
  tvlUSD: number
}

type ReferencePool = {
  poolId: number
  tokenId: string
  tokenA: any
  tokenB: any
  reverse: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function safeNumber(value: any, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function roundTo(value: number, digits = 2) {
  if (!Number.isFinite(value)) return 0
  return Number(value.toFixed(digits))
}

function linearScore(value: number, maxValue: number) {
  return clamp(value / Math.max(maxValue, 1), 0, 1)
}

function boundedLinearScore(value: number, minValue: number, maxValue: number) {
  if (value <= minValue) return 0
  if (value >= maxValue) return 1
  return (value - minValue) / (maxValue - minValue)
}

function ensureStat(map: Map<string, TokenStat>, tokenId: string) {
  if (!map.has(tokenId)) {
    map.set(tokenId, {
      volumeUsd30d: 0,
      volumeUsd7d: 0,
      trades30d: 0,
      trades7d: 0,
      uniqueTraders30d: new Set(),
      uniqueTraders7d: new Set(),
      uniqueTraders24h: new Set(),
      uniqueTradersPrev24h: new Set(),
      uniqueTradersPrev7d: new Set(),
      firstSeenAt: null,
      holders: null,
    })
  }
  return map.get(tokenId)!
}

function minDate(a: Date | null, b: Date | null) {
  if (!a) return b
  if (!b) return a
  return a < b ? a : b
}

function isBasePair(baseTokenId: string, tokenAId: string, tokenBId: string) {
  return (
    (tokenAId === baseTokenId && tokenBId !== baseTokenId)
    || (tokenBId === baseTokenId && tokenAId !== baseTokenId)
  )
}

function computeBasePerTokenPriceForPair(
  pair: PoolTokenPair,
  baseTokenId: string,
  tokenAAmount: any,
  tokenBAmount: any
) {
  const amountA = Math.abs(Number(tokenAAmount || 0))
  const amountB = Math.abs(Number(tokenBAmount || 0))
  if (!Number.isFinite(amountA) || !Number.isFinite(amountB) || amountA <= 0 || amountB <= 0) return 0

  if (pair.tokenA.id === baseTokenId) return amountA / amountB
  if (pair.tokenB.id === baseTokenId) return amountB / amountA
  return 0
}

async function collectTokenPriceChangeMap(
  chain: string,
  poolTokens: Map<number, PoolTokenPair>,
  baseTokenId: string,
  since: Date
) {
  const rows = await Swap.aggregate([
    { $match: { chain, time: { $gte: since } } },
    { $sort: { time: 1 } },
    {
      $group: {
        _id: '$pool',
        firstTokenA: { $first: '$tokenA' },
        firstTokenB: { $first: '$tokenB' },
        firstTime: { $first: '$time' },
        lastTokenA: { $last: '$tokenA' },
        lastTokenB: { $last: '$tokenB' },
        lastTime: { $last: '$time' },
      }
    }
  ]).allowDiskUse(true)

  const byToken = new Map<string, { firstTs: number, firstPrice: number, lastTs: number, lastPrice: number }>()

  for (const row of rows) {
    const pair = poolTokens.get(Number(row?._id))
    if (!pair) continue
    if (!isBasePair(baseTokenId, pair.tokenA.id, pair.tokenB.id)) continue

    const tokenId = pair.tokenA.id === baseTokenId ? pair.tokenB.id : pair.tokenA.id
    const firstPrice = computeBasePerTokenPriceForPair(pair, baseTokenId, row?.firstTokenA, row?.firstTokenB)
    const lastPrice = computeBasePerTokenPriceForPair(pair, baseTokenId, row?.lastTokenA, row?.lastTokenB)
    if (firstPrice <= 0 || lastPrice <= 0) continue

    const firstTs = new Date(row?.firstTime).getTime()
    const lastTs = new Date(row?.lastTime).getTime()
    if (!Number.isFinite(firstTs) || !Number.isFinite(lastTs)) continue

    const current = byToken.get(tokenId)
    if (!current) {
      byToken.set(tokenId, { firstTs, firstPrice, lastTs, lastPrice })
      continue
    }

    if (firstTs < current.firstTs) {
      current.firstTs = firstTs
      current.firstPrice = firstPrice
    }

    if (lastTs > current.lastTs) {
      current.lastTs = lastTs
      current.lastPrice = lastPrice
    }
  }

  const out = new Map<string, number>()
  for (const [tokenId, snap] of byToken.entries()) {
    if (!Number.isFinite(snap.firstPrice) || !Number.isFinite(snap.lastPrice) || snap.firstPrice <= 0 || snap.lastPrice <= 0) {
      continue
    }
    const pct = ((snap.lastPrice / snap.firstPrice) - 1) * 100
    if (!Number.isFinite(pct)) continue
    out.set(tokenId, pct)
  }

  return out
}

async function loadHoldersByToken(chain: string, tokenIds: string[]) {
  const redis = getRedis()
  if (!tokenIds.length) return new Map<string, { holders: number, truncated: boolean }>()

  const raw = await redis.hmGet(`${chain}_token_holders_stats`, tokenIds)
  const out = new Map<string, { holders: number, truncated: boolean }>()

  for (let i = 0; i < tokenIds.length; i += 1) {
    const value = raw[i]
    if (!value) continue
    try {
      const parsed = JSON.parse(value)
      const holders = safeNumber(parsed?.holders, NaN as any)
      if (!Number.isFinite(holders)) continue
      out.set(tokenIds[i], {
        holders,
        truncated: Boolean(parsed?.truncated),
      })
    } catch (e) {
      // ignore malformed holder cache rows
    }
  }

  return out
}

function pickReferencePoolForToken(
  pools: PoolTokenPair[],
  tokenId: string,
  baseTokenId: string | null,
  usdTokenId: string | null
) {
  const scored = pools
    .filter((pool) => pool.tokenA.id === tokenId || pool.tokenB.id === tokenId)
    .map((pool) => {
      const otherTokenId = pool.tokenA.id === tokenId ? pool.tokenB.id : pool.tokenA.id
      let priority = 1
      if (usdTokenId && otherTokenId === usdTokenId) priority = 3
      else if (baseTokenId && otherTokenId === baseTokenId) priority = 2
      return { pool, priority }
    })
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return safeNumber(b.pool.tvlUSD) - safeNumber(a.pool.tvlUSD)
    })

  return scored[0]?.pool || null
}

async function collectPriceStabilityMap(
  chain: string,
  pools: PoolTokenPair[],
  tokenIds: string[],
  baseTokenId: string | null,
  usdTokenId: string | null,
  since: Date
) {
  const poolsByToken = new Map<string, PoolTokenPair[]>()
  for (const pool of pools) {
    for (const tokenId of [pool.tokenA.id, pool.tokenB.id]) {
      if (!poolsByToken.has(tokenId)) poolsByToken.set(tokenId, [])
      poolsByToken.get(tokenId)!.push(pool)
    }
  }

  const references = new Map<string, ReferencePool>()
  for (const tokenId of tokenIds) {
    const selected = pickReferencePoolForToken(poolsByToken.get(tokenId) || [], tokenId, baseTokenId, usdTokenId)
    if (!selected) continue
    references.set(tokenId, {
      poolId: selected.id,
      tokenId,
      tokenA: selected.tokenA,
      tokenB: selected.tokenB,
      reverse: selected.tokenB.id === tokenId,
    })
  }

  const poolIds = [...new Set([...references.values()].map((ref) => ref.poolId))]
  if (!poolIds.length) return new Map<string, { currentPrice: number, rollingHigh: number, drawdown: number, poolId: number }>()

  const bars = await SwapBar.find({
    chain,
    timeframe: SCORE_TIMEFRAME,
    pool: { $in: poolIds },
    time: { $gte: since },
  })
    .select('pool high close time')
    .sort({ time: 1 })
    .lean()

  const barsByPool = new Map<number, any[]>()
  for (const bar of bars) {
    const poolId = Number(bar?.pool)
    if (!Number.isFinite(poolId)) continue
    if (!barsByPool.has(poolId)) barsByPool.set(poolId, [])
    barsByPool.get(poolId)!.push(bar)
  }

  const out = new Map<string, { currentPrice: number, rollingHigh: number, drawdown: number, poolId: number }>()

  for (const [tokenId, ref] of references.entries()) {
    const rows = barsByPool.get(ref.poolId) || []
    let rollingHigh = 0
    let currentPrice = 0

    for (const row of rows) {
      const high = safeNumber(getSwapBarPriceAsString(row.high, ref.tokenA, ref.tokenB, ref.reverse), 0)
      const close = safeNumber(getSwapBarPriceAsString(row.close, ref.tokenA, ref.tokenB, ref.reverse), 0)

      if (high > rollingHigh) rollingHigh = high
      if (close > 0) currentPrice = close
    }

    if (rollingHigh <= 0 || currentPrice <= 0) continue

    out.set(tokenId, {
      currentPrice,
      rollingHigh,
      drawdown: clamp(currentPrice / rollingHigh, 0, 1),
      poolId: ref.poolId,
    })
  }

  return out
}

function computeTurnoverScore(turnover: number) {
  if (!Number.isFinite(turnover) || turnover <= TURNOVER_SCORE_MIN) return 0
  if (turnover >= TURNOVER_SCORE_MAX) return 1
  return (turnover - TURNOVER_SCORE_MIN) / (TURNOVER_SCORE_MAX - TURNOVER_SCORE_MIN)
}

export async function updateTokenScores(network: Network) {
  const chain = network.name
  const baseTokenId = String((config as any)?.networks?.[chain]?.baseToken?.id || '').toLowerCase() || null
  const usdTokenId = String((network as any)?.USD_TOKEN || '').toLowerCase() || null
  const redis = getRedis()

  try {
    const tokens = await getTokens(chain)
    if (!Array.isArray(tokens) || tokens.length === 0) {
      console.warn(`[${chain}] token list missing, skip token scores`)
      return
    }

    console.time(`[${chain}] token scores updated`)

    const tokenIds = new Set(tokens.map((t) => t.id))
    const priceMap = new Map(
      tokens.map((t) => [t.id, safeNumber((t.safe_usd_price && t.safe_usd_price < MAX_SANE_PRICE) ? t.safe_usd_price : 0)])
    )

    const stats = new Map<string, TokenStat>()
    const nowTs = Date.now()
    const since30d = new Date(nowTs - MONTH_MS)
    const since7d = new Date(nowTs - WEEK_MS)
    const since24h = new Date(nowTs - DAY_MS)
    const since90d = new Date(nowTs - QUARTER_MS)
    const sincePrev24h = new Date(nowTs - (2 * DAY_MS))
    const sincePrev7d = new Date(nowTs - (2 * WEEK_MS))

    const [pools, markets, holdersByToken, { tokenTvlMap }] = await Promise.all([
      SwapPool.find({ chain }).select('id tokenA tokenB firstSeenAt tvlUSD').lean(),
      Market.find({ chain }).select('id base_token quote_token').lean(),
      loadHoldersByToken(chain, tokens.map((t) => t.id)),
      fetchPlatformBalances(network, tokens),
    ])

    const poolTokens = new Map<number, PoolTokenPair>(
      pools.map((p) => [Number(p.id), {
        id: Number(p.id),
        tokenA: p.tokenA,
        tokenB: p.tokenB,
        firstSeenAt: p.firstSeenAt || null,
        tvlUSD: safeNumber(p.tvlUSD),
      }])
    )

    const marketTokens = new Map<number, { base: string, quote: string }>(
      markets.map((m) => [Number(m.id), { base: m.base_token.id, quote: m.quote_token.id }])
    )
    const poolLiquidityUsdByToken = new Map<string, number>()

    for (const pool of poolTokens.values()) {
      const shareUsd = safeNumber(pool.tvlUSD) / 2
      if (shareUsd <= 0) continue

      for (const tokenId of [pool.tokenA.id, pool.tokenB.id]) {
        poolLiquidityUsdByToken.set(tokenId, safeNumber(poolLiquidityUsdByToken.get(tokenId)) + shareUsd)
      }
    }

    const swapByPool = await Swap.aggregate([
      { $match: { chain, time: { $gte: since30d } } },
      {
        $group: {
          _id: '$pool',
          volumeUsd30d: { $sum: { $abs: { $ifNull: ['$totalUSDVolume', 0] } } },
          trades30d: { $sum: 1 },
          volumeUsd7d: { $sum: { $cond: [{ $gte: ['$time', since7d] }, { $abs: { $ifNull: ['$totalUSDVolume', 0] } }, 0] } },
          trades7d: { $sum: { $cond: [{ $gte: ['$time', since7d] }, 1, 0] } },
        }
      }
    ])

    for (const row of swapByPool) {
      const tokensPair = poolTokens.get(Number(row?._id))
      if (!tokensPair) continue

      for (const tokenId of [tokensPair.tokenA.id, tokensPair.tokenB.id]) {
        if (!tokenIds.has(tokenId)) continue
        const stat = ensureStat(stats, tokenId)
        stat.volumeUsd30d += safeNumber(row?.volumeUsd30d)
        stat.trades30d += safeNumber(row?.trades30d)
        stat.volumeUsd7d += safeNumber(row?.volumeUsd7d)
        stat.trades7d += safeNumber(row?.trades7d)
      }
    }

    for (const tokensPair of poolTokens.values()) {
      if (!tokensPair.firstSeenAt) continue
      for (const tokenId of [tokensPair.tokenA.id, tokensPair.tokenB.id]) {
        if (!tokenIds.has(tokenId)) continue
        const stat = ensureStat(stats, tokenId)
        stat.firstSeenAt = minDate(stat.firstSeenAt, tokensPair.firstSeenAt)
      }
    }

    const swapTraderWindows = await Promise.all([
      Swap.aggregate([
        { $match: { chain, time: { $gte: since30d } } },
        { $project: { pool: 1, traders: ['$sender', '$recipient'] } },
        { $unwind: '$traders' },
        { $group: { _id: { pool: '$pool', trader: '$traders' } } },
        { $group: { _id: '$_id.pool', traders: { $addToSet: '$_id.trader' } } }
      ]),
      Swap.aggregate([
        { $match: { chain, time: { $gte: since7d } } },
        { $project: { pool: 1, traders: ['$sender', '$recipient'] } },
        { $unwind: '$traders' },
        { $group: { _id: { pool: '$pool', trader: '$traders' } } },
        { $group: { _id: '$_id.pool', traders: { $addToSet: '$_id.trader' } } }
      ]),
      Swap.aggregate([
        { $match: { chain, time: { $gte: since24h } } },
        { $project: { pool: 1, traders: ['$sender', '$recipient'] } },
        { $unwind: '$traders' },
        { $group: { _id: { pool: '$pool', trader: '$traders' } } },
        { $group: { _id: '$_id.pool', traders: { $addToSet: '$_id.trader' } } }
      ]),
      Swap.aggregate([
        { $match: { chain, time: { $gte: sincePrev24h, $lt: since24h } } },
        { $project: { pool: 1, traders: ['$sender', '$recipient'] } },
        { $unwind: '$traders' },
        { $group: { _id: { pool: '$pool', trader: '$traders' } } },
        { $group: { _id: '$_id.pool', traders: { $addToSet: '$_id.trader' } } }
      ]),
      Swap.aggregate([
        { $match: { chain, time: { $gte: sincePrev7d, $lt: since7d } } },
        { $project: { pool: 1, traders: ['$sender', '$recipient'] } },
        { $unwind: '$traders' },
        { $group: { _id: { pool: '$pool', trader: '$traders' } } },
        { $group: { _id: '$_id.pool', traders: { $addToSet: '$_id.trader' } } }
      ]),
    ])

    const [
      swapTraders30dByPool,
      swapTraders7dByPool,
      swapTraders24hByPool,
      swapTradersPrev24hByPool,
      swapTradersPrev7dByPool,
    ] = swapTraderWindows

    const attachPoolTraders = (rows: any[], target: keyof Pick<TokenStat, 'uniqueTraders30d' | 'uniqueTraders7d' | 'uniqueTraders24h' | 'uniqueTradersPrev24h' | 'uniqueTradersPrev7d'>) => {
      for (const row of rows) {
        const tokensPair = poolTokens.get(Number(row?._id))
        if (!tokensPair) continue
        for (const tokenId of [tokensPair.tokenA.id, tokensPair.tokenB.id]) {
          if (!tokenIds.has(tokenId)) continue
          const stat = ensureStat(stats, tokenId)
          for (const trader of row?.traders || []) {
            stat[target].add(trader)
          }
        }
      }
    }

    attachPoolTraders(swapTraders30dByPool, 'uniqueTraders30d')
    attachPoolTraders(swapTraders7dByPool, 'uniqueTraders7d')
    attachPoolTraders(swapTraders24hByPool, 'uniqueTraders24h')
    attachPoolTraders(swapTradersPrev24hByPool, 'uniqueTradersPrev24h')
    attachPoolTraders(swapTradersPrev7dByPool, 'uniqueTradersPrev7d')

    const matchByMarket = await Match.aggregate([
      { $match: { chain, time: { $gte: since30d } } },
      {
        $group: {
          _id: '$market',
          baseVolume30d: { $sum: { $ifNull: ['$ask', 0] } },
          quoteVolume30d: { $sum: { $ifNull: ['$bid', 0] } },
          trades30d: { $sum: 1 },
          baseVolume7d: { $sum: { $cond: [{ $gte: ['$time', since7d] }, { $ifNull: ['$ask', 0] }, 0] } },
          quoteVolume7d: { $sum: { $cond: [{ $gte: ['$time', since7d] }, { $ifNull: ['$bid', 0] }, 0] } },
          trades7d: { $sum: { $cond: [{ $gte: ['$time', since7d] }, 1, 0] } },
        }
      }
    ])

    for (const row of matchByMarket) {
      const tokensPair = marketTokens.get(Number(row?._id))
      if (!tokensPair) continue

      const basePrice = priceMap.get(tokensPair.base) || 0
      const quotePrice = priceMap.get(tokensPair.quote) || 0
      const baseVolumeUsd30d = safeNumber(row?.baseVolume30d) * basePrice
      const quoteVolumeUsd30d = safeNumber(row?.quoteVolume30d) * quotePrice
      const baseVolumeUsd7d = safeNumber(row?.baseVolume7d) * basePrice
      const quoteVolumeUsd7d = safeNumber(row?.quoteVolume7d) * quotePrice

      if (tokenIds.has(tokensPair.base)) {
        const stat = ensureStat(stats, tokensPair.base)
        stat.volumeUsd30d += baseVolumeUsd30d
        stat.trades30d += safeNumber(row?.trades30d)
        stat.volumeUsd7d += baseVolumeUsd7d
        stat.trades7d += safeNumber(row?.trades7d)
      }

      if (tokenIds.has(tokensPair.quote)) {
        const stat = ensureStat(stats, tokensPair.quote)
        stat.volumeUsd30d += quoteVolumeUsd30d
        stat.trades30d += safeNumber(row?.trades30d)
        stat.volumeUsd7d += quoteVolumeUsd7d
        stat.trades7d += safeNumber(row?.trades7d)
      }
    }

    const matchFirstSeenByMarket = await Match.aggregate([
      { $match: { chain } },
      { $group: { _id: '$market', firstSeen: { $min: '$time' } } }
    ])

    for (const row of matchFirstSeenByMarket) {
      const tokensPair = marketTokens.get(Number(row?._id))
      if (!tokensPair) continue

      if (tokenIds.has(tokensPair.base)) {
        const stat = ensureStat(stats, tokensPair.base)
        stat.firstSeenAt = minDate(stat.firstSeenAt, row?.firstSeen || null)
      }

      if (tokenIds.has(tokensPair.quote)) {
        const stat = ensureStat(stats, tokensPair.quote)
        stat.firstSeenAt = minDate(stat.firstSeenAt, row?.firstSeen || null)
      }
    }

    const matchTraderWindows = await Promise.all([
      Match.aggregate([
        { $match: { chain, time: { $gte: since30d } } },
        { $project: { market: 1, traders: ['$asker', '$bidder'] } },
        { $unwind: '$traders' },
        { $group: { _id: { market: '$market', trader: '$traders' } } },
        { $group: { _id: '$_id.market', traders: { $addToSet: '$_id.trader' } } }
      ]),
      Match.aggregate([
        { $match: { chain, time: { $gte: since7d } } },
        { $project: { market: 1, traders: ['$asker', '$bidder'] } },
        { $unwind: '$traders' },
        { $group: { _id: { market: '$market', trader: '$traders' } } },
        { $group: { _id: '$_id.market', traders: { $addToSet: '$_id.trader' } } }
      ]),
      Match.aggregate([
        { $match: { chain, time: { $gte: since24h } } },
        { $project: { market: 1, traders: ['$asker', '$bidder'] } },
        { $unwind: '$traders' },
        { $group: { _id: { market: '$market', trader: '$traders' } } },
        { $group: { _id: '$_id.market', traders: { $addToSet: '$_id.trader' } } }
      ]),
      Match.aggregate([
        { $match: { chain, time: { $gte: sincePrev24h, $lt: since24h } } },
        { $project: { market: 1, traders: ['$asker', '$bidder'] } },
        { $unwind: '$traders' },
        { $group: { _id: { market: '$market', trader: '$traders' } } },
        { $group: { _id: '$_id.market', traders: { $addToSet: '$_id.trader' } } }
      ]),
      Match.aggregate([
        { $match: { chain, time: { $gte: sincePrev7d, $lt: since7d } } },
        { $project: { market: 1, traders: ['$asker', '$bidder'] } },
        { $unwind: '$traders' },
        { $group: { _id: { market: '$market', trader: '$traders' } } },
        { $group: { _id: '$_id.market', traders: { $addToSet: '$_id.trader' } } }
      ]),
    ])

    const [
      matchTraders30dByMarket,
      matchTraders7dByMarket,
      matchTraders24hByMarket,
      matchTradersPrev24hByMarket,
      matchTradersPrev7dByMarket,
    ] = matchTraderWindows

    const attachMarketTraders = (rows: any[], target: keyof Pick<TokenStat, 'uniqueTraders30d' | 'uniqueTraders7d' | 'uniqueTraders24h' | 'uniqueTradersPrev24h' | 'uniqueTradersPrev7d'>) => {
      for (const row of rows) {
        const tokensPair = marketTokens.get(Number(row?._id))
        if (!tokensPair) continue
        for (const tokenId of [tokensPair.base, tokensPair.quote]) {
          if (!tokenIds.has(tokenId)) continue
          const stat = ensureStat(stats, tokenId)
          for (const trader of row?.traders || []) {
            stat[target].add(trader)
          }
        }
      }
    }

    attachMarketTraders(matchTraders30dByMarket, 'uniqueTraders30d')
    attachMarketTraders(matchTraders7dByMarket, 'uniqueTraders7d')
    attachMarketTraders(matchTraders24hByMarket, 'uniqueTraders24h')
    attachMarketTraders(matchTradersPrev24hByMarket, 'uniqueTradersPrev24h')
    attachMarketTraders(matchTradersPrev7dByMarket, 'uniqueTradersPrev7d')

    const [priceChange7d, priceChange30d, priceChange90d, priceStabilityByToken] = await Promise.all([
      baseTokenId ? collectTokenPriceChangeMap(chain, poolTokens, baseTokenId, since7d) : Promise.resolve(new Map<string, number>()),
      baseTokenId ? collectTokenPriceChangeMap(chain, poolTokens, baseTokenId, since30d) : Promise.resolve(new Map<string, number>()),
      baseTokenId ? collectTokenPriceChangeMap(chain, poolTokens, baseTokenId, since90d) : Promise.resolve(new Map<string, number>()),
      collectPriceStabilityMap(chain, [...poolTokens.values()], tokens.map((t) => t.id), baseTokenId, usdTokenId, since30d),
    ])

    for (const token of tokens) {
      const stat = ensureStat(stats, token.id)
      const holderStats = holdersByToken.get(token.id)
      stat.holders = holderStats?.holders ?? null
    }

    const scores: Record<string, any> = {}

    for (const token of tokens) {
      const stat = ensureStat(stats, token.id)
      const uniqueTraders30d = stat.uniqueTraders30d.size
      const uniqueTraders7d = stat.uniqueTraders7d.size
      const uniqueTraders24h = stat.uniqueTraders24h.size
      const uniqueTradersPrev24h = stat.uniqueTradersPrev24h.size
      const uniqueTradersPrev7d = stat.uniqueTradersPrev7d.size
      const ageDays = stat.firstSeenAt ? Math.floor((nowTs - stat.firstSeenAt.getTime()) / DAY_MS) : null
      const cappedVolumeUsd30d = Math.min(stat.volumeUsd30d, MAX_SANE_VOLUME)
      const cappedVolumeUsd7d = Math.min(stat.volumeUsd7d, MAX_SANE_VOLUME)
      const uniqueTraderGrowth24h = uniqueTraders24h / Math.max(1, uniqueTradersPrev24h)
      const uniqueTraderGrowth7d = uniqueTraders7d / Math.max(1, uniqueTradersPrev7d)
      const priceChange7dPct = priceChange7d.get(token.id) ?? 0
      const priceChange30dPct = priceChange30d.get(token.id) ?? 0
      const priceChange90dPct = priceChange90d.get(token.id) ?? 0
      const tvlUsd = Math.max(
        safeNumber(tokenTvlMap.get(token.id), 0),
        safeNumber(poolLiquidityUsdByToken.get(token.id), 0)
      )
      const turnover = cappedVolumeUsd30d / Math.max(tvlUsd, 1)
      const avgDailyTrades = stat.trades30d / SCORE_WINDOW_DAYS
      const stability = priceStabilityByToken.get(token.id) || null
      const drawdown = stability?.drawdown ?? null

      const components = {
        traders: roundTo(linearScore(uniqueTraders30d, TRADERS_FULL_SCORE_AT) * COMPONENT_WEIGHTS.traders),
        volume: roundTo(computeTurnoverScore(turnover) * COMPONENT_WEIGHTS.volume),
        liquidity: roundTo(linearScore(tvlUsd, LIQUIDITY_FULL_SCORE_AT_USD) * COMPONENT_WEIGHTS.liquidity),
        holders: roundTo(stat.holders === null ? 0 : linearScore(stat.holders, 1000) * COMPONENT_WEIGHTS.holders),
        activity: roundTo(boundedLinearScore(avgDailyTrades, 10, 100) * COMPONENT_WEIGHTS.activity),
        stability: roundTo(drawdown === null ? 0 : boundedLinearScore(drawdown, 0.3, 1) * COMPONENT_WEIGHTS.stability),
        age: roundTo(ageDays === null ? 0 : boundedLinearScore(ageDays, 3, 30) * COMPONENT_WEIGHTS.age),
      }

      let availableWeight = (
        COMPONENT_WEIGHTS.traders
        + COMPONENT_WEIGHTS.volume
        + COMPONENT_WEIGHTS.liquidity
        + COMPONENT_WEIGHTS.activity
      )
      if (stat.holders !== null) availableWeight += COMPONENT_WEIGHTS.holders
      if (drawdown !== null) availableWeight += COMPONENT_WEIGHTS.stability
      if (ageDays !== null) availableWeight += COMPONENT_WEIGHTS.age

      const weightedSum = Object.values(components).reduce((sum, value) => sum + safeNumber(value), 0)
      let score = availableWeight > 0 ? (weightedSum / availableWeight) * 100 : 0
      const capsApplied: string[] = []

      if (stat.trades30d === 0) {
        score = 0
        capsApplied.push('trades_count_eq_0')
      } else {
        if (uniqueTraders30d < TRADERS_HARD_CAP_MIN) {
          score = Math.min(score, 30)
          capsApplied.push('unique_traders_lt_20')
        }
        if (tvlUsd < TVL_HARD_CAP_MIN_USD) {
          score = Math.min(score, 40)
          capsApplied.push('tvl_usd_lt_2500')
        }
      }

      score = clamp(Math.round(score), 0, 100)

      scores[token.id] = {
        score,
        version: 'v1',
        window: SCORE_WINDOW_LABEL,
        components,
        capsApplied,
        metrics: {
          uniqueTraders: uniqueTraders30d,
          volumeUsd: roundTo(cappedVolumeUsd30d, 2),
          tvlUsd: roundTo(tvlUsd, 2),
          turnover: roundTo(turnover, 4),
          holdersCount: stat.holders,
          tradesCount: stat.trades30d,
          avgDailyTrades: roundTo(avgDailyTrades, 4),
          currentPrice: stability ? roundTo(stability.currentPrice, 8) : null,
          rollingHigh30d: stability ? roundTo(stability.rollingHigh, 8) : null,
          drawdown30d: drawdown === null ? null : roundTo(drawdown, 6),
          stabilityPoolId: stability?.poolId ?? null,
          ageDays,
        },
        holders: stat.holders ?? 0,
        volumeUsd7d: roundTo(cappedVolumeUsd7d, 2),
        trades7d: stat.trades7d,
        uniqueTraders7d,
        uniqueTraders24h,
        uniqueTradersPrev24h,
        uniqueTradersPrev7d,
        uniqueTraderGrowth24h: roundTo(uniqueTraderGrowth24h, 4),
        uniqueTraderGrowth7d: roundTo(uniqueTraderGrowth7d, 4),
        priceChange7dPct: roundTo(priceChange7dPct, 4),
        priceChange30dPct: roundTo(priceChange30dPct, 4),
        priceChange90dPct: roundTo(priceChange90dPct, 4),
        ageDays,
        firstSeenAt: stat.firstSeenAt ? stat.firstSeenAt.toISOString() : null,
        updatedAt: new Date().toISOString(),
      }
    }

    await redis.set(`${chain}_token_scores`, JSON.stringify(scores))
    console.timeEnd(`[${chain}] token scores updated`)
  } catch (e) {
    console.error(`[${chain}] token scores update failed`, e)
  }
}
