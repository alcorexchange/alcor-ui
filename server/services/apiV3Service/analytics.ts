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
import { getChainRpc } from '../../../utils/eosjs'
import { getOrderbook } from '../orderbookService/start'
import { sqrt } from '../../../utils/bigint'
import { getProtonTokenRegistryEntry } from '../protonTokenRegistryService'
import type { ProtonTokenRegistryEntry } from '../protonTokenRegistryService'
import { getSimpleTokenLogoUrl } from '../simpleTokenLogoService'
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
const DEFAULT_DEPTH_PRICE_FACTOR = 20
const MIN_STAKED_TVL_USD = 1
const APR_PERIOD_DAYS = 7
const OVERVIEW_CACHE_SECONDS = 900
const ACCOUNT_NAME_REGEX = /^[a-z1-5.]{1,12}$/
const BANNED_ACCOUNTS_CACHE_SECONDS = 30
const MAX_BAN_TABLE_PAGES = 200

type TokenInfo = {
  id?: string
  symbol?: string
  contract?: string
  name?: string
  usd_price?: number
  safe_usd_price?: number
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

function getSafeUsdPrice(token: any, fallback = 0) {
  return safeNumber(token?.safe_usd_price, fallback)
}

function normalizeAccountName(raw: any) {
  const account = String(raw || '').trim().toLowerCase()
  if (!account) return null
  return ACCOUNT_NAME_REGEX.test(account) ? account : null
}

function normalizeAccountList(accounts: any[]) {
  const unique = new Set<string>()
  for (const raw of accounts || []) {
    const account = normalizeAccountName(raw)
    if (account) unique.add(account)
  }
  return [...unique].sort((a, b) => a.localeCompare(b))
}

async function fetchAllContractRows(rpc: any, params: { code: string, scope: string, table: string }) {
  const rows: any[] = []
  let lowerBound: string | undefined = undefined

  for (let i = 0; i < MAX_BAN_TABLE_PAGES; i += 1) {
    const batch = await rpc.get_table_rows({
      json: true,
      code: params.code,
      scope: params.scope,
      table: params.table,
      limit: 1000,
      ...(lowerBound ? { lower_bound: lowerBound } : {}),
    })

    const chunk = Array.isArray(batch?.rows) ? batch.rows : []
    rows.push(...chunk)

    const hasMore = Boolean(batch?.more)
    if (!hasMore || chunk.length === 0) break

    const nextKey = (typeof batch?.next_key !== 'undefined' && String(batch.next_key).length > 0)
      ? String(batch.next_key)
      : (typeof batch?.more === 'string' && batch.more.length > 0 ? String(batch.more) : null)

    if (!nextKey || nextKey === lowerBound) break
    lowerBound = nextKey
  }

  return rows
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

const ANALYTICS_RESPONSE_SWR_STALE_MS = 60 * 60 * 1000
const OVERVIEW_RESPONSE_SWR_FRESH_MS = OVERVIEW_CACHE_SECONDS * 1000
const TOKENS_RESPONSE_SWR_FRESH_MS = 60 * 1000
const ANALYTICS_RESPONSE_SWR_LOCK_TTL_SECONDS = 120
const ANALYTICS_RESPONSE_SWR_WAIT_MS = 12000

type SwrEnvelope<T> = {
  ts: number
  payload: T
}

function buildAnalyticsResponseSwrKey(route: string, req: any) {
  const network = req.app.get('network')
  return `analytics_v3_swr|${route}|${network?.name || 'unknown'}|${req.originalUrl}`
}

function buildAnalyticsResponseSwrLockKey(cacheKey: string) {
  return `${cacheKey}|lock`
}

async function readSwrEnvelope<T>(cacheKey: string): Promise<SwrEnvelope<T> | null> {
  const redis = getRedis()
  try {
    const raw = await redis.get(cacheKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const ts = safeNumber(parsed?.ts, 0)
    if (!ts || typeof parsed?.payload === 'undefined') return null
    return { ts, payload: parsed.payload as T }
  } catch (e) {
    return null
  }
}

async function writeSwrEnvelope<T>(cacheKey: string, payload: T, staleMs: number) {
  const redis = getRedis()
  try {
    const ttlSeconds = Math.max(1, Math.ceil(staleMs / 1000))
    await redis.set(cacheKey, JSON.stringify({ ts: Date.now(), payload }), { EX: ttlSeconds })
  } catch (e) {
    // ignore redis cache write errors
  }
}

async function tryAcquireSwrLock(lockKey: string) {
  const redis = getRedis()
  const token = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`
  try {
    const result = await redis.set(lockKey, token, {
      NX: true,
      EX: ANALYTICS_RESPONSE_SWR_LOCK_TTL_SECONDS,
    })
    return result === 'OK' ? token : null
  } catch (e) {
    return null
  }
}

async function releaseSwrLock(lockKey: string, token: string | null) {
  if (!token) return
  const redis = getRedis()
  try {
    const current = await redis.get(lockKey)
    if (current === token) {
      await redis.del(lockKey)
    }
  } catch (e) {
    // rely on lock TTL when release fails
  }
}

async function waitForSwrEnvelope<T>(cacheKey: string, timeoutMs = ANALYTICS_RESPONSE_SWR_WAIT_MS) {
  const startedAt = Date.now()
  while ((Date.now() - startedAt) < timeoutMs) {
    const cached = await readSwrEnvelope<T>(cacheKey)
    if (cached) return cached
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  return null
}

async function getSwrPayload<T>(
  cacheKey: string,
  build: () => Promise<T>,
  freshMs: number,
  staleMs: number
): Promise<T> {
  const now = Date.now()
  const lockKey = buildAnalyticsResponseSwrLockKey(cacheKey)
  const cached = await readSwrEnvelope<T>(cacheKey)

  const refreshInBackground = async () => {
    let token: string | null = null
    try {
      token = await tryAcquireSwrLock(lockKey)
      if (!token) return
      const payload = await build()
      await writeSwrEnvelope(cacheKey, payload, staleMs)
    } catch (e) {
      // ignore background refresh errors; stale payload is still served
    } finally {
      await releaseSwrLock(lockKey, token)
    }
  }

  if (cached) {
    const age = now - cached.ts
    if (age <= freshMs) return cached.payload
    if (age <= staleMs) {
      void refreshInBackground()
      return cached.payload
    }
  }

  let token: string | null = await tryAcquireSwrLock(lockKey)
  if (token) {
    try {
      const payload = await build()
      await writeSwrEnvelope(cacheKey, payload, staleMs)
      return payload
    } finally {
      await releaseSwrLock(lockKey, token)
    }
  }

  if (cached) {
    const age = now - cached.ts
    if (age <= staleMs) return cached.payload
  }

  const warmed = await waitForSwrEnvelope<T>(cacheKey)
  if (warmed) return warmed.payload

  token = await tryAcquireSwrLock(lockKey)
  if (token) {
    try {
      const payload = await build()
      await writeSwrEnvelope(cacheKey, payload, staleMs)
      return payload
    } finally {
      await releaseSwrLock(lockKey, token)
    }
  }

  const fallback = await readSwrEnvelope<T>(cacheKey)
  if (fallback) return fallback.payload

  return await build()
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

async function getLogoUrl(network: any, token: any, protonRegistryToken: ProtonTokenRegistryEntry | null = null) {
  if (!token || !network?.name) return null
  const tokenId = String(token.id || '')
  const symbol = String(token.symbol || '').toLowerCase()
  const contract = String(token.contract || '')

  const local = getLocalLogoUrl(network.name, tokenId, symbol, contract)
  if (local) return local

  if (protonRegistryToken?.iconUrl) return protonRegistryToken.iconUrl

  const simpleTokenLogoUrl = await getSimpleTokenLogoUrl(network, token)
  if (simpleTokenLogoUrl) return simpleTokenLogoUrl

  return await getEosAirdropLogo(network.name, symbol, contract)
}

type TokenPresentation = {
  protonRegistryToken: ProtonTokenRegistryEntry | null
  logoUrl: string | null
}

const tokenPresentationCache = new Map<string, {
  expiresAt: number
  data: TokenPresentation
}>()
const TOKEN_PRESENTATION_CACHE_MS = 5 * 60 * 1000

async function getTokenPresentationCached(network: any, token: any): Promise<TokenPresentation> {
  if (!token || !network?.name) {
    return { protonRegistryToken: null, logoUrl: null }
  }

  const key = `${String(network.name)}:${String(token.id || '').toLowerCase()}`
  const now = Date.now()
  const cached = tokenPresentationCache.get(key)
  if (cached && cached.expiresAt > now) return cached.data

  const protonRegistryToken = await getProtonTokenRegistryEntry(network, token.symbol, token.contract)
  const logoUrl = await getLogoUrl(network, token, protonRegistryToken)
  const data = { protonRegistryToken, logoUrl }

  tokenPresentationCache.set(key, { expiresAt: now + TOKEN_PRESENTATION_CACHE_MS, data })
  return data
}

const fundamentalsCache = new Map<string, any>()
type PlatformBalancesData = { tokenTvlMap: Map<string, number>, contractTvlMap: Map<string, number> }
const platformBalancesCache = new Map<string, {
  expiresAt: number
  data: PlatformBalancesData
  refreshPromise?: Promise<void>
}>()
const PLATFORM_BALANCES_CACHE_MS = 60 * 1000
const PLATFORM_BALANCES_REDIS_TTL_SECONDS = 10 * 60
const PLATFORM_BALANCES_REFRESH_LOCK_TTL_SECONDS = 55
const PLATFORM_BALANCES_REFRESH_WAIT_MS = 8000

function serializePlatformBalances(data: PlatformBalancesData) {
  return {
    tokenTvl: Object.fromEntries(data.tokenTvlMap.entries()),
    contractTvl: Object.fromEntries(data.contractTvlMap.entries()),
  }
}

function deserializePlatformBalances(raw: any): PlatformBalancesData | null {
  if (!raw || typeof raw !== 'object') return null

  const tokenEntries = Object.entries(raw?.tokenTvl || {})
    .map(([k, v]) => [String(k), safeNumber(v)] as [string, number])
  const contractEntries = Object.entries(raw?.contractTvl || {})
    .map(([k, v]) => [String(k), safeNumber(v)] as [string, number])

  return {
    tokenTvlMap: new Map<string, number>(tokenEntries),
    contractTvlMap: new Map<string, number>(contractEntries),
  }
}

async function readPlatformBalancesFromRedis(redisKey: string) {
  const redis = getRedis()
  try {
    const raw = await redis.get(redisKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const fetchedAt = safeNumber(parsed?.fetchedAt, 0)
    const data = deserializePlatformBalances(parsed?.data)
    if (!data) return null
    return { fetchedAt, expiresAt: fetchedAt + PLATFORM_BALANCES_CACHE_MS, data }
  } catch (e) {
    return null
  }
}

async function writePlatformBalancesToRedis(redisKey: string, fetchedAt: number, data: PlatformBalancesData) {
  const redis = getRedis()
  try {
    await redis.set(
      redisKey,
      JSON.stringify({
        fetchedAt,
        data: serializePlatformBalances(data),
      }),
      { EX: PLATFORM_BALANCES_REDIS_TTL_SECONDS }
    )
  } catch (e) {
    // ignore redis write errors; in-memory cache still works
  }
}

function getPlatformBalancesRefreshLockKey(networkKey: string) {
  return `${networkKey}_platform_balances_refresh_lock_v1`
}

async function tryAcquirePlatformBalancesRefreshLock(lockKey: string) {
  const redis = getRedis()
  const lockToken = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`
  try {
    const result = await redis.set(lockKey, lockToken, {
      NX: true,
      EX: PLATFORM_BALANCES_REFRESH_LOCK_TTL_SECONDS,
    })
    return result === 'OK' ? lockToken : null
  } catch (e) {
    return null
  }
}

async function releasePlatformBalancesRefreshLock(lockKey: string, lockToken: string | null) {
  if (!lockToken) return
  const redis = getRedis()
  try {
    const current = await redis.get(lockKey)
    if (current === lockToken) {
      await redis.del(lockKey)
    }
  } catch (e) {
    // rely on lock TTL on failure
  }
}

async function waitForPlatformBalancesFromRedis(redisKey: string, timeoutMs = PLATFORM_BALANCES_REFRESH_WAIT_MS) {
  const startedAt = Date.now()
  while ((Date.now() - startedAt) < timeoutMs) {
    const redisCached = await readPlatformBalancesFromRedis(redisKey)
    if (redisCached?.data) return redisCached
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  return null
}

async function getPlatformBalancesCached(network: any, tokens: any[]) {
  const key = String(network?.name || '')
  const redisKey = `${key}_platform_balances_cache_v1`
  const lockKey = getPlatformBalancesRefreshLockKey(key)
  const now = Date.now()
  const cached = platformBalancesCache.get(key)
  if (cached && cached.expiresAt > now) return cached.data

  const refreshAndPersist = async () => {
    const fetchedAt = Date.now()
    const data = await fetchPlatformBalances(network, tokens)
    platformBalancesCache.set(key, {
      expiresAt: fetchedAt + PLATFORM_BALANCES_CACHE_MS,
      data,
      refreshPromise: undefined,
    })
    await writePlatformBalancesToRedis(redisKey, fetchedAt, data)
    return data
  }

  const redisCached = await readPlatformBalancesFromRedis(redisKey)
  if (redisCached && redisCached.expiresAt > now) {
    platformBalancesCache.set(key, {
      expiresAt: redisCached.expiresAt,
      data: redisCached.data,
      refreshPromise: cached?.refreshPromise,
    })
    return redisCached.data
  }

  const staleEntry = cached?.data
    ? cached
    : (redisCached ? { expiresAt: redisCached.expiresAt, data: redisCached.data, refreshPromise: undefined } : null)

  if (staleEntry?.data) {
    if (!staleEntry.refreshPromise) {
      const refreshPromise = (async () => {
        let lockToken: string | null = null
        try {
          lockToken = await tryAcquirePlatformBalancesRefreshLock(lockKey)
          if (!lockToken) return
          await refreshAndPersist()
        } catch (e) {
          platformBalancesCache.set(key, { ...staleEntry, refreshPromise: undefined })
        } finally {
          await releasePlatformBalancesRefreshLock(lockKey, lockToken)
        }
      })()
      platformBalancesCache.set(key, { ...staleEntry, refreshPromise })
    }
    return staleEntry.data
  }

  let lockToken: string | null = await tryAcquirePlatformBalancesRefreshLock(lockKey)
  if (lockToken) {
    try {
      return await refreshAndPersist()
    } finally {
      await releasePlatformBalancesRefreshLock(lockKey, lockToken)
    }
  }

  const waited = await waitForPlatformBalancesFromRedis(redisKey)
  if (waited?.data) {
    platformBalancesCache.set(key, {
      expiresAt: waited.expiresAt,
      data: waited.data,
      refreshPromise: undefined,
    })
    return waited.data
  }

  // Fallback path: if lock owner failed to refresh, retry lock once to avoid long outage.
  lockToken = await tryAcquirePlatformBalancesRefreshLock(lockKey)
  if (lockToken) {
    try {
      return await refreshAndPersist()
    } finally {
      await releasePlatformBalancesRefreshLock(lockKey, lockToken)
    }
  }

  const staleAfterWait = await readPlatformBalancesFromRedis(redisKey)
  if (staleAfterWait?.data) {
    platformBalancesCache.set(key, {
      expiresAt: staleAfterWait.expiresAt,
      data: staleAfterWait.data,
      refreshPromise: undefined,
    })
    return staleAfterWait.data
  }

  return {
    tokenTvlMap: new Map<string, number>(),
    contractTvlMap: new Map<string, number>(),
  }
}

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

function buildFundamentalFromProton(protonToken: ProtonTokenRegistryEntry | null) {
  if (!protonToken) return null

  return {
    name: protonToken.name || null,
    website: {
      link: protonToken.url || '',
      name: protonToken.name || '',
    },
    tags: [],
    socials: [],
    description: protonToken.description || '',
    iconurl: protonToken.iconUrl || null,
    blacklisted: protonToken.blacklisted,
    source: 'token.proton',
  }
}

function mergeFundamental(base: any, fallback: any) {
  if (!base) return fallback || null
  if (!fallback) return base

  return {
    ...base,
    name: base.name || fallback.name || null,
    description: base.description || fallback.description || '',
    website: {
      link: base.website?.link || fallback.website?.link || '',
      name: base.website?.name || fallback.website?.name || '',
    },
    iconurl: base.iconurl || fallback.iconurl || null,
    blacklisted: base.blacklisted ?? fallback.blacklisted ?? false,
  }
}

async function getFundamental(network: any, token: any, protonRegistryToken: ProtonTokenRegistryEntry | null = null) {
  if (!token || !network?.name) return null

  const byChain = loadFundamentals(network.name)
  const symbol = String(token.symbol || '').toUpperCase()
  const contract = String(token.contract || '')
  const key = `${symbol}@${contract}`
  const base = byChain?.[key] || null

  const protonToken = protonRegistryToken || await getProtonTokenRegistryEntry(network, symbol, contract)
  const protonFundamental = buildFundamentalFromProton(protonToken)

  return mergeFundamental(base, protonFundamental)
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
  const priceMap = new Map<string, number>(tokens.map((t) => [t.id, getSafeUsdPrice(t)]))

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
  const quoteId = market?.quote_token?.id
  const baseId = market?.base_token?.id
  const bid = safeNumber(market?.bid, 0)
  const ask = safeNumber(market?.ask, 0)
  const last = safeNumber(market?.last_price, 0)
  const refPrice = bid > 0 && ask > 0 ? (bid + ask) / 2 : last
  const minPrice = refPrice > 0 ? refPrice / DEFAULT_DEPTH_PRICE_FACTOR : 0
  const maxPrice = refPrice > 0 ? refPrice * DEFAULT_DEPTH_PRICE_FACTOR : Number.POSITIVE_INFINITY

  const isRowInPriceBand = (row: any) => {
    const unitPrice = Number(row?.[0] || 0) / PRICE_SCALE
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) return false
    if (refPrice <= 0) return true
    return unitPrice >= minPrice && unitPrice <= maxPrice
  }

  let quotePrice = safeNumber(priceMap.get(quoteId), 0)
  if (quotePrice <= 0) {
    const basePrice = safeNumber(priceMap.get(baseId), 0)
    const lastPrice = safeNumber(market?.last_price, 0)
    if (basePrice > 0 && lastPrice > 0) {
      quotePrice = basePrice / lastPrice
    }
  }

  const [buyBook, sellBook] = await Promise.all([
    getOrderbook(chain, 'buy', market.id),
    getOrderbook(chain, 'sell', market.id),
  ])

  const buyRows = Array.from(buyBook.values()).filter(isRowInPriceBand).slice(0, depthLimit)
  const sellRows = Array.from(sellBook.values()).filter(isRowInPriceBand).slice(0, depthLimit)

  let bidDepthQuote = 0
  for (const row of buyRows) {
    // buy book row format: [unit_price, bid(base), ask(quote)]
    const quoteAmount = Number(row?.[2] || 0)
    bidDepthQuote += quoteAmount / Math.pow(10, quotePrecision)
  }

  let askDepthQuote = 0
  for (const row of sellRows) {
    // sell book row format: [unit_price, bid(quote), ask(base)]
    const quoteAmount = Number(row?.[1] || 0)
    askDepthQuote += quoteAmount / Math.pow(10, quotePrecision)
  }

  return {
    bidDepthQuote: Number(bidDepthQuote.toFixed(6)),
    askDepthQuote: Number(askDepthQuote.toFixed(6)),
    bidDepthUsd: Number((bidDepthQuote * quotePrice).toFixed(6)),
    askDepthUsd: Number((askDepthQuote * quotePrice).toFixed(6)),
  }
}

async function buildTokenTxStats(
  chain: string,
  tokens: any[],
  pools: any[],
  markets: any[],
  since?: Date | null,
  options: { restrictToProvidedSources?: boolean } = {}
) {
  const tokenStats = new Map<string, { swapTx: number, spotTx: number }>()
  const tokenIds = new Set(tokens.map((t) => t.id))
  const restrictToProvidedSources = options.restrictToProvidedSources === true

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
  let canQuerySwaps = true
  if (restrictToProvidedSources) {
    const poolIds = pools
      .map((p) => Number(p?.id))
      .filter((id) => Number.isFinite(id))
    if (poolIds.length === 0) {
      canQuerySwaps = false
    } else {
      swapMatch.pool = { $in: poolIds }
    }
  }

  const swapByPool = canQuerySwaps
    ? await Swap.aggregate([
      { $match: swapMatch },
      { $group: { _id: '$pool', trades: { $sum: 1 } } },
    ])
    : []

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
  let canQuerySpot = true
  if (restrictToProvidedSources) {
    const marketIds = markets
      .map((m) => Number(m?.id))
      .filter((id) => Number.isFinite(id))
    if (marketIds.length === 0) {
      canQuerySpot = false
    } else {
      spotMatch.market = { $in: marketIds }
    }
  }

  const matchByMarket = canQuerySpot
    ? await Match.aggregate([
      { $match: spotMatch },
      { $group: { _id: '$market', trades: { $sum: 1 } } },
    ])
    : []

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
  const rewardTokenPrice = getSafeUsdPrice(rewardToken)

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
    const rewardTokenPrice = getSafeUsdPrice(rewardToken)
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
    // Keep spot pair sides aligned with /api/v2/tickers ticker_id ordering.
    base: market.quote_token,
    quote: market.base_token,
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
    const rewardTokenPrice = getSafeUsdPrice(rewardToken)
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

analytics.get('/bans/accounts', cacheSeconds(BANNED_ACCOUNTS_CACHE_SECONDS, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const rpc = getChainRpc(network.name)

  const contracts = {
    dex: String(network?.contract || '').trim(),
    swap: String(network?.amm?.contract || '').trim(),
    otc: String(network?.otc?.contract || '').trim(),
  }

  const errors: Array<{ source: 'dex' | 'swap' | 'otc', message: string }> = []

  const [dexAccounts, swapAccounts, otcAccounts] = await Promise.all([
    (async () => {
      if (!contracts.dex) return []
      try {
        const result = await rpc.get_table_rows({
          json: true,
          code: contracts.dex,
          scope: contracts.dex,
          table: 'ban',
          limit: 1,
        })
        const rows = Array.isArray(result?.rows) ? result.rows : []
        const raw = Array.isArray(rows?.[0]?.accounts) ? rows[0].accounts : []
        return normalizeAccountList(raw)
      } catch (e: any) {
        errors.push({ source: 'dex', message: e?.message || 'Failed to read ban table' })
        return []
      }
    })(),
    (async () => {
      if (!contracts.swap) return []
      try {
        const rows = await fetchAllContractRows(rpc, {
          code: contracts.swap,
          scope: contracts.swap,
          table: 'banlist',
        })
        return normalizeAccountList(rows.map((row) => row?.account))
      } catch (e: any) {
        errors.push({ source: 'swap', message: e?.message || 'Failed to read banlist table' })
        return []
      }
    })(),
    (async () => {
      if (!contracts.otc) return []
      try {
        const rows = await fetchAllContractRows(rpc, {
          code: contracts.otc,
          scope: contracts.otc,
          table: 'banned',
        })
        return normalizeAccountList(rows.map((row) => row?.account))
      } catch (e: any) {
        errors.push({ source: 'otc', message: e?.message || 'Failed to read banned table' })
        return []
      }
    })(),
  ])

  const bySource = {
    dex: dexAccounts,
    swap: swapAccounts,
    otc: otcAccounts,
  }

  const map = new Map<string, Set<'dex' | 'swap' | 'otc'>>()

  for (const account of bySource.dex) {
    if (!map.has(account)) map.set(account, new Set())
    map.get(account)?.add('dex')
  }
  for (const account of bySource.swap) {
    if (!map.has(account)) map.set(account, new Set())
    map.get(account)?.add('swap')
  }
  for (const account of bySource.otc) {
    if (!map.has(account)) map.set(account, new Set())
    map.get(account)?.add('otc')
  }

  const items = [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([account, sources]) => ({
      account,
      sources: [...sources].sort(),
    }))

  res.json({
    meta: buildMeta(network, 'all'),
    contracts,
    totals: {
      unique: items.length,
      dex: bySource.dex.length,
      swap: bySource.swap.length,
      otc: bySource.otc.length,
    },
    bySource,
    items,
    errors,
  })
})

analytics.get('/overview', cacheSeconds(OVERVIEW_CACHE_SECONDS, (req, res) => {
  return getOverviewCacheKey(req)
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const window = getWindow(req.query.window)
  const includes = parseIncludes(req.query.include)
  const includeIncentives = includes.has('incentives')
  const includeTx = includes.has('tx')
  const includeDepth = includes.has('depth')

  const swrKey = buildAnalyticsResponseSwrKey('overview', req)
  const payload = await getSwrPayload(
    swrKey,
    async () => {
      const tokens = (await getTokens(network.name)) || []
      const priceMap = new Map<string, number>(tokens.map((t) => [t.id, getSafeUsdPrice(t)]))
      const [pools, markets, tokenScores] = await Promise.all([
        SwapPool.find({ chain: network.name }).lean(),
        Market.find({ chain: network.name }).lean(),
        loadTokenScores(network.name),
      ])

      const topTokensRaw = [...tokens]
        .sort((a, b) => safeNumber(tokenScores?.[b.id]?.score) - safeNumber(tokenScores?.[a.id]?.score))
        .slice(0, 10)
      const topTokenIds = topTokensRaw.map((t) => t.id).filter(Boolean)
      const topTokenIdSet = new Set(topTokenIds)
      const topTokenPools = pools.filter((p) => topTokenIdSet.has(p?.tokenA?.id) || topTokenIdSet.has(p?.tokenB?.id))
      const topTokenMarkets = markets.filter((m) => topTokenIdSet.has(m?.base_token?.id) || topTokenIdSet.has(m?.quote_token?.id))
      const [holdersStats, { tokenTvlMap }, tokenTxStats] = await Promise.all([
        loadTokenHoldersStats(network.name, topTokenIds),
        getPlatformBalancesCached(network, tokens),
        buildTokenTxStats(
          network.name,
          topTokensRaw,
          topTokenPools,
          topTokenMarkets,
          window.since,
          { restrictToProvidedSources: true }
        ),
      ])
      const tokenStats = buildTokenStats(topTokensRaw, topTokenPools, topTokenMarkets, window.label, tokenTvlMap)

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

      const topTokens = await Promise.all(topTokensRaw.map(async (t) => {
          const stats = tokenStats.get(t.id) || {}
          const score = tokenScores?.[t.id]?.score ?? null
          const firstSeenAt = tokenScores?.[t.id]?.firstSeenAt ?? null
          const holders = holdersStats.get(t.id) || null
          const tx = tokenTxStats.get(t.id) || { swapTx: 0, spotTx: 0 }
          const volumeSwap = safeNumber(stats.swapVolumeUSD)
          const volumeSpot = safeNumber(stats.spotVolumeUSD)
          const protonRegistryToken = await getProtonTokenRegistryEntry(network, t.symbol, t.contract)
          const logoUrl = await getLogoUrl(network, t, protonRegistryToken)

          const tokenPool = pickPoolForToken(poolsByToken, t.id, baseTokenId, usdTokenId)
          const priceChange24h = computeTokenPriceChange24(tokenPool, t.id)

          return {
            id: t.id,
            symbol: t.symbol,
            contract: t.contract,
            name: t.name || protonRegistryToken?.name || null,
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
        }))

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

      const [chart, statsRows] = await Promise.all([
        GlobalStats.aggregate([
          { $match },
          { $sort: { time: 1 } },
          { $group },
          { $sort: { _id: 1 } },
        ]),
        GlobalStats.aggregate([
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
        ]),
      ])
      const [stats] = statsRows

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

      return {
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
      }
    },
    OVERVIEW_RESPONSE_SWR_FRESH_MS,
    ANALYTICS_RESPONSE_SWR_STALE_MS
  )

  res.json(payload)
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
  const sort = String(req.query.sort || 'score').toLowerCase()
  const order = String(req.query.order || 'desc').toLowerCase()
  const dir = order === 'asc' ? 1 : -1
  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50')), 1), 500)
  const page = Math.max(parseInt(String(req.query.page || '1')), 1)
  const start = (page - 1) * limit

  const swrKey = buildAnalyticsResponseSwrKey('tokens', req)
  const payload = await getSwrPayload(
    swrKey,
    async () => {
      let tokens = (await getTokens(network.name)) || []
      if (search) {
        tokens = tokens.filter((t) =>
          String(t.symbol || '').toLowerCase().includes(search) ||
          String(t.contract || '').toLowerCase().includes(search) ||
          String(t.id || '').toLowerCase().includes(search)
        )
      }

      if (tokens.length === 0) {
        return {
          meta: buildMeta(network, window.label),
          items: [],
          page: 1,
          limit,
          total: 0,
        }
      }

      const tokenIds = tokens.map((t) => t.id)
      const useScopedSources = Boolean(search) && tokenIds.length > 0 && tokenIds.length <= 200
      const needsAllTxForSort = sort === 'tx'
      const needsAllHoldersForSort = sort === 'holders'
      const needsLogoFilter = hasLogo === 'true' || hasLogo === 'false'
      const poolsQuery: any = useScopedSources
        ? {
          chain: network.name,
          $or: [{ 'tokenA.id': { $in: tokenIds } }, { 'tokenB.id': { $in: tokenIds } }],
        }
        : { chain: network.name }
      const marketsQuery: any = useScopedSources
        ? {
          chain: network.name,
          $or: [{ 'base_token.id': { $in: tokenIds } }, { 'quote_token.id': { $in: tokenIds } }],
        }
        : { chain: network.name }

      const [pools, markets, tokenScores, { tokenTvlMap }] = await Promise.all([
        SwapPool.find(poolsQuery).lean(),
        Market.find(marketsQuery).lean(),
        loadTokenScores(network.name),
        getPlatformBalancesCached(network, tokens),
      ])

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

      const tokenStats = buildTokenStats(tokens, pools, markets, window.label, tokenTvlMap)
      const tokensById = new Map<string, any>(tokens.map((t) => [t.id, t]))

      const [tokenTxStatsAll, holdersStatsAll] = await Promise.all([
        needsAllTxForSort
          ? buildTokenTxStats(
            network.name,
            tokens,
            pools,
            markets,
            window.since,
            { restrictToProvidedSources: useScopedSources }
          )
          : Promise.resolve(new Map()),
        needsAllHoldersForSort
          ? loadTokenHoldersStats(network.name, tokenIds)
          : Promise.resolve(new Map()),
      ])

      let filtered = tokens.map((t) => {
        const stats = tokenStats.get(t.id) || {}
        const score = tokenScores?.[t.id]?.score ?? null
        const firstSeenAt = tokenScores?.[t.id]?.firstSeenAt ?? null
        const holders = holdersStatsAll.get(t.id) || null
        const tx = tokenTxStatsAll.get(t.id) || { swapTx: 0, spotTx: 0 }
        const volumeSwap = safeNumber(stats.swapVolumeUSD)
        const volumeSpot = safeNumber(stats.spotVolumeUSD)
        const tokenPool = pickPoolForToken(poolsByToken, t.id, baseTokenId, usdTokenId)
        const priceChange24h = computeTokenPriceChange24(tokenPool, t.id)

        return {
          id: t.id,
          symbol: t.symbol,
          contract: t.contract,
          name: t.name || null,
          decimals: t.decimals,
          logo: null,
          logoUrl: null,
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
          fundamental: null,
          scores: { total: score },
        }
      })

      if (needsLogoFilter) {
        const logos = await Promise.all(filtered.map(async (item) => {
          const token = tokensById.get(item.id)
          const { logoUrl } = await getTokenPresentationCached(network, token)
          return { id: item.id, logoUrl }
        }))
        const logoById = new Map<string, string | null>(logos.map((l) => [l.id, l.logoUrl || null]))

        filtered = filtered
          .map((item) => {
            const logoUrl = logoById.get(item.id) || null
            return { ...item, logo: logoUrl, logoUrl }
          })
          .filter((item) => hasLogo === 'true' ? Boolean(item.logoUrl) : !item.logoUrl)
      }

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

      const pageItems = filtered.slice(start, start + limit)
      const pageTokenIds = pageItems.map((i) => i.id).filter(Boolean)
      const pageTokenIdSet = new Set(pageTokenIds)
      const pageTokens = tokens.filter((t) => pageTokenIdSet.has(t.id))
      const pagePools = pools.filter((p) => pageTokenIdSet.has(p?.tokenA?.id) || pageTokenIdSet.has(p?.tokenB?.id))
      const pageMarkets = markets.filter((m) => pageTokenIdSet.has(m?.base_token?.id) || pageTokenIdSet.has(m?.quote_token?.id))

      const [pageTxStats, pageHoldersStats] = await Promise.all([
        needsAllTxForSort
          ? Promise.resolve(tokenTxStatsAll)
          : buildTokenTxStats(
            network.name,
            pageTokens,
            pagePools,
            pageMarkets,
            window.since,
            { restrictToProvidedSources: true }
          ),
        needsAllHoldersForSort
          ? Promise.resolve(holdersStatsAll)
          : loadTokenHoldersStats(network.name, pageTokenIds),
      ])

      const enrichedItems = await Promise.all(pageItems.map(async (item) => {
        const token = tokensById.get(item.id)
        const tx = pageTxStats.get(item.id) || { swapTx: 0, spotTx: 0 }
        const holders = pageHoldersStats.get(item.id) || null

        if (!token) {
          return {
            ...item,
            tx: { swap: tx.swapTx, spot: tx.spotTx, total: tx.swapTx + tx.spotTx },
            holders: holders ? {
              count: holders.holders ?? null,
              change1h: holders.change1h ?? null,
              change6h: holders.change6h ?? null,
              change24h: holders.change24h ?? null,
              truncated: holders.truncated ?? false,
            } : null,
          }
        }

        const { protonRegistryToken, logoUrl } = await getTokenPresentationCached(network, token)
        const fundamental = includeFundamental ? await getFundamental(network, token, protonRegistryToken) : null

        return {
          ...item,
          name: token.name || protonRegistryToken?.name || null,
          logo: logoUrl,
          logoUrl,
          tx: { swap: tx.swapTx, spot: tx.spotTx, total: tx.swapTx + tx.spotTx },
          holders: holders ? {
            count: holders.holders ?? null,
            change1h: holders.change1h ?? null,
            change6h: holders.change6h ?? null,
            change24h: holders.change24h ?? null,
            truncated: holders.truncated ?? false,
          } : null,
          fundamental,
        }
      }))

      return {
        meta: buildMeta(network, window.label),
        items: enrichedItems,
        page,
        limit,
        total: filtered.length,
      }
    },
    TOKENS_RESPONSE_SWR_FRESH_MS,
    ANALYTICS_RESPONSE_SWR_STALE_MS
  )

  res.json(payload)
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

  const [pools, rawMarkets] = await Promise.all([
    SwapPool.find({ chain: network.name, $or: [{ 'tokenA.id': token.id }, { 'tokenB.id': token.id }] }).lean(),
    Market.find({ chain: network.name, $or: [{ 'base_token.id': token.id }, { 'quote_token.id': token.id }] }).lean(),
  ])
  let markets = rawMarkets
  if (hideScam) {
    const { scam_contracts, scam_tokens } = await getScamLists(network)
    markets = markets.filter((m) =>
      !scam_contracts.has(m.base_token.contract) &&
      !scam_contracts.has(m.quote_token.contract) &&
      !scam_tokens.has(m.base_token.id) &&
      !scam_tokens.has(m.quote_token.id)
    )
  }

  const baseTokenId = network?.baseToken ? `${network.baseToken.symbol}-${network.baseToken.contract}`.toLowerCase() : null
  const usdTokenId = network?.USD_TOKEN || null
  const tokenPool = pickPoolForToken(new Map([[token.id, pools]]), token.id, baseTokenId, usdTokenId)
  const priceChange24h = computeTokenPriceChange24(tokenPool, token.id)
  const [{ tokenTvlMap }, tokenScores, tokenTxStats, holdersStats, protonRegistryToken] = await Promise.all([
    getPlatformBalancesCached(network, tokens),
    loadTokenScores(network.name),
    buildTokenTxStats(network.name, [token], pools, markets, window.since, { restrictToProvidedSources: true }),
    loadTokenHoldersStats(network.name, [token.id]),
    getProtonTokenRegistryEntry(network, token.symbol, token.contract),
  ])
  const tokenStats = buildTokenStats([token], pools, markets, window.label, tokenTvlMap).get(token.id)
  const score = tokenScores?.[token.id] || null
  const firstSeenAt = tokenScores?.[token.id]?.firstSeenAt ?? null
  const holders = holdersStats.get(token.id) || null
  const tx = tokenTxStats.get(token.id) || { swapTx: 0, spotTx: 0 }
  const [fundamental, logoUrl] = await Promise.all([
    getFundamental(network, token, protonRegistryToken),
    getLogoUrl(network, token, protonRegistryToken),
  ])

  const priceMap = new Map<string, number>(tokens.map((t) => [t.id, getSafeUsdPrice(t)]))
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
      name: token.name || protonRegistryToken?.name || null,
      decimals: token.decimals,
      logo: logoUrl,
      logoUrl,
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
  const priceMap = new Map<string, number>(tokens.map((t) => [t.id, getSafeUsdPrice(t)]))
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
  const hasIncludeParam = typeof req.query.include !== 'undefined'
  const includes = parseIncludes(req.query.include)
  const includeTx = hasIncludeParam ? includes.has('tx') : true
  const includeDepth = hasIncludeParam ? includes.has('depth') : true
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
  const priceMap = new Map<string, number>(tokens.map((t) => [t.id, getSafeUsdPrice(t)]))

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
  const hasIncludeParam = typeof req.query.include !== 'undefined'
  const includes = parseIncludes(req.query.include)
  const includeTx = hasIncludeParam ? includes.has('tx') : true
  const includeDepth = hasIncludeParam ? includes.has('depth') : true
  const id = parseInt(String(req.params.id || ''), 10)

  if (!Number.isFinite(id)) return res.status(400).send('Invalid market id')

  const market = await Market.findOne({ chain: network.name, id }).lean()
  if (!market) return res.status(404).send('Market is not found')

  const tokens = (await getTokens(network.name)) || []
  const priceMap = new Map<string, number>(tokens.map((t) => [t.id, getSafeUsdPrice(t)]))

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
