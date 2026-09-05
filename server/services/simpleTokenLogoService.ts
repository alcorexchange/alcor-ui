import { fetchAllRows, getChainRpc } from '../../utils/eosjs'

const PROTON_NETWORK = 'proton'
const SIMPLETOKEN_CONTRACT = 'simpletoken'
const SIMPLELAUNCH_CONTRACT = 'simplelaunch'
const SIMPLELAUNCH_CURVES_TABLE = 'curves'
const SIMPLETOKEN_LOGOS_CACHE_TTL_MS = 1000 * 60 * 30 // 30 minutes

type SimpleLaunchCurveRow = {
  symbol?: string
  imageUrl?: string
}

let inMemoryFetchedAt = 0
let inMemoryBySymbolRaw = new Map<string, string>()
let inMemoryBySymbolCode = new Map<string, string>()
let refreshPromise: Promise<{
  bySymbolRaw: Map<string, string>
  bySymbolCode: Map<string, string>
}> | null = null

function normalizeString(value: any): string {
  return String(value || '').trim()
}

function normalizeSymbolRaw(value: any): string {
  return normalizeString(value).toUpperCase()
}

function normalizeSymbolCode(rawSymbol: string): string {
  const [, symbolCode = rawSymbol] = rawSymbol.split(',')
  return normalizeString(symbolCode).toUpperCase()
}

function normalizeLogoUrl(value: any): string | null {
  const url = normalizeString(value)
  if (!url) return null
  return url
}

function parsePrecision(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number.parseInt(String(value), 10)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return parsed
}

async function fetchSimpleLaunchCurvesRows(): Promise<SimpleLaunchCurveRow[]> {
  const rpc = getChainRpc(PROTON_NETWORK)
  return await fetchAllRows(
    rpc,
    {
      code: SIMPLELAUNCH_CONTRACT,
      scope: SIMPLELAUNCH_CONTRACT,
      table: SIMPLELAUNCH_CURVES_TABLE,
      limit: 500,
    },
    'id'
  )
}

async function getSimpleTokenLogoMaps() {
  const now = Date.now()
  const isFresh = inMemoryBySymbolRaw.size > 0 && (now - inMemoryFetchedAt) < SIMPLETOKEN_LOGOS_CACHE_TTL_MS
  if (isFresh) {
    return {
      bySymbolRaw: inMemoryBySymbolRaw,
      bySymbolCode: inMemoryBySymbolCode,
    }
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const rows = await fetchSimpleLaunchCurvesRows()
        const bySymbolRaw = new Map<string, string>()
        const bySymbolCode = new Map<string, string>()

        for (const row of rows) {
          const symbolRaw = normalizeSymbolRaw(row?.symbol)
          const logoUrl = normalizeLogoUrl(row?.imageUrl)
          if (!symbolRaw || !logoUrl) continue

          bySymbolRaw.set(symbolRaw, logoUrl)

          const symbolCode = normalizeSymbolCode(symbolRaw)
          if (symbolCode && !bySymbolCode.has(symbolCode)) {
            bySymbolCode.set(symbolCode, logoUrl)
          }
        }

        if (bySymbolRaw.size > 0) {
          inMemoryBySymbolRaw = bySymbolRaw
          inMemoryBySymbolCode = bySymbolCode
          inMemoryFetchedAt = now
        }
      } catch (e: any) {
        console.error('[proton] failed to fetch simplelaunch::curves logos:', e?.message || e)
      }

      return {
        bySymbolRaw: inMemoryBySymbolRaw,
        bySymbolCode: inMemoryBySymbolCode,
      }
    })().finally(() => {
      refreshPromise = null
    })
  }

  return await refreshPromise
}

export async function getSimpleTokenLogoUrl(network: any, token: {
  symbol?: string
  contract?: string
  decimals?: number | string
  precision?: number | string
}): Promise<string | null> {
  const networkName = normalizeString(network?.name).toLowerCase()
  if (networkName !== PROTON_NETWORK) return null

  const contract = normalizeString(token?.contract).toLowerCase()
  if (contract !== SIMPLETOKEN_CONTRACT) return null

  const symbolCode = normalizeSymbolCode(normalizeString(token?.symbol))
  if (!symbolCode) return null

  const { bySymbolRaw, bySymbolCode } = await getSimpleTokenLogoMaps()

  const precision = parsePrecision(token?.decimals ?? token?.precision)
  if (precision !== null) {
    const symbolRaw = `${precision},${symbolCode}`
    return bySymbolRaw.get(symbolRaw) || bySymbolCode.get(symbolCode) || null
  }

  return bySymbolCode.get(symbolCode) || null
}
