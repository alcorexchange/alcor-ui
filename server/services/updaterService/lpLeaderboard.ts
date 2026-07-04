import { Position as PositionClass } from '@alcorexchange/alcor-swap-sdk'

import { SwapPool, PositionHistory } from '../../models'
import { getTokens } from '../../utils'
import { getRedis } from '../redis'
import { poolInstanceFromMongoPool, sanitizePositionFeesUSD } from '../swapV2Service/utils'

const ONEDAY = 60 * 60 * 24 * 1000

// Sortable windows for claimed fees. 'all' has no APR (no period to annualize over).
const WINDOWS = [
  { key: '24h', days: 1 },
  { key: '7d', days: 7 },
  { key: '30d', days: 30 },
]

// Keep top accounts per each sortable metric, so the API can sort the snapshot
// by any of them without losing accounts that are top only in one dimension.
const LEADERBOARD_SIZE = 1000
const TOP_POOLS_PER_ACCOUNT = 5

export function getLpLeaderboardRedisKey(chain: string) {
  return `${chain}_lp_leaderboard`
}

function round(value: number, decimals = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(decimals)) : 0
}

function newAccountEntry(account: string) {
  return {
    account,
    claimedUSD: { '24h': 0, '7d': 0, '30d': 0, all: 0 },
    unclaimedUSD: 0,
    tvlUSD: 0,
    positionsCount: 0,
    collectsCount: 0,
    lastCollectTime: null as Date | null,
    pools: new Map<number, any>(),
  }
}

function newPoolEntry(poolId: number) {
  return {
    id: poolId,
    claimedUSD: { '24h': 0, '7d': 0, '30d': 0, all: 0 },
    unclaimedUSD: 0,
    tvlUSD: 0,
    positionsCount: 0,
  }
}

function getAccountEntry(accounts: Map<string, any>, owner: string) {
  if (!accounts.has(owner)) accounts.set(owner, newAccountEntry(owner))
  return accounts.get(owner)
}

function getPoolEntry(accountEntry: any, poolId: number) {
  if (!accountEntry.pools.has(poolId)) accountEntry.pools.set(poolId, newPoolEntry(poolId))
  return accountEntry.pools.get(poolId)
}

// Claimed fees per owner+pool for all windows in a single pass over 'collect' events.
// USD values were fixed at claim time by the indexer (saveMintOrBurn).
async function aggregateClaimedFees(chain: string, now: number) {
  const sumSince = (since: Date) => ({
    $sum: { $cond: [{ $gte: ['$time', since] }, { $ifNull: ['$totalUSDValue', 0] }, 0] },
  })

  return await PositionHistory.aggregate([
    { $match: { chain, type: 'collect' } },
    {
      $group: {
        _id: { owner: '$owner', pool: '$pool' },
        claimedUSDAll: { $sum: { $ifNull: ['$totalUSDValue', 0] } },
        claimedUSD24: sumSince(new Date(now - ONEDAY)),
        claimedUSD7: sumSince(new Date(now - 7 * ONEDAY)),
        claimedUSD30: sumSince(new Date(now - 30 * ONEDAY)),
        collects: { $sum: 1 },
        lastCollectTime: { $max: '$time' },
      },
    },
  ])
}

function applyClaimedFees(accounts: Map<string, any>, claimRows: any[]) {
  for (const row of claimRows) {
    const { owner, pool } = row._id
    if (!owner || pool === undefined || pool === null) continue

    const claimed = {
      '24h': Number(row.claimedUSD24) || 0,
      '7d': Number(row.claimedUSD7) || 0,
      '30d': Number(row.claimedUSD30) || 0,
      all: Number(row.claimedUSDAll) || 0,
    }

    const accountEntry = getAccountEntry(accounts, owner)
    const poolEntry = getPoolEntry(accountEntry, Number(pool))

    for (const key of Object.keys(claimed)) {
      accountEntry.claimedUSD[key] += claimed[key]
      poolEntry.claimedUSD[key] += claimed[key]
    }

    accountEntry.collectsCount += Number(row.collects) || 0
    if (row.lastCollectTime && (!accountEntry.lastCollectTime || row.lastCollectTime > accountEntry.lastCollectTime)) {
      accountEntry.lastCollectTime = row.lastCollectTime
    }
  }
}

