import axios from 'axios'
import pLimit from 'p-limit'

import { getTokens } from '../../utils'
import { getRedis } from '../redis'
import { TokenHoldersHistory } from '../../models'

const HOLDERS_CONCURRENCY = 3
const HOLDERS_INTERVAL_MS = 60 * 60 * 1000
const LIGHTAPI_TIMEOUT_MS = 30_000

/**
 * Accounts holding a non-zero balance of one token, as LightAPI counts them.
 *
 * Not the scopes of the contract's `accounts` table: those are per contract,
 * not per symbol — every wrap.alcor token got the same count — and a scope
 * stays after its owner sent everything away, so they also counted accounts
 * holding nothing.
 */
async function fetchHoldersCount(lightapi: string, chain: string, contract: string, symbol: string) {
  const { data } = await axios.get(`${lightapi}/api/holdercount/${chain}/${contract}/${symbol}`, {
    timeout: LIGHTAPI_TIMEOUT_MS,
  })

  const holders = Number(data)
  if (!Number.isInteger(holders) || holders < 0) {
    throw new Error(`unexpected holdercount answer: ${JSON.stringify(data)}`)
  }
  return holders
}

function computeChanges(series: number[]) {
  const current = series[0] ?? null
  const oneHour = series[1] ?? null
  const sixHour = series[6] ?? null
  const day = series[24] ?? null

  return {
    current,
    change1h: current !== null && oneHour !== null ? current - oneHour : null,
    change6h: current !== null && sixHour !== null ? current - sixHour : null,
    change24h: current !== null && day !== null ? current - day : null,
  }
}

export async function updateTokenHoldersHistory(network: Network) {
  const chain = network.name
  const redis = getRedis()

  // Without LightAPI there is no per-token count to take; a wrong one is worse than none.
  if (!network.lightapi) {
    console.warn(`[${chain}] no lightapi configured, token holders are not counted`)
    return
  }

  try {
    const tokens = await getTokens(chain)
    if (!Array.isArray(tokens) || tokens.length === 0) return

    const now = new Date()
    const limit = pLimit(HOLDERS_CONCURRENCY)

    const holderStats: Record<string, any> = {}
    const historyDocs: any[] = []

    await Promise.all(tokens.map((t) => limit(async () => {
      let holders: number
      try {
        holders = await fetchHoldersCount(network.lightapi, chain, t.contract, t.symbol)
      } catch (e) {
        // One token LightAPI could not answer for keeps its last count rather than taking the rest down.
        console.error(`[${chain}] holders of ${t.id} not counted:`, e.message)
        return
      }

      historyDocs.push({
        chain,
        tokenId: t.id,
        holders,
        truncated: false,
        time: now,
      })

      const listKey = `${chain}_token_holders_ts_${t.id}`

      await redis.lPush(listKey, String(holders))
      await redis.lTrim(listKey, 0, 24)

      const seriesRaw = await redis.lRange(listKey, 0, 24)
      const series = seriesRaw.map((v) => Number(v)).filter((v) => Number.isFinite(v))

      const changes = computeChanges(series)

      holderStats[t.id] = {
        holders: changes.current,
        change1h: changes.change1h,
        change6h: changes.change6h,
        change24h: changes.change24h,
        truncated: false,
        updatedAt: now.toISOString(),
      }
    })))

    if (historyDocs.length > 0) {
      await TokenHoldersHistory.insertMany(historyDocs, { ordered: false })
    }

    const statsKey = `${chain}_token_holders_stats`
    const flat: string[] = []
    for (const [tokenId, payload] of Object.entries(holderStats)) {
      flat.push(tokenId, JSON.stringify(payload))
    }

    if (flat.length > 0) {
      await redis.hSet(statsKey, flat as any)
    }
  } catch (e) {
    console.error(`[${network.name}] token holders update failed`, e)
  }
}

export async function startTokenHoldersUpdater(network: Network, options: { awaitInitial?: boolean } = {}) {
  if (options.awaitInitial) await updateTokenHoldersHistory(network)
  else updateTokenHoldersHistory(network)
  setInterval(() => updateTokenHoldersHistory(network), HOLDERS_INTERVAL_MS)
}
