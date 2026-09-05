import { Position as PositionClass } from '@alcorexchange/alcor-swap-sdk'

import { SwapPool } from '../../models'
import { getRedis } from '../redis'
import { getSwrPayload } from '../swrCache'
import { poolInstanceFromMongoPool, getPositionLockStatus } from '../swapV2Service/utils'

// Locked liquidity per token.
//
// The swap contract lets an LP lock a position until a given time (contract's
// `locks` table, mirrored onto redis positions as `lockedUntil`). A locked
// position can't be burned, so the tokens behind it are stuck in the pool until
// it unlocks — that is what token cards report as `liquidity.locked`.
//
// The snapshot is price-free (token amounts only): each endpoint values it with
// the price map it already uses (safe price for lists, raw price for details).

const LOCKED_LIQUIDITY_SWR_FRESH_MS = 60 * 1000
const LOCKED_LIQUIDITY_SWR_STALE_MS = 60 * 60 * 1000

export type TokenLockedAmount = {
  // Token units locked across every locked position holding this token
  amount: number
  positions: number
  // Unix seconds: when the first lock expires and when the last one does
  nextUnlockAt: number
  lastUnlockAt: number
}

export type LockedLiquidityCard = {
  amount: number
  usd: number
  positions: number
  // Percent of the token's TVL that sits in locked positions
  share: number
  nextUnlockAt: number | null
  lastUnlockAt: number | null
}

const EMPTY_CARD: LockedLiquidityCard = {
  amount: 0,
  usd: 0,
  positions: 0,
  share: 0,
  nextUnlockAt: null,
  lastUnlockAt: null,
}

function addLocked(
  tokens: Map<string, TokenLockedAmount & { decimals: number }>,
  tokenId: string,
  decimals: number,
  amount: number,
  unlockAt: number
) {
  if (!tokenId || !Number.isFinite(amount) || amount <= 0) return

  const entry = tokens.get(tokenId) || {
    amount: 0,
    positions: 0,
    nextUnlockAt: unlockAt,
    lastUnlockAt: unlockAt,
    decimals,
  }

  entry.amount += amount
  entry.positions += 1
  entry.nextUnlockAt = Math.min(entry.nextUnlockAt, unlockAt)
  entry.lastUnlockAt = Math.max(entry.lastUnlockAt, unlockAt)

  tokens.set(tokenId, entry)
}

async function buildLockedLiquidity(chain: string) {
  const positions = JSON.parse(await getRedis().get(`positions_${chain}`) || '[]')

  const lockedByPool = new Map<number, any[]>()
  for (const position of positions) {
    if (!getPositionLockStatus(position).isLocked) continue
    const poolId = Number(position.pool)
    if (!lockedByPool.has(poolId)) lockedByPool.set(poolId, [])
    lockedByPool.get(poolId).push(position)
  }

  const tokens = new Map<string, TokenLockedAmount & { decimals: number }>()
  if (lockedByPool.size === 0) return { tokens: {}, positionsTotal: 0 }

  const mongoPools = await SwapPool.find({ chain, id: { $in: [...lockedByPool.keys()] } }).lean()

  let positionsTotal = 0
  let failed = 0

  for (const mongoPool of mongoPools) {
    let poolInstance
    try {
      poolInstance = await poolInstanceFromMongoPool(mongoPool)
    } catch (e) {
      failed += lockedByPool.get(mongoPool.id).length
      continue
    }

    for (const plainPosition of lockedByPool.get(mongoPool.id)) {
      try {
        const position = new PositionClass({ ...plainPosition, pool: poolInstance })
        const unlockAt = Number(plainPosition.lockedUntil)

        addLocked(tokens, mongoPool.tokenA.id, mongoPool.tokenA.decimals,
          parseFloat(position.amountA.toFixed()), unlockAt)
        addLocked(tokens, mongoPool.tokenB.id, mongoPool.tokenB.decimals,
          parseFloat(position.amountB.toFixed()), unlockAt)

        positionsTotal += 1
      } catch (e) {
        failed += 1
      }
    }
  }

  if (failed > 0) console.warn(`[${chain}] locked liquidity: failed to process ${failed} positions`)

  const serialized = {}
  for (const [tokenId, entry] of tokens) {
    serialized[tokenId] = {
      amount: Number(entry.amount.toFixed(entry.decimals)),
      positions: entry.positions,
      nextUnlockAt: entry.nextUnlockAt,
      lastUnlockAt: entry.lastUnlockAt,
    }
  }

  return { tokens: serialized, positionsTotal }
}

export async function getLockedLiquidityByToken(chain: string): Promise<Map<string, TokenLockedAmount>> {
  // Locked amounts are an extra on token cards — a failure here reports zero
  // locked liquidity instead of taking the whole token response down.
  try {
    const snapshot = await getSwrPayload(
      `${chain}_locked_liquidity_v1`,
      () => buildLockedLiquidity(chain),
      LOCKED_LIQUIDITY_SWR_FRESH_MS,
      LOCKED_LIQUIDITY_SWR_STALE_MS
    )

    return new Map<string, TokenLockedAmount>(Object.entries(snapshot?.tokens || {}))
  } catch (e) {
    console.error(`[${chain}] locked liquidity build failed:`, e?.message || e)
    return new Map<string, TokenLockedAmount>()
  }
}

export function buildLockedLiquidityCard(
  entry: TokenLockedAmount | undefined,
  priceUsd: number,
  tvlUsd: number
): LockedLiquidityCard {
  if (!entry || !(entry.amount > 0)) return EMPTY_CARD

  const usd = entry.amount * (Number(priceUsd) || 0)
  const share = tvlUsd > 0 ? (usd / tvlUsd) * 100 : 0

  return {
    amount: entry.amount,
    usd: Number(usd.toFixed(4)),
    positions: entry.positions,
    share: Number(share.toFixed(2)),
    nextUnlockAt: entry.nextUnlockAt,
    lastUnlockAt: entry.lastUnlockAt,
  }
}
