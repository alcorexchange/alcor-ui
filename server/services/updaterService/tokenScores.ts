import pLimit from 'p-limit'

import { Swap, SwapPool, Match, Market } from '../../models'
import { getTokens } from '../../utils'
import { getRedis } from '../redis'
import { getChainRpc, fetchAllScopes } from '../../../utils/eosjs'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const HOLDERS_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const HOLDERS_CONCURRENCY = 3

// Tunables for MVP scoring (can be overridden by env)
const VOLUME_SMALL_USD = Number(process.env.TOKEN_SCORE_VOLUME_SMALL_USD || 100)
const VOLUME_NORMAL_USD = Number(process.env.TOKEN_SCORE_VOLUME_NORMAL_USD || 1000)
const VOLUME_BIG_USD = Number(process.env.TOKEN_SCORE_VOLUME_BIG_USD || 10000)
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
  firstSeenAt: Date | null
  holders: number
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
  const redis = getRedis()
  try {
    const tokens = await getTokens(chain)

    if (!Array.isArray(tokens)) {
      console.warn(`[${chain}] token list missing, skip token scores`)
      return
    }

    console.time(`[${chain}] token scores updated`)

    const tokenIds = new Set(tokens.map(t => t.id))
    const tokenPriceMap = new Map(tokens.map(t => [t.id, t.usd_price || 0]))

    const stats = new Map<string, TokenStat>()

    const since = new Date(Date.now() - WEEK_MS)

    // Pools map
    const pools = await SwapPool.find({ chain }).select('id tokenA tokenB').lean()
    const poolTokens = new Map<number, { tokenA: string, tokenB: string }>(
      pools.map(p => [p.id, { tokenA: p.tokenA.id, tokenB: p.tokenB.id }])
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

    // First seen date per pool (all time)
    const swapFirstSeenByPool = await Swap.aggregate([
      { $match: { chain } },
      { $group: { _id: '$pool', firstSeen: { $min: '$time' } } }
    ])

    for (const p of swapFirstSeenByPool) {
      const tokensPair = poolTokens.get(p._id)
      if (!tokensPair) continue

      for (const tokenId of [tokensPair.tokenA, tokensPair.tokenB]) {
        if (!tokenIds.has(tokenId)) continue
        const stat = ensureStat(stats, tokenId)
        stat.firstSeenAt = minDate(stat.firstSeenAt, p.firstSeen || null)
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
    const holdersPoints = [
      { x: 0, y: 0 },
      { x: 10, y: 12 },
      { x: 100, y: 30 },
    ]

    const tradersPoints = [
      { x: 0, y: 0 },
      { x: 5, y: 10 },
      { x: 20, y: 30 },
    ]

    const volumePoints = [
      { x: 0, y: 0 },
      { x: VOLUME_SMALL_USD, y: 8 },
      { x: VOLUME_NORMAL_USD, y: 20 },
      { x: VOLUME_BIG_USD, y: 30 },
    ].sort((a, b) => a.x - b.x)

    const agePoints = [
      { x: 3, y: 0 },
      { x: 7, y: 5 },
      { x: 30, y: 10 },
    ]

    const now = Date.now()
    const scores = {}

    for (const t of tokens) {
      const stat = ensureStat(stats, t.id)
      const uniqueTraders7d = stat.uniqueTraders.size
      const ageDays = stat.firstSeenAt ? Math.floor((now - stat.firstSeenAt.getTime()) / (24 * 60 * 60 * 1000)) : 0

      const holdersScore = clamp(scoreByPoints(stat.holders, holdersPoints), 0, 30)
      const tradersScore = clamp(scoreByPoints(uniqueTraders7d, tradersPoints), 0, 30)
      const volumeScore = clamp(scoreByPoints(stat.volumeUsd7d, volumePoints), 0, 30)
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
        volumeUsd7d: Number(stat.volumeUsd7d.toFixed(2)),
        trades7d: stat.trades7d,
        uniqueTraders7d,
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
