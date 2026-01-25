require('dotenv').config()

import { mongoConnect, initRedis } from '../../utils'
import { getSubscriber, getPublisher } from '../redis'
import { throttledPoolUpdate } from '.'

export async function connectAll() {
  await mongoConnect()
  await initRedis()
}

export async function main() {
  await connectAll()
  console.log('SwapService started!')

  // Track pool updates per chain for periodic logging
  const poolUpdateCounts: Record<string, number> = {}
  let lastLogTime = Date.now()

  getSubscriber().pSubscribe('chainAction:*:swap.alcor:*', action => {
    const { chain, name, data } = JSON.parse(action)

    if (['logmint', 'logburn', 'logswap', 'logcollect', 'transferpos', 'logpool'].includes(name)) {
      throttledPoolUpdate(chain, Number(data.poolId))

      // Count updates per chain
      poolUpdateCounts[chain] = (poolUpdateCounts[chain] || 0) + 1
    }

    // Log position changes (rare events - log each one)
    if (['logmint', 'logburn', 'logcollect'].includes(name)) {
      const { posId, owner } = data
      console.log(`[${chain}] ${name.replace('log', '')} pos #${posId} pool:${data.poolId} owner:${owner}`)

      const push = { chain, account: owner, positions: [posId] }
      getPublisher().publish('account:update-positions', JSON.stringify(push))
    }

    // Log pool creation
    if (name === 'logpool') {
      console.log(`[${chain}] new pool #${data.poolId}`)
    }

    // Periodic summary log (every 30 seconds)
    const now = Date.now()
    if (now - lastLogTime > 30000 && Object.keys(poolUpdateCounts).length > 0) {
      const summary = Object.entries(poolUpdateCounts)
        .map(([c, count]) => `${c}:${count}`)
        .join(' ')
      console.log(`[swap-service] pool updates: ${summary}`)

      // Reset counters
      for (const key in poolUpdateCounts) poolUpdateCounts[key] = 0
      lastLogTime = now
    }
  })
}

// TODO Run as separate service
main()
