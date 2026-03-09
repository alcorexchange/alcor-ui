require('dotenv').config()

import { mongoConnect, initRedis } from '../../utils'
import { getSubscriber, getPublisher } from '../redis'
import { throttledPoolUpdate } from '.'
import {
  initLaunchpadMarketDataRuntime,
  ingestLaunchpadChainAction,
} from '../launchpadMarketDataService/runtime'

export async function connectAll() {
  await mongoConnect()
  await initRedis()
}

export async function main() {
  await connectAll()
  console.log('SwapService started!')
  initLaunchpadMarketDataRuntime()

  // Track pool updates per chain for periodic logging
  const poolUpdateCounts: Record<string, number> = {}
  let lastLogTime = Date.now()

  getSubscriber().pSubscribe('chainAction:*:*:*', action => {
    let parsed: any
    try {
      parsed = JSON.parse(action)
    } catch (e) {
      console.error('[swap-service] bad chainAction payload', e)
      return
    }

    const { chain, name, data } = parsed

    if (['logpool', 'logswap', 'logmint', 'logburn', 'logcollect', 'logtransfer'].includes(name)) {
      ingestLaunchpadChainAction(parsed).catch((e) => {
        console.error(`[launchpad:${chain}] ingest error`, e)
      })
    }

    if (['logmint', 'logburn', 'logswap', 'logcollect', 'transferpos', 'logtransfer', 'logpool'].includes(name)) {
      throttledPoolUpdate(chain, Number(data.poolId))

      // Count updates per chain
      poolUpdateCounts[chain] = (poolUpdateCounts[chain] || 0) + 1
    }

    // Log position changes (rare events - log each one)
    if (['logmint', 'logburn', 'logcollect', 'logtransfer'].includes(name)) {
      const { posId, owner } = data
      console.log(`[${chain}] ${name.replace('log', '')} pos #${posId} pool:${data.poolId} owner:${owner}`)

      if (name === 'logtransfer') {
        const from = data?.from
        const to = data?.to
        const fromPosId = Number(data?.fromPosId ?? data?.from_pos_id ?? data?.posId)
        const toPosId = Number(data?.toPosId ?? data?.to_pos_id ?? data?.posId)

        if (from) {
          const push = { chain, account: from, positions: [fromPosId] }
          getPublisher().publish('account:update-positions', JSON.stringify(push))
        }
        if (to) {
          const push = { chain, account: to, positions: [toPosId] }
          getPublisher().publish('account:update-positions', JSON.stringify(push))
        }
      } else {
        const push = { chain, account: owner, positions: [posId] }
        getPublisher().publish('account:update-positions', JSON.stringify(push))
      }
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
