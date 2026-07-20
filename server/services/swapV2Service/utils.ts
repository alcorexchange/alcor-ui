import { Pool, Token } from '@alcorexchange/alcor-swap-sdk'

import { getRedis } from '../redis'
import { SwapPool } from '../../models'

export async function poolInstanceFromMongoPool(poolMongo) {
  poolMongo = poolMongo.constructor.name === 'model' ? poolMongo.toObject() : poolMongo

  const ticksMap = await getRedisTicks(poolMongo.chain, poolMongo.id)
  // Извлекаем id из ключа Map и добавляем в объект тика
  const ticks: any[] = Array.from(ticksMap.entries()).map(([id, tick]) => ({ id, ...tick }))

  const { tokenA, tokenB } = poolMongo

  return new Pool({
    ...poolMongo,
    tokenA: new Token(tokenA.contract, tokenA.decimals, tokenA.symbol),
    tokenB: new Token(tokenB.contract, tokenB.decimals, tokenB.symbol),
    tickCurrent: poolMongo.tick,
    ticks
  })
}

export async function getPoolInstance(chain: string, id): Promise<Pool> {
  // Based on swap only, right now
  const pool = await SwapPool.findOne({ chain, id }).lean()
  if (!pool) return undefined

  return await poolInstanceFromMongoPool(pool)
}

export async function getPools(chain: string, fetchTicks = true, filterFunc = (p: any) => true) {
  const mongoPools = await SwapPool.find({ chain }).lean()

  const pools = []
  for (const p of mongoPools.filter(filterFunc)) {
    const ticksMap = fetchTicks ? await getRedisTicks(chain, p.id) : new Map()
    // Извлекаем id из ключа Map и добавляем в объект тика
    const ticks = Array.from(ticksMap.entries()).map(([id, tick]) => ({ id, ...tick }))

    pools.push(new Pool({
      id: p.id,
      active: p.active,
      tokenA: new Token(p.tokenA.contract, p.tokenA.decimals, p.tokenA.symbol),
      tokenB: new Token(p.tokenB.contract, p.tokenB.decimals, p.tokenB.symbol),
      fee: p.fee,
      sqrtPriceX64: p.sqrtPriceX64,
      liquidity: p.liquidity,
      ticks,
      tickCurrent: p.tick,
      feeGrowthGlobalAX64: p.feeGrowthGlobalAX64,
      feeGrowthGlobalBX64: p.feeGrowthGlobalBX64,
    }))
  }

  return pools
}

export async function getRedisTicks(chain: string, poolId: number | string) {
  const entries = await getRedis().get(`ticks_${chain}_${poolId}`)
  const plain = JSON.parse(entries || '[]') || []

  // Тики уже отсортированы при записи в setRedisTicks
  const ticks = entries ? new Map(plain) : new Map()
  return ticks
}

// Non-atomic reads (MongoDB pool + Redis ticks/positions) can cause SDK's subIn128
// to wrap around, producing astronomical fee values. Cap: fees should never exceed
// 100x the position's principal value (and at least $1B hard cap).
export function sanitizePositionFeesUSD(totalFeesUSD: number, positionValueUSD: number) {
  const maxSaneFees = Math.max(positionValueUSD * 100, 1_000_000_000)
  if (!Number.isFinite(totalFeesUSD) || totalFeesUSD < 0 || totalFeesUSD > maxSaneFees) return 0
  return totalFeesUSD
}

// Liquidity lock status of a redis position. lockedUntil is unix seconds (from the
// contract's locks table); expired lock rows stay on chain until the position is
// closed, so isLocked must be computed against current time on every read.
export function getPositionLockStatus(position) {
  const lockedUntil = Number(position?.lockedUntil) || null
  const isLocked = lockedUntil !== null && lockedUntil > Math.floor(Date.now() / 1000)
  return { lockedUntil, isLocked }
}

// Position's share of the pool's active liquidity, in percent (6 decimals precision).
// Out-of-range positions hold none of the active liquidity, so their share is 0.
export function calcPoolSharePct(poolLiquidityValue, posLiquidityValue, inRange: boolean) {
  if (!inRange) return 0

  let poolLiquidity: bigint
  let posLiquidity: bigint
  try {
    poolLiquidity = BigInt(String(poolLiquidityValue ?? 0))
    posLiquidity = BigInt(String(posLiquidityValue ?? 0))
  } catch (e) {
    return 0
  }
  if (poolLiquidity <= BigInt(0) || posLiquidity <= BigInt(0)) return 0

  // Percent with 6 decimals precision: 100 * 1e6 = 1e8
  const scaled = (posLiquidity * BigInt(100000000)) / poolLiquidity
  return Number(scaled) / 1000000
}

export function getPoolVolumeUSD(pool, days: number) {
  if (days === 1) return Number(pool?.volumeUSD24 ?? 0)
  if (days === 7) return Number(pool?.volumeUSDWeek ?? 0)
  if (days === 30) return Number(pool?.volumeUSDMonth ?? 0)
  return Number(pool?.volumeUSD24 ?? 0)
}

export function getPoolLpFeeRate(pool) {
  const feeRate = Number(pool?.fee ?? 0) / 1000000
  if (!Number.isFinite(feeRate) || feeRate <= 0) return 0
  return feeRate
}

// Projected LP fees for a position: pool volume over the period * LP fee rate * position share.
export function calcEstimatedFeesUSD(pool, poolSharePct, days = 1) {
  const volume = getPoolVolumeUSD(pool, days)
  const lpFeeRate = getPoolLpFeeRate(pool)
  const shareRate = Number(poolSharePct ?? 0) / 100

  if (!Number.isFinite(volume) || volume <= 0) return 0
  if (!Number.isFinite(lpFeeRate) || lpFeeRate <= 0) return 0
  if (!Number.isFinite(shareRate) || shareRate <= 0) return 0

  return Number((volume * lpFeeRate * shareRate).toFixed(4))
}

export async function getRedisPosition(chain, id) {
  const positions = JSON.parse(await getRedis().get(`positions_${chain}`) || '[]')
  return positions.find(p => p.id == id)
}