// Unclaimed fees and current position value for every open position on the chain.
// Pure math over pool ticks (already in Redis), no RPC calls.
async function applyLivePositions(chain: string, accounts: Map<string, any>, poolsById: Map<number, any>) {
  const redis = getRedis()

  const positions = JSON.parse(await redis.get(`positions_${chain}`) || '[]')
  const tokens = (await getTokens(chain)) || []
  const priceMap = new Map<string, number>(tokens.map((t: any) => [t.id, Number(t.safe_usd_price) || 0]))

  const positionsByPool = new Map<number, any[]>()
  for (const position of positions) {
    const poolId = Number(position.pool)
    if (!positionsByPool.has(poolId)) positionsByPool.set(poolId, [])
    positionsByPool.get(poolId).push(position)
  }

  let failed = 0

  for (const [poolId, poolPositions] of positionsByPool) {
    const mongoPool = poolsById.get(poolId)
    if (!mongoPool) continue

    let poolInstance
    try {
      poolInstance = await poolInstanceFromMongoPool(mongoPool)
    } catch (e) {
      failed += poolPositions.length
      continue
    }

    const priceA = priceMap.get(mongoPool.tokenA.id) || 0
    const priceB = priceMap.get(mongoPool.tokenB.id) || 0

    for (const plainPosition of poolPositions) {
      try {
        const position = new PositionClass({ ...plainPosition, pool: poolInstance })

        const positionValueUSD =
          parseFloat(position.amountA.toFixed()) * priceA +
          parseFloat(position.amountB.toFixed()) * priceB

        const fees = await position.getFees()
        const unclaimedUSD = sanitizePositionFeesUSD(
          parseFloat(fees.feesA.toFixed()) * priceA + parseFloat(fees.feesB.toFixed()) * priceB,
          positionValueUSD
        )

        const accountEntry = getAccountEntry(accounts, plainPosition.owner)
        const poolEntry = getPoolEntry(accountEntry, poolId)

        accountEntry.tvlUSD += positionValueUSD
        accountEntry.unclaimedUSD += unclaimedUSD
        accountEntry.positionsCount += 1

        poolEntry.tvlUSD += positionValueUSD
        poolEntry.unclaimedUSD += unclaimedUSD
        poolEntry.positionsCount += 1
      } catch (e) {
        failed += 1
      }
    }
  }

  if (failed > 0) console.warn(`[${chain}] lp leaderboard: failed to process ${failed} positions`)

  return positions.length
}

function calcAprPct(claimedUSD: number, tvlUSD: number, days: number) {
  if (!(tvlUSD > 0) || !(claimedUSD > 0)) return null
  const apr = (claimedUSD / tvlUSD) * (365 / days) * 100
  return Number.isFinite(apr) ? round(apr, 2) : null
}

function poolMeta(mongoPool: any) {
  if (!mongoPool) return null
  return {
    fee: mongoPool.fee,
    tokenA: { id: mongoPool.tokenA.id, symbol: mongoPool.tokenA.symbol, contract: mongoPool.tokenA.contract },
    tokenB: { id: mongoPool.tokenB.id, symbol: mongoPool.tokenB.symbol, contract: mongoPool.tokenB.contract },
  }
}

