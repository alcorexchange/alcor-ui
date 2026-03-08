import { Router } from 'express'
import config from '../../../config'

import { getRedis } from '../redis'
import { getScamLists } from '../apiV2Service/config'
import {
  listGraduatedKey,
  listNewKey,
  listOrganicKey,
  listTrendingKey,
  tokenSummaryKey,
  tokenTradesKey,
  tokensSetKey,
} from '../launchpadMarketDataService/keys'

export const launchpad = Router()

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200
const TRADES_MAX_LIMIT = 500
const MAX_SEARCH_SCAN = 5000
const TOKENS_DEFAULT_LIMIT = 100
const TOKENS_TRENDING_TOP = Number(process.env.LAUNCHPAD_TOKENS_TRENDING_TOP || 500)
const TOKENS_NEW_WINDOW_MS = Number(process.env.LAUNCHPAD_TOKENS_NEW_WINDOW_MS || (7 * 24 * 60 * 60 * 1000))

type ScamFilters = {
  scamContracts: Set<string>
  scamTokens: Set<string>
}

type TokensList = 'trending' | 'organic' | 'new' | 'graduated' | 'all'
type TokensSort = 'score' | 'age' | 'vol24h' | 'liq' | 'mcap'
type TokensDir = 'asc' | 'desc'
type TokensCursor = {
  l: TokensList
  s: TokensSort
  d: TokensDir
  v: number
  id: string
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function parseLimit(raw: any, fallback = DEFAULT_LIMIT, max = MAX_LIMIT) {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.min(Math.floor(n), max)
}

function safeNumber(value: any, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function parseTsOrZero(value: any) {
  if (value === undefined || value === null || value === '') return 0
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : 0
}

function parseCursor(raw: any) {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.floor(n)
}

function parseTokensList(raw: any): TokensList {
  const normalized = String(raw || 'trending').trim().toLowerCase()
  if (normalized === 'all') return 'all'
  if (normalized === 'organic') return 'organic'
  if (normalized === 'new') return 'new'
  if (normalized === 'graduated') return 'graduated'
  return 'trending'
}

function parseTokensSort(raw: any): TokensSort {
  const normalized = String(raw || 'score').trim().toLowerCase()
  if (normalized === 'age') return 'age'
  if (normalized === 'vol24h') return 'vol24h'
  if (normalized === 'liq') return 'liq'
  if (normalized === 'market_cap' || normalized === 'marketcap' || normalized === 'fdv') return 'mcap'
  if (normalized === 'mcap') return 'mcap'
  return 'score'
}

function parseTokensDir(raw: any): TokensDir {
  const normalized = String(raw || 'desc').trim().toLowerCase()
  return normalized === 'asc' ? 'asc' : 'desc'
}

function encodeTokensCursor(cursor: TokensCursor) {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url')
}

function decodeTokensCursor(
  raw: any,
  list: TokensList,
  sort: TokensSort,
  dir: TokensDir
): TokensCursor | null {
  if (!raw) return null
  try {
    const value = Buffer.from(String(raw), 'base64url').toString('utf8')
    const parsed = JSON.parse(value || '{}')
    const cursor: TokensCursor = {
      l: parseTokensList(parsed?.l),
      s: parseTokensSort(parsed?.s),
      d: parseTokensDir(parsed?.d),
      v: safeNumber(parsed?.v),
      id: String(parsed?.id || '').toLowerCase(),
    }

    if (!cursor.id) return null
    if (cursor.l !== list || cursor.s !== sort || cursor.d !== dir) return null
    return cursor
  } catch {
    return null
  }
}

function normalizeSearch(raw: any) {
  return String(raw || '').trim().toLowerCase()
}

function parseHideScam(raw: any) {
  if (raw === undefined || raw === null || raw === '') return true
  const normalized = String(raw).trim().toLowerCase()
  if (!normalized) return true
  return !['false', '0', 'no'].includes(normalized)
}

function normalizeScamFilters(lists: { scam_contracts: Set<string>, scam_tokens: Set<string> }): ScamFilters {
  return {
    scamContracts: new Set([...lists.scam_contracts].map((c) => String(c || '').toLowerCase()).filter(Boolean)),
    scamTokens: new Set([...lists.scam_tokens].map((t) => String(t || '').toLowerCase()).filter(Boolean)),
  }
}

function isScamSummary(summary: any, scam: ScamFilters) {
  const tokenId = String(summary?.token_id || '').toLowerCase()
  const contract = String(summary?.contract || '').toLowerCase()
  if (!tokenId && !contract) return false
  return scam.scamTokens.has(tokenId) || scam.scamContracts.has(contract)
}

function matchesSearch(summary: any, term: string) {
  if (!term) return true
  const fields = [
    summary?.token_id,
    summary?.symbol,
    summary?.name,
    summary?.contract,
  ]
  return fields.some((value) => String(value || '').toLowerCase().includes(term))
}

async function readRankedList(
  chain: string,
  key: string,
  limit: number,
  cursor: number,
  search = '',
  scamFilters: ScamFilters | null = null,
  options: { minScore?: number } = {}
) {
  const redis: any = getRedis()
  const baseTokenId = String((config as any)?.networks?.[chain]?.baseToken?.id || '').toLowerCase()
  const hasSearch = Boolean(search)
  const minScore = Number.isFinite(Number(options.minScore)) ? Number(options.minScore) : null
  const start = hasSearch ? 0 : cursor
  const pageSize = hasSearch ? MAX_SEARCH_SCAN : Math.max(0, limit)
  const end = hasSearch ? Math.max(0, MAX_SEARCH_SCAN - 1) : (cursor + Math.max(0, limit - 1))
  const raw: string[] = minScore === null
    ? await redis.sendCommand([
      'ZREVRANGE',
      key,
      String(start),
      String(end),
      'WITHSCORES',
    ])
    : await redis.sendCommand([
      'ZREVRANGEBYSCORE',
      key,
      '+inf',
      String(minScore),
      'WITHSCORES',
      'LIMIT',
      String(start),
      String(pageSize),
    ])

  const tokenIds: string[] = []
  const scoreByToken = new Map<string, number>()

  for (let i = 0; i < raw.length; i += 2) {
    const tokenId = String(raw[i] || '').toLowerCase()
    const score = Number(raw[i + 1])
    if (!tokenId) continue

    tokenIds.push(tokenId)
    scoreByToken.set(tokenId, Number.isFinite(score) ? score : 0)
  }

  const summaryKeys = tokenIds.map((tokenId) => tokenSummaryKey(chain, tokenId))
  const summaryRaw = summaryKeys.length ? await redis.mGet(summaryKeys) : []

  const matchedItems = tokenIds
    .map((tokenId, index) => {
      const summary = safeJsonParse<any>(summaryRaw[index], null)
      if (!summary) return null
      if (baseTokenId && String(summary?.quote_token_id || '').toLowerCase() !== baseTokenId) return null
      if (scamFilters && isScamSummary(summary, scamFilters)) return null
      if (!matchesSearch(summary, search)) return null

      return {
        token_id: tokenId,
        rank: start + index + 1,
        score: scoreByToken.get(tokenId) || 0,
        ...summary,
      }
    })
    .filter(Boolean)

  const items = hasSearch
    ? matchedItems.slice(cursor, cursor + limit)
    : matchedItems

  const totalMatched = hasSearch
    ? matchedItems.length
    : (minScore === null
        ? Number(await redis.zCard(key))
        : Number(await redis.sendCommand(['ZCOUNT', key, String(minScore), '+inf'])))
  const nextCursor = (cursor + items.length) < totalMatched ? (cursor + items.length) : null
  return { items, nextCursor, totalMatched }
}

launchpad.get('/tokens', async (req, res) => {
  try {
    const network = req.app.get('network')
    const chain = network?.name
    const redis: any = getRedis()
    const baseTokenId = String(network?.baseToken?.id || '').toLowerCase()

    const list = parseTokensList(req.query.list)
    const sort = (req.query.sort === undefined || req.query.sort === null || req.query.sort === '')
      ? (list === 'all' ? 'liq' : 'score')
      : parseTokensSort(req.query.sort)
    const dir = parseTokensDir(req.query.dir)
    const limit = parseLimit(req.query.limit, TOKENS_DEFAULT_LIMIT)
    const search = normalizeSearch(req.query.search || req.query.q)
    const hideScam = parseHideScam(req.query.hide_scam)
    const scamFilters = hideScam ? normalizeScamFilters(await getScamLists(network)) : null
    const cursor = decodeTokensCursor(req.query.cursor, list, sort, dir)

    let tokenIds: string[] = []
    const scoreByToken = new Map<string, number>()

    if (list === 'trending') {
      const raw: string[] = await redis.sendCommand([
        'ZREVRANGE',
        listTrendingKey(chain),
        '0',
        String(Math.max(0, TOKENS_TRENDING_TOP - 1)),
        'WITHSCORES',
      ])

      for (let i = 0; i < raw.length; i += 2) {
        const tokenId = String(raw[i] || '').toLowerCase()
        const score = safeNumber(raw[i + 1], 0)
        if (!tokenId) continue
        tokenIds.push(tokenId)
        scoreByToken.set(tokenId, score)
      }
    } else if (list === 'organic') {
      const raw: string[] = await redis.sendCommand([
        'ZREVRANGE',
        listOrganicKey(chain),
        '0',
        String(Math.max(0, TOKENS_TRENDING_TOP - 1)),
        'WITHSCORES',
      ])

      for (let i = 0; i < raw.length; i += 2) {
        const tokenId = String(raw[i] || '').toLowerCase()
        const score = safeNumber(raw[i + 1], 0)
        if (!tokenId) continue
        tokenIds.push(tokenId)
        scoreByToken.set(tokenId, score)
      }
    } else if (list === 'new') {
      const minCreatedAt = Date.now() - TOKENS_NEW_WINDOW_MS
      const raw: string[] = await redis.sendCommand([
        'ZREVRANGEBYSCORE',
        listNewKey(chain),
        '+inf',
        String(minCreatedAt),
        'WITHSCORES',
        'LIMIT',
        '0',
        String(MAX_SEARCH_SCAN),
      ])

      for (let i = 0; i < raw.length; i += 2) {
        const tokenId = String(raw[i] || '').toLowerCase()
        if (!tokenId) continue
        tokenIds.push(tokenId)
      }
    } else if (list === 'graduated') {
      const raw: string[] = await redis.sendCommand([
        'ZREVRANGE',
        listGraduatedKey(chain),
        '0',
        '-1',
        'WITHSCORES',
      ])

      for (let i = 0; i < raw.length; i += 2) {
        const tokenId = String(raw[i] || '').toLowerCase()
        if (!tokenId) continue
        tokenIds.push(tokenId)
      }
    } else {
      const rawIds: string[] = await redis.sMembers(tokensSetKey(chain))
      tokenIds = rawIds
        .map((tokenId) => String(tokenId || '').toLowerCase())
        .filter(Boolean)
    }

    const seen = new Set<string>()
    tokenIds = tokenIds.filter((tokenId) => {
      if (!tokenId) return false
      if (seen.has(tokenId)) return false
      seen.add(tokenId)
      return true
    })

    if (tokenIds.length > 0) {
      const toLoadScores = tokenIds.filter((tokenId) => !scoreByToken.has(tokenId))
      if (toLoadScores.length > 0) {
        const scoreKey = list === 'organic' ? listOrganicKey(chain) : listTrendingKey(chain)
        const multi = redis.multi()
        for (const tokenId of toLoadScores) {
          multi.zScore(scoreKey, tokenId)
        }
        const loaded: any[] = await multi.exec()
        for (let i = 0; i < toLoadScores.length; i += 1) {
          scoreByToken.set(toLoadScores[i], safeNumber(loaded?.[i], 0))
        }
      }
    }

    const summaryKeys = tokenIds.map((tokenId) => tokenSummaryKey(chain, tokenId))
    const summaryRaw = summaryKeys.length ? await redis.mGet(summaryKeys) : []

    const entries = tokenIds
      .map((tokenId, index) => {
        const summary = safeJsonParse<any>(summaryRaw[index], null)
        if (!summary) return null
        if (baseTokenId && String(summary?.quote_token_id || '').toLowerCase() !== baseTokenId) return null
        if (scamFilters && isScamSummary(summary, scamFilters)) return null
        if (!matchesSearch(summary, search)) return null

        const score = safeNumber(scoreByToken.get(tokenId), 0)
        const createdAt = parseTsOrZero(summary?.created_at ?? summary?.createdAt)
        const vol24h = safeNumber(summary?.volume_usd?.h24, 0)
        const liq = safeNumber(summary?.liquidity?.usd, 0)
        const marketCap = safeNumber(summary?.market_cap, NaN)
        const fdv = safeNumber(summary?.fdv, NaN)
        const supply = safeNumber(summary?.supply, NaN)
        const priceUsd = safeNumber(summary?.price_usd, NaN)
        const mcap = Number.isFinite(marketCap) && marketCap > 0
          ? marketCap
          : (Number.isFinite(fdv) && fdv > 0
              ? fdv
              : (Number.isFinite(supply) && supply > 0 && Number.isFinite(priceUsd) && priceUsd > 0
                  ? (supply * priceUsd)
                  : 0))

        let sortValue = score
        if (sort === 'age') sortValue = createdAt
        else if (sort === 'vol24h') sortValue = vol24h
        else if (sort === 'liq') sortValue = liq
        else if (sort === 'mcap') sortValue = mcap

        return {
          tokenId,
          sortValue,
          item: {
            token_id: tokenId,
            score,
            ...summary,
          },
        }
      })
      .filter(Boolean) as Array<{ tokenId: string, sortValue: number, item: any }>

    entries.sort((a, b) => {
      if (a.sortValue !== b.sortValue) {
        return dir === 'desc'
          ? (b.sortValue - a.sortValue)
          : (a.sortValue - b.sortValue)
      }
      return a.tokenId.localeCompare(b.tokenId)
    })

    const filtered = cursor
      ? entries.filter((entry) => {
          if (dir === 'desc') {
            if (entry.sortValue < cursor.v) return true
            if (entry.sortValue > cursor.v) return false
            return entry.tokenId > cursor.id
          }

          if (entry.sortValue > cursor.v) return true
          if (entry.sortValue < cursor.v) return false
          return entry.tokenId > cursor.id
        })
      : entries

    const pageWithOneExtra = filtered.slice(0, limit + 1)
    const hasMore = pageWithOneExtra.length > limit
    const pageEntries = hasMore ? pageWithOneExtra.slice(0, limit) : pageWithOneExtra
    const last = pageEntries.length ? pageEntries[pageEntries.length - 1] : null
    const nextCursor = (hasMore && last)
      ? encodeTokensCursor({ l: list, s: sort, d: dir, v: last.sortValue, id: last.tokenId })
      : null

    res.json({
      meta: {
        chain,
        ts: Date.now(),
        list,
        sort,
        dir,
        limit,
        hide_scam: hideScam,
        search: search || null,
        selection: {
          trending_top: TOKENS_TRENDING_TOP,
          organic_top: TOKENS_TRENDING_TOP,
          new_window_ms: TOKENS_NEW_WINDOW_MS,
        },
      },
      items: pageEntries.map((entry) => entry.item),
      next_cursor: nextCursor,
      total: entries.length,
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch launchpad tokens list' })
  }
})

launchpad.get('/new', async (req, res) => {
  try {
    const network = req.app.get('network')
    const chain = network?.name

    const limit = parseLimit(req.query.limit)
    const cursor = parseCursor(req.query.cursor)
    const search = normalizeSearch(req.query.search || req.query.q)
    const hideScam = parseHideScam(req.query.hide_scam)
    const scamFilters = hideScam ? normalizeScamFilters(await getScamLists(network)) : null

    const { items, nextCursor, totalMatched } = await readRankedList(
      chain,
      listNewKey(chain),
      limit,
      cursor,
      search,
      scamFilters,
      { minScore: Date.now() - TOKENS_NEW_WINDOW_MS }
    )

    res.json({
      meta: { chain, ts: Date.now(), list: 'new', limit, cursor, search: search || null, hide_scam: hideScam },
      items,
      next_cursor: nextCursor,
      total: totalMatched,
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch launchpad new list' })
  }
})

launchpad.get('/trending', async (req, res) => {
  try {
    const network = req.app.get('network')
    const chain = network?.name

    const limit = parseLimit(req.query.limit)
    const cursor = parseCursor(req.query.cursor)
    const search = normalizeSearch(req.query.search || req.query.q)
    const hideScam = parseHideScam(req.query.hide_scam)
    const scamFilters = hideScam ? normalizeScamFilters(await getScamLists(network)) : null

    const { items, nextCursor, totalMatched } = await readRankedList(
      chain,
      listTrendingKey(chain),
      limit,
      cursor,
      search,
      scamFilters
    )

    res.json({
      meta: { chain, ts: Date.now(), list: 'trending', limit, cursor, search: search || null, hide_scam: hideScam },
      items,
      next_cursor: nextCursor,
      total: totalMatched,
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch launchpad trending list' })
  }
})

launchpad.get('/organic', async (req, res) => {
  try {
    const network = req.app.get('network')
    const chain = network?.name

    const limit = parseLimit(req.query.limit)
    const cursor = parseCursor(req.query.cursor)
    const search = normalizeSearch(req.query.search || req.query.q)
    const hideScam = parseHideScam(req.query.hide_scam)
    const scamFilters = hideScam ? normalizeScamFilters(await getScamLists(network)) : null

    const { items, nextCursor, totalMatched } = await readRankedList(
      chain,
      listOrganicKey(chain),
      limit,
      cursor,
      search,
      scamFilters
    )

    res.json({
      meta: { chain, ts: Date.now(), list: 'organic', limit, cursor, search: search || null, hide_scam: hideScam },
      items,
      next_cursor: nextCursor,
      total: totalMatched,
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch launchpad organic list' })
  }
})

launchpad.get('/graduated', async (req, res) => {
  try {
    const network = req.app.get('network')
    const chain = network?.name

    const limit = parseLimit(req.query.limit)
    const cursor = parseCursor(req.query.cursor)
    const search = normalizeSearch(req.query.search || req.query.q)
    const hideScam = parseHideScam(req.query.hide_scam)
    const scamFilters = hideScam ? normalizeScamFilters(await getScamLists(network)) : null

    const { items, nextCursor, totalMatched } = await readRankedList(
      chain,
      listGraduatedKey(chain),
      limit,
      cursor,
      search,
      scamFilters
    )

    res.json({
      meta: { chain, ts: Date.now(), list: 'graduated', limit, cursor, search: search || null, hide_scam: hideScam },
      items,
      next_cursor: nextCursor,
      total: totalMatched,
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch launchpad graduated list' })
  }
})

launchpad.get('/search', async (req, res) => {
  try {
    const network = req.app.get('network')
    const chain = network?.name
    const limit = parseLimit(req.query.limit)
    const cursor = parseCursor(req.query.cursor)
    const q = normalizeSearch(req.query.q || req.query.search)
    const list = String(req.query.list || 'trending').toLowerCase()
    const hideScam = parseHideScam(req.query.hide_scam)
    const scamFilters = hideScam ? normalizeScamFilters(await getScamLists(network)) : null

    if (!q) {
      return res.status(400).json({ error: 'q is required' })
    }

    const key = list === 'new'
      ? listNewKey(chain)
      : (list === 'graduated'
          ? listGraduatedKey(chain)
          : (list === 'organic' ? listOrganicKey(chain) : listTrendingKey(chain)))

    const { items, nextCursor, totalMatched } = await readRankedList(
      chain,
      key,
      limit,
      cursor,
      q,
      scamFilters,
      list === 'new' ? { minScore: Date.now() - TOKENS_NEW_WINDOW_MS } : {}
    )

    res.json({
      meta: { chain, ts: Date.now(), list, q, limit, cursor, hide_scam: hideScam },
      items,
      next_cursor: nextCursor,
      total: totalMatched,
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to search launchpad tokens' })
  }
})

launchpad.get('/token/:tokenId/summary', async (req, res) => {
  try {
    const network = req.app.get('network')
    const chain = network?.name
    const baseTokenId = String(network?.baseToken?.id || '').toLowerCase()
    const tokenId = decodeURIComponent(String(req.params.tokenId || '')).toLowerCase()
    const hideScam = parseHideScam(req.query.hide_scam)
    const scamFilters = hideScam ? normalizeScamFilters(await getScamLists(network)) : null

    if (!tokenId) {
      return res.status(400).json({ error: 'tokenId is required' })
    }

    const redis = getRedis()
    const [summaryRaw, holdersRaw] = await Promise.all([
      redis.get(tokenSummaryKey(chain, tokenId)),
      redis.hGet(`${chain}_token_holders_stats`, tokenId),
    ])

    const summary = safeJsonParse<any>(summaryRaw, null)
    if (!summary) {
      return res.status(404).json({ error: 'Token summary not found' })
    }
    if (baseTokenId && String(summary.quote_token_id || '').toLowerCase() !== baseTokenId) {
      return res.status(404).json({ error: 'Token summary not found' })
    }
    if (scamFilters && isScamSummary(summary, scamFilters)) {
      return res.status(404).json({ error: 'Token summary not found' })
    }

    const holders = safeJsonParse<any>(holdersRaw, null)

    res.json({
      meta: { chain, ts: Date.now(), hide_scam: hideScam },
      ...summary,
      holders: holders
        ? {
            count: holders.holders ?? null,
            change1h: holders.change1h ?? null,
            change6h: holders.change6h ?? null,
            change24h: holders.change24h ?? null,
            truncated: holders.truncated ?? false,
            updatedAt: holders.updatedAt ?? null,
          }
        : null,
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch launchpad token summary' })
  }
})

launchpad.get('/token/:tokenId/trades', async (req, res) => {
  try {
    const network = req.app.get('network')
    const chain = network?.name
    const tokenId = decodeURIComponent(String(req.params.tokenId || '')).toLowerCase()
    const limit = parseLimit(req.query.limit, 100, TRADES_MAX_LIMIT)
    const cursor = parseCursor(req.query.cursor)
    const hideScam = parseHideScam(req.query.hide_scam)
    const scamFilters = hideScam ? normalizeScamFilters(await getScamLists(network)) : null

    if (!tokenId) {
      return res.status(400).json({ error: 'tokenId is required' })
    }

    const redis = getRedis()
    const summaryRaw = await redis.get(tokenSummaryKey(chain, tokenId))
    const summary = safeJsonParse<any>(summaryRaw, null)
    if (scamFilters) {
      const isScam = (
        scamFilters.scamTokens.has(tokenId)
        || (summary ? isScamSummary(summary, scamFilters) : false)
      )
      if (isScam) {
        return res.status(404).json({ error: 'Token trades not found' })
      }
    }

    const tradesKey = tokenTradesKey(chain, tokenId)
    const [rows, total] = await Promise.all([
      redis.lRange(tradesKey, cursor, Math.max(cursor, cursor + limit - 1)),
      redis.lLen(tradesKey),
    ])
    const items = rows
      .map((row) => safeJsonParse<any>(row, null))
      .filter(Boolean)
      .map((trade: any) => ({
        ...trade,
        sender: trade?.sender || null,
        recipient: trade?.recipient || null,
        account: trade?.account || trade?.sender || trade?.recipient || null,
      }))
    const nextCursor = (cursor + items.length) < Number(total || 0) ? (cursor + items.length) : null

    res.json({
      meta: { chain, ts: Date.now(), token_id: tokenId, limit, cursor, hide_scam: hideScam },
      items,
      next_cursor: nextCursor,
      total: Number(total || 0),
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch launchpad token trades' })
  }
})

launchpad.get('/token/:tokenId/holders', async (req, res) => {
  try {
    const network = req.app.get('network')
    const chain = network?.name
    const tokenId = decodeURIComponent(String(req.params.tokenId || '')).toLowerCase()
    const limit = parseLimit(req.query.limit, 50)
    const hideScam = parseHideScam(req.query.hide_scam)
    const scamFilters = hideScam ? normalizeScamFilters(await getScamLists(network)) : null

    if (!tokenId) {
      return res.status(400).json({ error: 'tokenId is required' })
    }

    const redis = getRedis()
    const summaryRaw = await redis.get(tokenSummaryKey(chain, tokenId))
    const summary = safeJsonParse<any>(summaryRaw, null)
    if (scamFilters) {
      const isScam = (
        scamFilters.scamTokens.has(tokenId)
        || (summary ? isScamSummary(summary, scamFilters) : false)
      )
      if (isScam) {
        return res.status(404).json({ error: 'Token holders not found' })
      }
    }

    const raw = await redis.hGet(`${chain}_token_holders_stats`, tokenId)
    const stats = safeJsonParse<any>(raw, null)

    res.json({
      meta: { chain, ts: Date.now(), token_id: tokenId, limit, hide_scam: hideScam },
      available: false,
      reason: 'top holders source is not configured in this environment',
      stats: stats
        ? {
            count: stats.holders ?? null,
            change1h: stats.change1h ?? null,
            change6h: stats.change6h ?? null,
            change24h: stats.change24h ?? null,
            truncated: stats.truncated ?? false,
            updatedAt: stats.updatedAt ?? null,
          }
        : null,
      items: [],
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch launchpad holders data' })
  }
})
