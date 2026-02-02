import pLimit from 'p-limit'

import { getChainRpc } from '../../../utils/eosjs'
import { getTokens } from '../../utils'
import { getRedis } from '../redis'
import { TokenHoldersHistory } from '../../models'

const HOLDERS_CONCURRENCY = 3
const HOLDERS_INTERVAL_MS = 60 * 60 * 1000
const SCOPES_LIMIT_PER_CALL = 9999
const HOLDERS_CAP = 1_000_000
const MAX_PAGES = Math.ceil(HOLDERS_CAP / SCOPES_LIMIT_PER_CALL) + 1

async function fetchHoldersCountLimited(rpc, contract: string) {
  let holders = 0
  let lowerBound: string | undefined = undefined

  for (let i = 0; i < MAX_PAGES; i += 1) {
    const result = await rpc.get_table_by_scope({
      json: true,
      code: contract,
      table: 'accounts',
      lower_bound: lowerBound,
      limit: SCOPES_LIMIT_PER_CALL,
    })

    if (Array.isArray(result.rows) && result.rows.length > 0) {
      holders += result.rows.length
    }

    if (holders >= HOLDERS_CAP) {
      return { holders: HOLDERS_CAP, truncated: true }
    }

    const nextKey = (typeof result.more === 'string' && result.more.length > 0)
      ? result.more
      : (typeof result.next_key === 'string' && result.next_key.length > 0 ? result.next_key : null)

    if (!nextKey || result.rows.length === 0) break
    lowerBound = nextKey
  }

  return { holders, truncated: false }
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
  const rpc = getChainRpc(chain)

  try {
    const tokens = await getTokens(chain)
    if (!Array.isArray(tokens) || tokens.length === 0) return

    const now = new Date()
    const limit = pLimit(HOLDERS_CONCURRENCY)

    const holderStats: Record<string, any> = {}
    const historyDocs: any[] = []

    await Promise.all(tokens.map((t) => limit(async () => {
      const { holders, truncated } = await fetchHoldersCountLimited(rpc, t.contract)

      historyDocs.push({
        chain,
        tokenId: t.id,
        holders,
        truncated,
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
        truncated,
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

export function startTokenHoldersUpdater(network: Network) {
  updateTokenHoldersHistory(network)
  setInterval(() => updateTokenHoldersHistory(network), HOLDERS_INTERVAL_MS)
}
