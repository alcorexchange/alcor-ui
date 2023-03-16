import { SwapPool } from '../../models'

import { Pool } from '../../../assets/libs/swap-sdk/entities/pool'
import { Token } from '../../../assets/libs/swap-sdk/entities/token'

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
