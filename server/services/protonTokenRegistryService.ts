import { fetchAllRows } from '../../utils/eosjs'
import { getFailOverAlcorOnlyRpc } from '../utils'
import { getRedis } from './redis'

const PROTON_NETWORK = 'proton'
const TOKEN_REGISTRY_CONTRACT = 'token.proton'
const TOKEN_REGISTRY_TABLE = 'tokens'
const TOKEN_REGISTRY_CACHE_KEY = 'proton_token_registry_tokens_v1'
const TOKEN_REGISTRY_CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour

type ProtonTokenRegistryRow = {
  id?: number | string
  tcontract?: string
  tname?: string
  url?: string
  desc?: string
  iconurl?: string
  symbol?: string
  blisted?: boolean | number | string
}

export type ProtonTokenRegistryEntry = {
  id: string
  symbol: string
  contract: string
  name: string | null
  url: string | null
  description: string | null
  iconUrl: string | null
  blacklisted: boolean
}

let inMemoryFetchedAt = 0
let inMemoryEntries = new Map<string, ProtonTokenRegistryEntry>()
let refreshPromise: Promise<Map<string, ProtonTokenRegistryEntry>> | null = null

function normalizeSymbol(rawSymbol: any): string | null {
  if (typeof rawSymbol !== 'string') return null
  const cleaned = rawSymbol.trim()
  if (!cleaned) return null

  const [, symbolCode = cleaned] = cleaned.split(',')
  const symbol = String(symbolCode || '').trim().toUpperCase()
  return symbol || null
}

function normalizeContract(contract: any): string | null {
  const value = String(contract || '').trim()
  return value || null
}

function normalizeHttpUrl(rawUrl: any): string | null {
  const value = String(rawUrl || '').trim()
  if (!value) return null
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return null
}

function toBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  const normalized = String(value || '').toLowerCase().trim()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

function getMapKey(symbol: string, contract: string) {
  return `${symbol.toUpperCase()}@${contract}`
}

function normalizeEntry(row: ProtonTokenRegistryRow): ProtonTokenRegistryEntry | null {
  const symbol = normalizeSymbol(row.symbol)
  const contract = normalizeContract(row.tcontract)
  if (!symbol || !contract) return null

  return {
    id: String(row.id ?? ''),
    symbol,
    contract,
    name: String(row.tname || '').trim() || null,
    url: normalizeHttpUrl(row.url),
    description: String(row.desc || '').trim() || null,
    iconUrl: normalizeHttpUrl(row.iconurl),
    blacklisted: toBoolean(row.blisted),
  }
}

function mapFromRows(rows: ProtonTokenRegistryRow[]) {
  const mapped = new Map<string, ProtonTokenRegistryEntry>()

  for (const row of rows) {
    const entry = normalizeEntry(row)
    if (!entry) continue
    mapped.set(getMapKey(entry.symbol, entry.contract), entry)
  }

  return mapped
}

async function readRedisCache() {
  const redis = getRedis()
  try {
    const raw = await redis.get(TOKEN_REGISTRY_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const fetchedAt = Number(parsed?.fetchedAt || 0)
    const rows = Array.isArray(parsed?.rows) ? parsed.rows : []

    return {
      fetchedAt,
      map: mapFromRows(rows),
    }
  } catch (e) {
    return null
  }
}

async function writeRedisCache(rows: ProtonTokenRegistryRow[], fetchedAt: number) {
  const redis = getRedis()
  try {
    await redis.set(
      TOKEN_REGISTRY_CACHE_KEY,
      JSON.stringify({ fetchedAt, rows })
    )
  } catch (e) {
    console.error('[proton] failed to save token.proton cache:', e.message)
  }
}

async function fetchRegistryRows(network: any): Promise<ProtonTokenRegistryRow[]> {
  const rpc = getFailOverAlcorOnlyRpc(network)

  return await fetchAllRows(rpc, {
    code: TOKEN_REGISTRY_CONTRACT,
    scope: TOKEN_REGISTRY_CONTRACT,
    table: TOKEN_REGISTRY_TABLE,
    limit: 1000,
  })
}

async function refreshInMemory(network: any) {
  const fetchedAt = Date.now()
  const rows = await fetchRegistryRows(network)
  const mapped = mapFromRows(rows)

  if (mapped.size > 0) {
    inMemoryEntries = mapped
    inMemoryFetchedAt = fetchedAt
    writeRedisCache(rows, fetchedAt)
  }

  return inMemoryEntries
}

async function getRegistryMap(network: any): Promise<Map<string, ProtonTokenRegistryEntry>> {
  if (!network || network.name !== PROTON_NETWORK) return new Map()

  const now = Date.now()
  const isMemoryFresh = inMemoryEntries.size > 0 && (now - inMemoryFetchedAt) < TOKEN_REGISTRY_CACHE_TTL_MS
  if (isMemoryFresh) return inMemoryEntries

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const redisCached = await readRedisCache()
      const isRedisFresh = redisCached &&
        redisCached.map.size > 0 &&
        (now - redisCached.fetchedAt) < TOKEN_REGISTRY_CACHE_TTL_MS

      if (isRedisFresh) {
        inMemoryEntries = redisCached.map
        inMemoryFetchedAt = redisCached.fetchedAt
        return inMemoryEntries
      }

      try {
        return await refreshInMemory(network)
      } catch (e) {
        console.error('[proton] failed to fetch token.proton::tokens:', e.message)

        if (redisCached && redisCached.map.size > 0) {
          inMemoryEntries = redisCached.map
          inMemoryFetchedAt = redisCached.fetchedAt || now
          return inMemoryEntries
        }

        return inMemoryEntries
      }
    })().finally(() => {
      refreshPromise = null
    })
  }

  return await refreshPromise
}

export async function getProtonTokenRegistryEntry(
  network: any,
  symbol: string,
  contract: string,
  includeBlacklisted = true
): Promise<ProtonTokenRegistryEntry | null> {
  if (!network || network.name !== PROTON_NETWORK) return null

  const symbolNormalized = String(symbol || '').trim().toUpperCase()
  const contractNormalized = String(contract || '').trim()
  if (!symbolNormalized || !contractNormalized) return null

  const map = await getRegistryMap(network)
  const item = map.get(getMapKey(symbolNormalized, contractNormalized)) || null
  if (!item) return null

  if (!includeBlacklisted && item.blacklisted) return null
  return item
}
