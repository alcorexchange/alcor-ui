import { fetchAllRows, getChainRpc } from '../../utils/eosjs'

// On-chain token metadata registry (token_registry contract, `tokens` table).
// The contract account is configured per network as `network.tokenRegistry`.
// The whole table is small, so we pull it in one paginated pass and cache it.

const REGISTRY_TABLE = 'tokens'
const CACHE_TTL_MS = 1000 * 60 * 5 // 5 minutes
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'
const ARWEAVE_GATEWAY = 'https://arweave.net/'

type RegistryRow = {
  id?: number
  token_contract?: string
  symbol?: string // e.g. "4,LEAF"
  image_url?: string
  blacklisted?: number | boolean
  verified?: number | boolean
}

type RegistryEntry = {
  symbol: string // symbol code, upper-cased
  contract: string
  imageUrl: string | null
  blacklisted: boolean
  verified: boolean
}

// Per-network cache: network name -> { fetchedAt, entries }
const cache = new Map<string, { fetchedAt: number; entries: Map<string, RegistryEntry> }>()
const refreshPromises = new Map<string, Promise<Map<string, RegistryEntry>>>()

function symbolCode(rawSymbol: any): string {
  const [, code = rawSymbol] = String(rawSymbol || '').split(',')
  return String(code || '').trim().toUpperCase()
}

function entryKey(symbol: string, contract: string): string {
  return `${symbol.toUpperCase()}@${contract}`
}

function toBool(value: any): boolean {
  return value === true || value === 1 || value === '1'
}

// Resolve a stored image_url (https:// | ipfs:// | ar://) to a fetchable https URL.
function resolveImageUrl(rawUrl: any): string | null {
  const url = String(rawUrl || '').trim()
  if (!url) return null

  if (url.startsWith('ipfs://')) {
    const cid = url.slice('ipfs://'.length).replace(/^ipfs\//, '')
    return cid ? PINATA_GATEWAY + cid : null
  }
  if (url.startsWith('ar://')) {
    const hash = url.slice('ar://'.length)
    return hash ? ARWEAVE_GATEWAY + hash : null
  }
  if (url.startsWith('https://')) return url

  return null
}

function normalizeRow(row: RegistryRow): RegistryEntry | null {
  const symbol = symbolCode(row.symbol)
  const contract = String(row.token_contract || '').trim()
  if (!symbol || !contract) return null

  return {
    symbol,
    contract,
    imageUrl: resolveImageUrl(row.image_url),
    blacklisted: toBool(row.blacklisted),
    verified: toBool(row.verified),
  }
}

async function fetchEntries(network: any): Promise<Map<string, RegistryEntry>> {
  const contract = network.tokenRegistry
  const rpc = getChainRpc(network.name)

  const rows: RegistryRow[] = await fetchAllRows(
    rpc,
    { code: contract, scope: contract, table: REGISTRY_TABLE, limit: 1000 },
    'id'
  )

  const entries = new Map<string, RegistryEntry>()
  for (const row of rows) {
    const entry = normalizeRow(row)
    if (!entry) continue
    entries.set(entryKey(entry.symbol, entry.contract), entry)
  }

  return entries
}

async function getEntries(network: any): Promise<Map<string, RegistryEntry>> {
  const name = network.name
  const now = Date.now()

  const cached = cache.get(name)
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) return cached.entries

  if (!refreshPromises.has(name)) {
    const promise = (async () => {
      let entries: Map<string, RegistryEntry>
      try {
        entries = await fetchEntries(network)
      } catch (e: any) {
        console.error(`[${name}] failed to fetch token registry (${network.tokenRegistry}):`, e?.message || e)
        entries = cached?.entries ?? new Map()
      }

      // Always stamp fetchedAt so failures back off for a full TTL instead of hammering RPC.
      cache.set(name, { fetchedAt: Date.now(), entries })
      return entries
    })().finally(() => {
      refreshPromises.delete(name)
    })

    refreshPromises.set(name, promise)
  }

  return await refreshPromises.get(name)!
}

// Returns a fetchable logo URL from the on-chain registry, or null when there is
// no (non-blacklisted) entry with an image for this token.
export async function getTokenRegistryLogo(
  network: any,
  symbol: string,
  contract: string
): Promise<string | null> {
  if (!network?.tokenRegistry) return null

  const symbolNorm = String(symbol || '').trim().toUpperCase()
  const contractNorm = String(contract || '').trim()
  if (!symbolNorm || !contractNorm) return null

  const entries = await getEntries(network)
  const entry = entries.get(entryKey(symbolNorm, contractNorm))

  if (!entry || entry.blacklisted || !entry.imageUrl) return null
  return entry.imageUrl
}
