import crypto from 'node:crypto'

import { getRedis } from '../redis'

// Who is asking, and how often they have asked.
//
// The window slides: a calendar day would let anyone take one batch at 23:59 and
// another at 00:01. Hits live in a Redis sorted set scored by timestamp, so
// expiry is just dropping everything older than the window.

const PREFIX = 'wire-faucet'

/**
 * A client's IP, as far as it can be trusted.
 *
 * The service binds to loopback and nginx rewrites (never appends to)
 * X-Forwarded-For with the one address it resolved, so the header cannot be
 * spoofed from outside. IPv6 is counted by /64: a client is normally handed the
 * whole prefix, and per-address counting is bypassed by changing one hextet.
 */
export function clientIp(req: any): string {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  const raw = forwarded || req.socket.remoteAddress || ''
  const ip = raw.replace(/^::ffff:/, '').split('%')[0]

  return ip.includes(':') ? v6Prefix(ip) : ip
}

function v6Prefix(ip: string): string {
  const [head, tail = ''] = ip.split('::')
  const left = head ? head.split(':') : []
  const right = tail ? tail.split(':') : []
  const gap = Array(Math.max(0, 8 - left.length - right.length)).fill('0')

  return [...left, ...gap, ...right]
    .slice(0, 4)
    .map((group) => group.padStart(4, '0'))
    .join(':')
}

export type Limit = { bucket: string; id: string; max: number }

/**
 * The first limit in `limits` that is already used up, or null when all have room.
 * Nothing is recorded here — a slot is only spent once the chain accepted the work.
 */
export async function exhausted(limits: Limit[], windowMs: number): Promise<Limit | null> {
  const redis = getRedis()

  for (const limit of limits) {
    const key = redisKey(limit)
    await redis.zRemRangeByScore(key, 0, Date.now() - windowMs)
    if (await redis.zCard(key) >= limit.max) return limit
  }

  return null
}

export async function record(limits: Limit[], windowMs: number): Promise<void> {
  const redis = getRedis()
  const now = Date.now()

  for (const limit of limits) {
    const key = redisKey(limit)
    // Random member: two hits within the same millisecond must both count.
    await redis.zAdd(key, [{ score: now, value: crypto.randomUUID() }])
    await redis.pExpire(key, windowMs)
  }
}

function redisKey({ bucket, id }: Limit): string {
  return `${PREFIX}:${bucket}:${id}`
}
