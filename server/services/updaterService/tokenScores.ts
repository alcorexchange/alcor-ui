import pLimit from 'p-limit'
import config from '../../../config'

import { Swap, SwapPool, Match, Market } from '../../models'
import { getTokens } from '../../utils'
import { getRedis } from '../redis'
import { getChainRpc, fetchAllScopes } from '../../../utils/eosjs'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const MONTH_MS = 30 * DAY_MS
const QUARTER_MS = 90 * DAY_MS
const HOLDERS_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const HOLDERS_CONCURRENCY = 3

// Tunables for MVP scoring (can be overridden by env)
const VOLUME_SMALL_USD = Number(process.env.TOKEN_SCORE_VOLUME_SMALL_USD || 1000)
const VOLUME_NORMAL_USD = Number(process.env.TOKEN_SCORE_VOLUME_NORMAL_USD || 10000)
const VOLUME_BIG_USD = Number(process.env.TOKEN_SCORE_VOLUME_BIG_USD || 100000)
const AGE_DAYS_MIN = Number(process.env.TOKEN_SCORE_AGE_MIN_DAYS || 3)
const HOLDERS_MIN = Number(process.env.TOKEN_SCORE_HOLDERS_MIN || 5)
const UNIQUE_TRADERS_MIN = Number(process.env.TOKEN_SCORE_UNIQUE_TRADERS_MIN || 3)
const AGE_SCORE_CAP = Number(process.env.TOKEN_SCORE_CAP_AGE_LT || 40)
const HOLDERS_SCORE_CAP = Number(process.env.TOKEN_SCORE_CAP_HOLDERS_LT || 30)
const TRADERS_SCORE_CAP = Number(process.env.TOKEN_SCORE_CAP_TRADERS_LT || 35)

type TokenStat = {
  volumeUsd7d: number
  trades7d: number
  uniqueTraders: Set<string>
  uniqueTraders24h: Set<string>
  uniqueTradersPrev24h: Set<string>
  uniqueTradersPrev7d: Set<string>
  firstSeenAt: Date | null
  holders: number
}

type PoolTokenPair = {
  tokenA: string
  tokenB: string
  firstSeenAt: Date | null
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function scoreByPoints(value: number, points: { x: number, y: number }[]) {
  if (points.length === 0) return 0
  if (value <= points[0].x) return points[0].y

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]
    const curr = points[i]
    if (value <= curr.x) {
      const t = (value - prev.x) / (curr.x - prev.x)
      return lerp(prev.y, curr.y, t)
    }
  }

  return points[points.length - 1].y
}

function ensureStat(map: Map<string, TokenStat>, tokenId: string) {
  if (!map.has(tokenId)) {
    map.set(tokenId, {
      volumeUsd7d: 0,
      trades7d: 0,
      uniqueTraders: new Set(),
      uniqueTraders24h: new Set(),
      uniqueTradersPrev24h: new Set(),
      uniqueTradersPrev7d: new Set(),
      firstSeenAt: null,
      holders: 0,
    })
  }
  return map.get(tokenId)
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

  if (pair.tokenA === baseTokenId) return amountA / amountB
  if (pair.tokenB === baseTokenId) return amountB / amountA
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
    if (!isBasePair(baseTokenId, pair.tokenA, pair.tokenB)) continue

    const tokenId = pair.tokenA === baseTokenId ? pair.tokenB : pair.tokenA
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

async function getTokenHoldersCount(chain: string, token: { contract: string, symbol: string, id: string }, rpc, redis, inMemory: Map<string, number>) {
  const cacheKey = `${chain}_token_holders_${token.id}`
  const cachedRaw = await redis.get(cacheKey)

  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw)
      if (cached && typeof cached.holders === 'number' && (Date.now() - cached.updatedAt) < HOLDERS_CACHE_TTL_MS) {
        return cached.holders
      }
    } catch (e) {
      // ignore bad cache
    }
  }

  if (inMemory.has(token.contract)) {
    return inMemory.get(token.contract)
  }

  let holders = 0
  try {
    const scopes = await fetchAllScopes(rpc, token.contract, 'accounts')
    holders = scopes.length
  } catch (e) {
    console.error(`[${chain}] holders fetch failed for ${token.id}`, e)
    holders = 0
  }

  inMemory.set(token.contract, holders)
  await redis.set(cacheKey, JSON.stringify({ holders, updatedAt: Date.now() }))

  return holders
}