function finalizeAccount(accountEntry: any, poolsById: Map<number, any>) {
  const claimedUSD = {
    '24h': round(accountEntry.claimedUSD['24h']),
    '7d': round(accountEntry.claimedUSD['7d']),
    '30d': round(accountEntry.claimedUSD['30d']),
    all: round(accountEntry.claimedUSD.all),
  }
  const unclaimedUSD = round(accountEntry.unclaimedUSD)
  const tvlUSD = round(accountEntry.tvlUSD)

  const apr = {}
  for (const { key, days } of WINDOWS) {
    apr[key] = calcAprPct(claimedUSD[key], tvlUSD, days)
  }

  const topPools = [...accountEntry.pools.values()]
    .sort((a, b) => (b.claimedUSD.all + b.unclaimedUSD) - (a.claimedUSD.all + a.unclaimedUSD))
    .slice(0, TOP_POOLS_PER_ACCOUNT)
    .map((poolEntry) => ({
      id: poolEntry.id,
      ...poolMeta(poolsById.get(poolEntry.id)),
      claimedUSD: {
        '24h': round(poolEntry.claimedUSD['24h']),
        '7d': round(poolEntry.claimedUSD['7d']),
        '30d': round(poolEntry.claimedUSD['30d']),
        all: round(poolEntry.claimedUSD.all),
      },
      unclaimedUSD: round(poolEntry.unclaimedUSD),
      tvlUSD: round(poolEntry.tvlUSD),
      positionsCount: poolEntry.positionsCount,
    }))

  return {
    account: accountEntry.account,
    claimedUSD,
    unclaimedUSD,
    totalFeesUSD: round(claimedUSD.all + unclaimedUSD),
    tvlUSD,
    apr,
    positionsCount: accountEntry.positionsCount,
    poolsCount: accountEntry.pools.size,
    collectsCount: accountEntry.collectsCount,
    lastCollectTime: accountEntry.lastCollectTime,
    topPools,
  }
}

function selectTopAccounts(allAccounts: any[]) {
  const metrics: Array<(a: any) => number> = [
    (a) => a.totalFeesUSD,
    (a) => a.claimedUSD.all,
    (a) => a.claimedUSD['30d'],
    (a) => a.claimedUSD['7d'],
    (a) => a.claimedUSD['24h'],
    (a) => a.unclaimedUSD,
    (a) => a.tvlUSD,
  ]

  const selected = new Set<string>()
  for (const metric of metrics) {
    const top = [...allAccounts].sort((a, b) => metric(b) - metric(a)).slice(0, LEADERBOARD_SIZE)
    for (const account of top) {
      if (metric(account) > 0) selected.add(account.account)
    }
  }

  return allAccounts
    .filter((a) => selected.has(a.account))
    .sort((a, b) => b.totalFeesUSD - a.totalFeesUSD)
}

export async function updateLpLeaderboard(chain: string) {
  console.time(`${chain} lp leaderboard updated`)
  try {
    const now = Date.now()
    const accounts = new Map<string, any>()

    const mongoPools = await SwapPool.find({ chain }).lean()
    const poolsById = new Map<number, any>(mongoPools.map((p: any) => [p.id, p]))

    const claimRows = await aggregateClaimedFees(chain, now)
    applyClaimedFees(accounts, claimRows)

    const positionsTotal = await applyLivePositions(chain, accounts, poolsById)

    const allAccounts = [...accounts.values()]
      .map((entry) => finalizeAccount(entry, poolsById))
      .filter((a) => a.totalFeesUSD > 0 || a.tvlUSD > 0)

    const totals = {
      accounts: allAccounts.length,
      positions: positionsTotal,
      claimedUSD: {
        '24h': round(allAccounts.reduce((sum, a) => sum + a.claimedUSD['24h'], 0), 2),
        '7d': round(allAccounts.reduce((sum, a) => sum + a.claimedUSD['7d'], 0), 2),
        '30d': round(allAccounts.reduce((sum, a) => sum + a.claimedUSD['30d'], 0), 2),
        all: round(allAccounts.reduce((sum, a) => sum + a.claimedUSD.all, 0), 2),
      },
      unclaimedUSD: round(allAccounts.reduce((sum, a) => sum + a.unclaimedUSD, 0), 2),
      tvlUSD: round(allAccounts.reduce((sum, a) => sum + a.tvlUSD, 0), 2),
    }

    const snapshot = {
      updatedAt: new Date(now).toISOString(),
      totals,
      accounts: selectTopAccounts(allAccounts),
    }

    await getRedis().set(getLpLeaderboardRedisKey(chain), JSON.stringify(snapshot))

    console.log(`[${chain}] lp leaderboard: ${snapshot.accounts.length}/${allAccounts.length} accounts, ${positionsTotal} positions`)
  } catch (error) {
    console.error(`[${chain}] lp leaderboard update error:`, error)
  } finally {
    console.timeEnd(`${chain} lp leaderboard updated`)
  }
}
