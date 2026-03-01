import { getRedis } from './redis'
import { fetchProtonTokenRegistryRowsWharfkit } from './protonTokenRegistryWharfkit'

const PROTON_NETWORK = 'proton'
const TOKEN_REGISTRY_CACHE_KEY = 'proton_token_registry_tokens_v1'
const TOKEN_REGISTRY_CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour
const TOKEN_REGISTRY_FAILURE_COOLDOWN_MS = 1000 * 60 * 10 // 10 minutes
const TOKEN_REGISTRY_FAILURE_LOG_THROTTLE_MS = 1000 * 60 // 1 minute
const TOKEN_REGISTRY_SKIPPED_SAMPLE_SIZE = 5

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
let lastRegistryFailureAt = 0
let lastRegistryFailureLogAt = 0

function isMalformedSymbolError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase()
  if (!message) return false

  return (
    message.includes('error unpacking eosio::chain::symbol') ||
    message.includes("unable to unpack built-in type 'symbol'") ||
    (message.includes('precision') && message.includes('<= 18') && message.includes('symbol'))
  )
}

function shouldLogRegistryFailure(now: number): boolean {
  if (now - lastRegistryFailureLogAt < TOKEN_REGISTRY_FAILURE_LOG_THROTTLE_MS) return false
  lastRegistryFailureLogAt = now
  return true
}

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
  const { rows, skipped } = await fetchProtonTokenRegistryRowsWharfkit(network)

  if (skipped.length > 0) {
    const sample = skipped
      .slice(0, TOKEN_REGISTRY_SKIPPED_SAMPLE_SIZE)
      .map((row) => `${row.id || '?'}:${row.contract || '?'}:${row.symbolRaw || '?'} (${row.reason})`)
      .join(', ')

    console.warn(`[proton] skipped ${skipped.length} malformed token.proton::tokens rows${sample ? ` | sample: ${sample}` : ''}`)
  }

  return rows
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

  // Registry table on Proton occasionally contains malformed symbol rows.
  // Treat this source as optional and back off refresh attempts for a while.
  const onFailureCooldown = (now - lastRegistryFailureAt) < TOKEN_REGISTRY_FAILURE_COOLDOWN_MS
  if (onFailureCooldown) return inMemoryEntries

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
        lastRegistryFailureAt = now

        if (isMalformedSymbolError(e)) {
          if (shouldLogRegistryFailure(now)) {
            const cooldownMinutes = Math.round(TOKEN_REGISTRY_FAILURE_COOLDOWN_MS / (60 * 1000))
            console.warn(
              `[proton] token.proton::tokens contains malformed symbol rows; pausing registry refresh for ${cooldownMinutes}m:`,
              e.message
            )
          }
        } else if (shouldLogRegistryFailure(now)) {
          console.error('[proton] failed to fetch token.proton::tokens:', e.message)
        }

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
