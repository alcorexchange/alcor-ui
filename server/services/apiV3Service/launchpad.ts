import { Router } from 'express'
import config from '../../../config'

import { getRedis } from '../redis'
import { getScamLists } from '../apiV2Service/config'
import {
  listGraduatedKey,
  listNewKey,
  listTrendingKey,
  tokenSummaryKey,
  tokenTradesKey,
} from '../launchpadMarketDataService/keys'

export const launchpad = Router()

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200
const MAX_SEARCH_SCAN = 5000

type ScamFilters = {
  scamContracts: Set<string>
  scamTokens: Set<string>
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function parseLimit(raw: any, fallback = DEFAULT_LIMIT) {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.min(Math.floor(n), MAX_LIMIT)
}

function parseCursor(raw: any) {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.floor(n)
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
  scamFilters: ScamFilters | null = null
) {
  const redis: any = getRedis()
  const baseTokenId = String((config as any)?.networks?.[chain]?.baseToken?.id || '').toLowerCase()
  const hasSearch = Boolean(search)
  const start = hasSearch ? 0 : cursor
  const end = hasSearch ? Math.max(0, MAX_SEARCH_SCAN - 1) : (cursor + Math.max(0, limit - 1))
  const raw: string[] = await redis.sendCommand([
    'ZREVRANGE',
    key,
    String(start),
    String(end),
    'WITHSCORES',
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

  const totalMatched = hasSearch ? matchedItems.length : Number(await redis.zCard(key))
  const nextCursor = (cursor + items.length) < totalMatched ? (cursor + items.length) : null
  return { items, nextCursor, totalMatched }
}

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
      scamFilters
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
      : (list === 'graduated' ? listGraduatedKey(chain) : listTrendingKey(chain))

    const { items, nextCursor, totalMatched } = await readRankedList(chain, key, limit, cursor, q, scamFilters)

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
    const limit = parseLimit(req.query.limit, 100)
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

    const rows = await redis.lRange(tokenTradesKey(chain, tokenId), 0, Math.max(0, limit - 1))
    const items = rows
      .map((row) => safeJsonParse<any>(row, null))
      .filter(Boolean)

    res.json({
      meta: { chain, ts: Date.now(), token_id: tokenId, limit, hide_scam: hideScam },
      items,
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
