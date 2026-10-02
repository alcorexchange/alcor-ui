// Shared bits of the CoinMarketCap / CoinGecko ticker feeds (spot.js, ammFeed.ts).
//
// Spec: "CoinGecko Integration Ideal API Endpoints"
// https://docs.google.com/document/d/1v27QFoQq1SKT3Priq3aqPgB70Xd_PnDzbOCiuoCyixw/edit

type Network = { name: string, alcorSlug?: string }
type Kind = 'spot' | 'swap'

// Public market page, handed over as the ticker's `trade_url`.
// The current frontend lives at alcor.exchange/v/<alcorSlug>/<kind>/<ticker_id>;
// chains without an `alcorSlug` in config.js keep their legacy per-chain host.
export function marketUrl(network: Network, kind: Kind, ticker_id: string): string {
  if (!network.alcorSlug) return `https://${network.name}.alcor.exchange/trade/${ticker_id}`

  return `https://alcor.exchange/v/${network.alcorSlug}/${kind}/${ticker_id}`
}

// CoinMarketCap UCID of a token, from the explicit map in config.js.
export function cmcUcid(network: { CMC_IDS: { [tokenId: string]: number } }, tokenId: string): number | null {
  return network.CMC_IDS[tokenId] || null
}

// Unified pair name for CMC, e.g. "USDT-WAX". Only for pairs of two tokens CMC knows.
export function globalTickerId(network: { CMC_IDS: { [tokenId: string]: number } }, base: string, target: string): string | null {
  if (!cmcUcid(network, base) || !cmcUcid(network, target)) return null

  return base.split('-')[0].toUpperCase() + '-' + target.split('-')[0].toUpperCase()
}

// `start_time` / `end_time` are unix seconds per the spec. Returns a mongo range
// for the `time` field, or `null` when the caller asked for no bounds.
export function parseTimeRange(query: { start_time?: any, end_time?: any }): { range?: any, error?: string } {
  const bounds: [string, any, string][] = [
    ['start_time', query.start_time, '$gte'],
    ['end_time', query.end_time, '$lte'],
  ]

  const range = {}
  for (const [name, value, operator] of bounds) {
    if (value === undefined) continue

    const seconds = parseInt(value)
    if (isNaN(seconds)) return { error: `Invalid ${name}, expected unix seconds` }

    range[operator] = new Date(seconds * 1000)
  }

  return { range: Object.keys(range).length > 0 ? range : null }
}

// CoinGecko polls with limit = [0, 200, 500...] where 0 means "full history".
// We cap it instead: the full history of a busy market is megabytes of JSON.
const DEFAULT_TRADES = 200
const MAX_TRADES = 1000

export function parseTradesLimit(limit: any): number {
  if (limit === undefined) return DEFAULT_TRADES

  const parsed = parseInt(limit)
  if (isNaN(parsed) || parsed <= 0) return MAX_TRADES

  return Math.min(parsed, MAX_TRADES)
}
