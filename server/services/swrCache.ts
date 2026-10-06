import { getRedis } from './redis'

// Shared stale-while-revalidate cache used by heavy read endpoints.
//
// Two cost centers are eliminated on the hot path:
//   1. Mongo work — `build()` runs at most once per fresh window; stale reads
//      are served instantly while a single worker refreshes in the background.
//   2. Serialization — `getSwrString()` caches the already-stringified body, so
//      large JSON payloads (swap/pools ~10MB, analytics/tokens ~1MB) are
//      JSON.stringify'd once per refresh instead of once per request. Routes
//      send the cached string raw via `res.type('application/json').send(str)`,
//      avoiding both JSON.parse (Redis read) and JSON.stringify (res.json).

const SWR_LOCK_TTL_SECONDS = 120
const SWR_WAIT_MS = 12000
const SWR_LOCAL_CACHE_MAX = 300

export type SwrEnvelope<T> = {
  ts: number
  payload: T
}

function safeNumber(value: any, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function buildSwrLockKey(cacheKey: string) {
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
      EX: SWR_LOCK_TTL_SECONDS,
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

async function waitForSwrEnvelope<T>(cacheKey: string, timeoutMs = SWR_WAIT_MS) {
  const startedAt = Date.now()
  while ((Date.now() - startedAt) < timeoutMs) {
    const cached = await readSwrEnvelope<T>(cacheKey)
    if (cached) return cached
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  return null
}

// Process-local cache of the already-parsed SWR payload. Reading a large
// payload from Redis costs a JSON.parse on every request (the /tokens heavy
// payload is ~1MB); under the bot upstream's request volume that pins Node CPU.
// This memo lets each worker parse a hot key at most once per fresh window.
const swrLocalCache = new Map<string, { ts: number; payload: any }>()

function readLocalSwr<T>(cacheKey: string, freshMs: number): T | null {
  const entry = swrLocalCache.get(cacheKey)
  if (!entry) return null
  if (Date.now() - entry.ts > freshMs) return null
  // refresh LRU position
  swrLocalCache.delete(cacheKey)
  swrLocalCache.set(cacheKey, entry)
  return entry.payload as T
}

function writeLocalSwr(cacheKey: string, ts: number, payload: any) {
  swrLocalCache.delete(cacheKey)
  swrLocalCache.set(cacheKey, { ts, payload })
  while (swrLocalCache.size > SWR_LOCAL_CACHE_MAX) {
    const oldest = swrLocalCache.keys().next().value
    swrLocalCache.delete(oldest)
  }
}

export async function getSwrPayload<T>(
  cacheKey: string,
  build: () => Promise<T>,
  freshMs: number,
  staleMs: number
): Promise<T> {
  // Fast path: serve a process-local parsed payload without touching Redis.
  const local = readLocalSwr<T>(cacheKey, freshMs)
  if (local !== null) return local

  const now = Date.now()
  const lockKey = buildSwrLockKey(cacheKey)
  const cached = await readSwrEnvelope<T>(cacheKey)
  if (cached) writeLocalSwr(cacheKey, cached.ts, cached.payload)

  const refreshInBackground = async () => {
    let token: string | null = null
    try {
      token = await tryAcquireSwrLock(lockKey)
      if (!token) return
      const payload = await build()
      await writeSwrEnvelope(cacheKey, payload, staleMs)
      writeLocalSwr(cacheKey, Date.now(), payload)
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
      writeLocalSwr(cacheKey, Date.now(), payload)
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
  if (warmed) {
    writeLocalSwr(cacheKey, warmed.ts, warmed.payload)
    return warmed.payload
  }

  token = await tryAcquireSwrLock(lockKey)
  if (token) {
    try {
      const payload = await build()
      await writeSwrEnvelope(cacheKey, payload, staleMs)
      writeLocalSwr(cacheKey, Date.now(), payload)
      return payload
    } finally {
      await releaseSwrLock(lockKey, token)
    }
  }

  const fallback = await readSwrEnvelope<T>(cacheKey)
  if (fallback) return fallback.payload

  return await build()
}

// SWR cache whose payload is the serialized JSON string. `build` returns the
// object to send; it is JSON.stringify'd exactly once per refresh and the
// string is cached. The route sends the returned string raw, so the hot path
// does zero parse and zero stringify regardless of payload size.
export function getSwrString(
  cacheKey: string,
  build: () => Promise<any>,
  freshMs: number,
  staleMs: number
): Promise<string> {
  return getSwrPayload<string>(
    cacheKey,
    async () => JSON.stringify(await build()),
    freshMs,
    staleMs
  )
}
