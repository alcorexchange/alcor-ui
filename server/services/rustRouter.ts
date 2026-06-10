import fetch from 'cross-fetch'

// Rust route-finder service (alcor-router). Runs in Docker, bound to localhost.
// On the server it always listens on :1111. Override with ROUTER_SERVICE_URL.
const ROUTER_SERVICE_URL = process.env.ROUTER_SERVICE_URL || 'http://127.0.0.1:1111'

// Keep this tight: if the service is slow/unreachable we fall back to the
// in-process route enumeration, so we must not block getRoute for long.
const ROUTER_SERVICE_TIMEOUT = Number(process.env.ROUTER_SERVICE_TIMEOUT) || 1500

// Circuit breaker: after a network-level failure (timeout / connection error)
// skip calling the service for this cooldown, so we don't pay the full timeout
// on every request while it's down. Reachable-but-no-route responses (e.g. 404
// "chain not found", empty array) do NOT trip it — the service is alive.
const ROUTER_BREAKER_COOLDOWN = Number(process.env.ROUTER_SERVICE_COOLDOWN) || 5000
let breakerOpenUntil = 0

// Canary rollout: only route this fraction of requests (0..1) through Rust; the
// rest fall straight back to the legacy path. Set to 1 for full traffic, 0 to
// disable. Defaults to 0.2 (20%) while we validate the service in production.
const ROUTER_SERVICE_SAMPLE_RATE = process.env.ROUTER_SERVICE_SAMPLE_RATE !== undefined
  ? Number(process.env.ROUTER_SERVICE_SAMPLE_RATE)
  : 0.2

export interface RustRoute {
  poolIds: number[]
  tokenPath: string[]
}

interface RustQuote {
  route: RustRoute
  amountIn: string
  amountOut: string
}

/**
 * Ask the Rust router for the best candidate routes (poolIds + tokenPath only).
 * Returns null when the service is unreachable, errors, or finds nothing — the
 * caller then falls back to the legacy in-process route enumeration.
 */
export async function fetchRustRoutes({
  chain,
  tokenIn,
  tokenOut,
  amount,
  exactIn,
  maxHops = 3,
  maxResults = 3,
  marketFee = 0,
}: {
  chain: string
  tokenIn: string
  tokenOut: string
  amount: string
  exactIn: boolean
  maxHops?: number
  maxResults?: number
  marketFee?: number
}): Promise<RustRoute[] | null> {
  // Canary: send only a sampled fraction of traffic to Rust, rest go legacy.
  if (Math.random() >= ROUTER_SERVICE_SAMPLE_RATE) return null

  // Breaker open: service is known-down, skip it and fall back immediately.
  if (Date.now() < breakerOpenUntil) return null

  const endpoint = exactIn ? '/quote/exact-in' : '/quote/exact-out'

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ROUTER_SERVICE_TIMEOUT)

  try {
    const res = await fetch(ROUTER_SERVICE_URL + endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chain, tokenIn, tokenOut, amount, maxHops, maxResults, marketFee }),
      signal: controller.signal,
    })

    if (!res.ok) return null

    const quotes: RustQuote[] = await res.json()
    if (!Array.isArray(quotes) || quotes.length === 0) return null

    return quotes.map(q => q.route).filter(r => r && Array.isArray(r.poolIds) && r.poolIds.length > 0)
  } catch (e) {
    // Network-level failure (timeout / connection refused): trip the breaker so
    // the next requests fall back instantly instead of waiting out the timeout.
    breakerOpenUntil = Date.now() + ROUTER_BREAKER_COOLDOWN
    console.log(`rust router unavailable, falling back for ${ROUTER_BREAKER_COOLDOWN}ms:`, e.message)
    return null
  } finally {
    clearTimeout(timer)
  }
}