export async function updateTokenScores(network: Network) {
  const chain = network.name
  const baseTokenId = String((config as any)?.networks?.[chain]?.baseToken?.id || '').toLowerCase()
  const redis = getRedis()
  try {
    const tokens = await getTokens(chain)

    if (!Array.isArray(tokens)) {
      console.warn(`[${chain}] token list missing, skip token scores`)
      return
    }

    console.time(`[${chain}] token scores updated`)

    const MAX_SANE_PRICE = 100000 // Ignore tokens with unrealistic prices
    const tokenIds = new Set(tokens.map(t => t.id))
    const tokenPriceMap = new Map(tokens.map(t => [t.id, (t.usd_price && t.usd_price < MAX_SANE_PRICE) ? t.usd_price : 0]))

    const stats = new Map<string, TokenStat>()

    const nowTs = Date.now()
    const since = new Date(nowTs - WEEK_MS)
    const since24h = new Date(nowTs - DAY_MS)
    const since30d = new Date(nowTs - MONTH_MS)
    const since90d = new Date(nowTs - QUARTER_MS)
    const sincePrev24h = new Date(nowTs - (2 * DAY_MS))
    const sincePrev7d = new Date(nowTs - (2 * WEEK_MS))

    // Pools map
    const pools = await SwapPool.find({ chain }).select('id tokenA tokenB firstSeenAt').lean()
    const poolTokens = new Map<number, PoolTokenPair>(
      pools.map(p => [p.id, { tokenA: p.tokenA.id, tokenB: p.tokenB.id, firstSeenAt: p.firstSeenAt || null }])
    )

    // Markets map
    const markets = await Market.find({ chain }).select('id base_token quote_token').lean()
    const marketTokens = new Map<number, { base: string, quote: string }>(
      markets.map(m => [m.id, { base: m.base_token.id, quote: m.quote_token.id }])
    )

    // Swap volume/trades per pool (last 7 days)
    const swapByPool = await Swap.aggregate([
      { $match: { chain, time: { $gte: since } } },
      {
        $group: {
          _id: '$pool',
          volumeUsd: { $sum: { $abs: { $ifNull: ['$totalUSDVolume', 0] } } },
          trades: { $sum: 1 },
        }
      }
    ])

    for (const p of swapByPool) {
      const tokensPair = poolTokens.get(p._id)
      if (!tokensPair) continue

      for (const tokenId of [tokensPair.tokenA, tokensPair.tokenB]) {
        if (!tokenIds.has(tokenId)) continue
        const stat = ensureStat(stats, tokenId)
        stat.volumeUsd7d += Number(p.volumeUsd || 0)
        stat.trades7d += Number(p.trades || 0)
      }
    }

    // First seen date per pool (cached on SwapPool)
    for (const tokensPair of poolTokens.values()) {
      if (!tokensPair.firstSeenAt) continue

      for (const tokenId of [tokensPair.tokenA, tokensPair.tokenB]) {
        if (!tokenIds.has(tokenId)) continue
        const stat = ensureStat(stats, tokenId)
        stat.firstSeenAt = minDate(stat.firstSeenAt, tokensPair.firstSeenAt)
      }
    }

    // Swap unique traders per pool
    const swapTradersByPool = await Swap.aggregate([
      { $match: { chain, time: { $gte: since } } },
      { $project: { pool: 1, traders: ['$sender', '$recipient'] } },
      { $unwind: '$traders' },
      { $group: { _id: { pool: '$pool', trader: '$traders' } } },
      { $group: { _id: '$_id.pool', traders: { $addToSet: '$_id.trader' } } }
    ])

    for (const p of swapTradersByPool) {
      const tokensPair = poolTokens.get(p._id)
      if (!tokensPair) continue

      for (const tokenId of [tokensPair.tokenA, tokensPair.tokenB]) {
        if (!tokenIds.has(tokenId)) continue
        const stat = ensureStat(stats, tokenId)
        for (const trader of p.traders || []) {
          stat.uniqueTraders.add(trader)
        }
      }
    }

    // Swap unique traders per pool (last 24h)
    const swapTraders24hByPool = await Swap.aggregate([
      { $match: { chain, time: { $gte: since24h } } },
      { $project: { pool: 1, traders: ['$sender', '$recipient'] } },
      { $unwind: '$traders' },
      { $group: { _id: { pool: '$pool', trader: '$traders' } } },
      { $group: { _id: '$_id.pool', traders: { $addToSet: '$_id.trader' } } }
    ])

    for (const p of swapTraders24hByPool) {
      const tokensPair = poolTokens.get(p._id)
      if (!tokensPair) continue

      for (const tokenId of [tokensPair.tokenA, tokensPair.tokenB]) {
        if (!tokenIds.has(tokenId)) continue
        const stat = ensureStat(stats, tokenId)
        for (const trader of p.traders || []) {
          stat.uniqueTraders24h.add(trader)
        }
      }
    }

    // Swap unique traders per pool (previous 24h window)
    const swapTradersPrev24hByPool = await Swap.aggregate([
      { $match: { chain, time: { $gte: sincePrev24h, $lt: since24h } } },
      { $project: { pool: 1, traders: ['$sender', '$recipient'] } },
      { $unwind: '$traders' },
      { $group: { _id: { pool: '$pool', trader: '$traders' } } },
      { $group: { _id: '$_id.pool', traders: { $addToSet: '$_id.trader' } } }
    ])

    for (const p of swapTradersPrev24hByPool) {
      const tokensPair = poolTokens.get(p._id)
      if (!tokensPair) continue

      for (const tokenId of [tokensPair.tokenA, tokensPair.tokenB]) {
        if (!tokenIds.has(tokenId)) continue
        const stat = ensureStat(stats, tokenId)
        for (const trader of p.traders || []) {
          stat.uniqueTradersPrev24h.add(trader)
        }
      }
    }

    // Swap unique traders per pool (previous 7d window: day 8-14)
    const swapTradersPrev7dByPool = await Swap.aggregate([
      { $match: { chain, time: { $gte: sincePrev7d, $lt: since } } },
      { $project: { pool: 1, traders: ['$sender', '$recipient'] } },
      { $unwind: '$traders' },
      { $group: { _id: { pool: '$pool', trader: '$traders' } } },
      { $group: { _id: '$_id.pool', traders: { $addToSet: '$_id.trader' } } }
    ])

    for (const p of swapTradersPrev7dByPool) {
      const tokensPair = poolTokens.get(p._id)
      if (!tokensPair) continue

      for (const tokenId of [tokensPair.tokenA, tokensPair.tokenB]) {
        if (!tokenIds.has(tokenId)) continue
        const stat = ensureStat(stats, tokenId)
        for (const trader of p.traders || []) {
          stat.uniqueTradersPrev7d.add(trader)
        }
      }
    }

    // Spot volume/trades per market (last 7 days)
    const matchByMarket = await Match.aggregate([
      { $match: { chain, time: { $gte: since } } },
      {
        $group: {
          _id: '$market',
          baseVolume: { $sum: { $ifNull: ['$ask', 0] } },
          quoteVolume: { $sum: { $ifNull: ['$bid', 0] } },
          trades: { $sum: 1 },
        }
      }
    ])

    for (const m of matchByMarket) {
      const tokensPair = marketTokens.get(m._id)
      if (!tokensPair) continue

      const basePrice = tokenPriceMap.get(tokensPair.base) || 0
      const quotePrice = tokenPriceMap.get(tokensPair.quote) || 0

      const baseVolumeUsd = Number(m.baseVolume || 0) * basePrice
      const quoteVolumeUsd = Number(m.quoteVolume || 0) * quotePrice

      if (tokenIds.has(tokensPair.base)) {
        const stat = ensureStat(stats, tokensPair.base)
        stat.volumeUsd7d += baseVolumeUsd
        stat.trades7d += Number(m.trades || 0)
      }

      if (tokenIds.has(tokensPair.quote)) {
        const stat = ensureStat(stats, tokensPair.quote)
        stat.volumeUsd7d += quoteVolumeUsd
        stat.trades7d += Number(m.trades || 0)
      }
    }

    // First seen date per market (all time)
    const matchFirstSeenByMarket = await Match.aggregate([
      { $match: { chain } },
      { $group: { _id: '$market', firstSeen: { $min: '$time' } } }
    ])

    for (const m of matchFirstSeenByMarket) {
      const tokensPair = marketTokens.get(m._id)
      if (!tokensPair) continue

      if (tokenIds.has(tokensPair.base)) {
        const stat = ensureStat(stats, tokensPair.base)
        stat.firstSeenAt = minDate(stat.firstSeenAt, m.firstSeen || null)
      }

      if (tokenIds.has(tokensPair.quote)) {
        const stat = ensureStat(stats, tokensPair.quote)
        stat.firstSeenAt = minDate(stat.firstSeenAt, m.firstSeen || null)
      }
    }

    // Spot unique traders per market
    const matchTradersByMarket = await Match.aggregate([
      { $match: { chain, time: { $gte: since } } },
      { $project: { market: 1, traders: ['$asker', '$bidder'] } },
      { $unwind: '$traders' },
      { $group: { _id: { market: '$market', trader: '$traders' } } },
      { $group: { _id: '$_id.market', traders: { $addToSet: '$_id.trader' } } }
    ])

    for (const m of matchTradersByMarket) {
      const tokensPair = marketTokens.get(m._id)
      if (!tokensPair) continue

      for (const tokenId of [tokensPair.base, tokensPair.quote]) {
        if (!tokenIds.has(tokenId)) continue
        const stat = ensureStat(stats, tokenId)
        for (const trader of m.traders || []) {
          stat.uniqueTraders.add(trader)
        }
      }
    }

    // Spot unique traders per market (last 24h)
    const matchTraders24hByMarket = await Match.aggregate([
      { $match: { chain, time: { $gte: since24h } } },
      { $project: { market: 1, traders: ['$asker', '$bidder'] } },
      { $unwind: '$traders' },
      { $group: { _id: { market: '$market', trader: '$traders' } } },
      { $group: { _id: '$_id.market', traders: { $addToSet: '$_id.trader' } } }
    ])

    for (const m of matchTraders24hByMarket) {
      const tokensPair = marketTokens.get(m._id)
      if (!tokensPair) continue

      for (const tokenId of [tokensPair.base, tokensPair.quote]) {
        if (!tokenIds.has(tokenId)) continue
        const stat = ensureStat(stats, tokenId)
        for (const trader of m.traders || []) {
          stat.uniqueTraders24h.add(trader)
        }
      }
    }

    // Spot unique traders per market (previous 24h window)
    const matchTradersPrev24hByMarket = await Match.aggregate([
      { $match: { chain, time: { $gte: sincePrev24h, $lt: since24h } } },
      { $project: { market: 1, traders: ['$asker', '$bidder'] } },
      { $unwind: '$traders' },
      { $group: { _id: { market: '$market', trader: '$traders' } } },
      { $group: { _id: '$_id.market', traders: { $addToSet: '$_id.trader' } } }
    ])

    for (const m of matchTradersPrev24hByMarket) {
      const tokensPair = marketTokens.get(m._id)
      if (!tokensPair) continue

      for (const tokenId of [tokensPair.base, tokensPair.quote]) {
        if (!tokenIds.has(tokenId)) continue
        const stat = ensureStat(stats, tokenId)
        for (const trader of m.traders || []) {
          stat.uniqueTradersPrev24h.add(trader)
        }
      }
    }

    // Spot unique traders per market (previous 7d window)
    const matchTradersPrev7dByMarket = await Match.aggregate([
      { $match: { chain, time: { $gte: sincePrev7d, $lt: since } } },
      { $project: { market: 1, traders: ['$asker', '$bidder'] } },
      { $unwind: '$traders' },
      { $group: { _id: { market: '$market', trader: '$traders' } } },
      { $group: { _id: '$_id.market', traders: { $addToSet: '$_id.trader' } } }
    ])

    for (const m of matchTradersPrev7dByMarket) {
      const tokensPair = marketTokens.get(m._id)
      if (!tokensPair) continue

      for (const tokenId of [tokensPair.base, tokensPair.quote]) {
        if (!tokenIds.has(tokenId)) continue
        const stat = ensureStat(stats, tokenId)
        for (const trader of m.traders || []) {
          stat.uniqueTradersPrev7d.add(trader)
        }
      }
    }

    const [priceChange7d, priceChange30d, priceChange90d] = await Promise.all([
      baseTokenId ? collectTokenPriceChangeMap(chain, poolTokens, baseTokenId, since) : Promise.resolve(new Map<string, number>()),
      baseTokenId ? collectTokenPriceChangeMap(chain, poolTokens, baseTokenId, since30d) : Promise.resolve(new Map<string, number>()),
      baseTokenId ? collectTokenPriceChangeMap(chain, poolTokens, baseTokenId, since90d) : Promise.resolve(new Map<string, number>()),
    ])

    // Holders (contract accounts scopes count)
    // TODO: Add token distribution metrics (top 10 concentration, gini coefficient)
    const rpc = getChainRpc(chain)
    const holdersCache = new Map<string, number>()
    const limit = pLimit(HOLDERS_CONCURRENCY)

    await Promise.all(tokens.map((t) => limit(async () => {
      const stat = ensureStat(stats, t.id)
      stat.holders = await getTokenHoldersCount(chain, t, rpc, redis, holdersCache)
    })))

    // Score computation
    // Weights: holders 35%, traders 35%, volume 20%, age 10%
    const holdersPoints = [
      { x: 0, y: 0 },
      { x: 100, y: 12 },
      { x: 1000, y: 24 },
      { x: 10000, y: 35 },
    ]

    const tradersPoints = [
      { x: 0, y: 0 },
      { x: 10, y: 12 },
      { x: 100, y: 24 },
      { x: 1000, y: 35 },
    ]

    const volumePoints = [
      { x: 0, y: 0 },
      { x: VOLUME_SMALL_USD, y: 5 },
      { x: VOLUME_NORMAL_USD, y: 12 },
      { x: VOLUME_BIG_USD, y: 20 },
    ].sort((a, b) => a.x - b.x)

    const agePoints = [
      { x: 3, y: 0 },
      { x: 7, y: 5 },
      { x: 30, y: 10 },
    ]

    const scores = {}

    const MAX_SANE_VOLUME = 1_000_000_000 // $1B max to filter bad price data

    for (const t of tokens) {
      const stat = ensureStat(stats, t.id)
      const uniqueTraders7d = stat.uniqueTraders.size
      const uniqueTraders24h = stat.uniqueTraders24h.size
      const uniqueTradersPrev24h = stat.uniqueTradersPrev24h.size
      const uniqueTradersPrev7d = stat.uniqueTradersPrev7d.size
      const ageDays = stat.firstSeenAt ? Math.floor((nowTs - stat.firstSeenAt.getTime()) / DAY_MS) : 0
      const cappedVolumeUsd7d = Math.min(stat.volumeUsd7d, MAX_SANE_VOLUME)
      const priceChange7dPct = priceChange7d.get(t.id) ?? 0
      const priceChange30dPct = priceChange30d.get(t.id) ?? 0
      const priceChange90dPct = priceChange90d.get(t.id) ?? 0
      const uniqueTraderGrowth24h = uniqueTraders24h / Math.max(1, uniqueTradersPrev24h)
      const uniqueTraderGrowth7d = uniqueTraders7d / Math.max(1, uniqueTradersPrev7d)

      const holdersScore = clamp(scoreByPoints(stat.holders, holdersPoints), 0, 35)
      const tradersScore = clamp(scoreByPoints(uniqueTraders7d, tradersPoints), 0, 35)
      const volumeScore = clamp(scoreByPoints(cappedVolumeUsd7d, volumePoints), 0, 20)
      const ageBonus = clamp(scoreByPoints(ageDays, agePoints), 0, 10)

      let score = holdersScore + tradersScore + volumeScore + ageBonus

      // Hard rules
      if (ageDays < AGE_DAYS_MIN) score = Math.min(score, AGE_SCORE_CAP)
      if (stat.holders < HOLDERS_MIN) score = Math.min(score, HOLDERS_SCORE_CAP)
      if (uniqueTraders7d < UNIQUE_TRADERS_MIN) score = Math.min(score, TRADERS_SCORE_CAP)

      score = clamp(Math.round(score), 0, 100)

      scores[t.id] = {
        score,
        holders: stat.holders,
        volumeUsd7d: Number(cappedVolumeUsd7d.toFixed(2)),
        trades7d: stat.trades7d,
        uniqueTraders7d,
        uniqueTraders24h,
        uniqueTradersPrev24h,
        uniqueTradersPrev7d,
        uniqueTraderGrowth24h: Number(uniqueTraderGrowth24h.toFixed(4)),
        uniqueTraderGrowth7d: Number(uniqueTraderGrowth7d.toFixed(4)),
        priceChange7dPct: Number(priceChange7dPct.toFixed(4)),
        priceChange30dPct: Number(priceChange30dPct.toFixed(4)),
        priceChange90dPct: Number(priceChange90dPct.toFixed(4)),
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
