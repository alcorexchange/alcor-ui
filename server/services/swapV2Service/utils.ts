import { createClient } from 'redis'
import { SwapPool } from '../../models'

import { Pool } from '../../../assets/libs/swap-sdk/entities/pool'
import { Token } from '../../../assets/libs/swap-sdk/entities/token'

const redis = createClient()

export async function getPoolInstance(chain: string, id) {
  // Based on swap only, right now
  const pool = await SwapPool.findOne({ chain, id }).lean()
  if (!pool) return undefined

  const ticks: any[] = Array.from((await getRedisTicks(chain, id)).values())
  ticks.sort((a, b) => a.id - b.id)

  const { tokenA, tokenB } = pool

  return new Pool({
    ...pool,
    tokenA: new Token(tokenA.contract, tokenA.decimals, tokenA.symbol, tokenA.symbol.toLowerCase() + '-' + tokenA.contract),
    tokenB: new Token(tokenB.contract, tokenB.decimals, tokenB.symbol, tokenB.symbol.toLowerCase() + '-' + tokenB.contract),
    tickCurrent: pool.tick,
    ticks
  })
}

export async function getPools(chain: string) {
  // Based on swap only, right now
  const pools = await SwapPool.find({ chain }).lean()

  return pools.map(pool => {
    const { tokenA, tokenB } = pool

    return new Pool({
      ...pool,
      tokenA: new Token(tokenA.contract, tokenA.decimals, tokenA.symbol, tokenA.symbol.toLowerCase() + '-' + tokenA.contract),
      tokenB: new Token(tokenB.contract, tokenB.decimals, tokenB.symbol, tokenB.symbol.toLowerCase() + '-' + tokenB.contract),
      tickCurrent: pool.tick
    })
  })
}

export async function getRedisTicks(chain: string, poolId: number | string) {
  if (!redis.isOpen) await redis.connect()

  const entries = await redis.get(`ticks_${chain}_${poolId}`)
  const plain = JSON.parse(entries || '[]') || []

  const ticks = entries ? new Map([...plain].sort((a, b) => a.id - b.id)) : new Map()
  return ticks
}

export async function getRedisPosition(chain, id) {
  if (!redis.isOpen) await redis.connect()

  const current = JSON.parse(await redis.get(`positions_${chain}`) || '[]')

  // Merging
  const positions = new Map([...current.map(p => [p.id, p])])

  return positions.get(id)
}
