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

export async function getRedisPosition(chain, id) {
  const positions = JSON.parse(await getRedis().get(`positions_${chain}`) || '[]')
  return positions.find(p => p.id == id)
}
