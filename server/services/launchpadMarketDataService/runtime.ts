import config from '../../../config'
import { LaunchpadTokenMeta, SwapPool } from '../../models'
import { getRedis, getPublisher } from '../redis'
import {
  LAUNCHPAD_EVENT_CHANNELS,
  bootStateKey,
  dedupeEventKey,
  listGraduatedKey,
  listNewKey,
  listTrendingKey,
  tokenBucketsKey,
  tokenSummaryKey,
  tokenTradesKey,
  tokensSetKey,
} from './keys'

const WINDOW_5M_MS = 5 * 60 * 1000
const WINDOW_1H_MS = 60 * 60 * 1000
const WINDOW_24H_MS = 24 * 60 * 60 * 1000
const BUCKET_MINUTE_MS = 60 * 1000
const BUCKET_RETENTION_MS = WINDOW_24H_MS + 5 * BUCKET_MINUTE_MS
const SUMMARY_TTL_SECONDS = 7 * 24 * 60 * 60
const TRADES_TTL_SECONDS = 3 * 24 * 60 * 60
const MAX_RECENT_TRADES = 200
const TRENDING_TOP_N = 50
const TRENDING_RECALC_MS = Number(process.env.LAUNCHPAD_TRENDING_RECALC_MS || 10_000)
const POOLS_SYNC_MS = Number(process.env.LAUNCHPAD_POOLS_SYNC_MS || 120_000)
const TOKEN_SCORES_REFRESH_MS = Number(process.env.LAUNCHPAD_TOKEN_SCORES_REFRESH_MS || 60_000)
const LIQUIDITY_GRADUATION_USD = Number(process.env.LAUNCHPAD_GRADUATION_LIQ_USD || 250_000)
const VOLUME_GRADUATION_USD = Number(process.env.LAUNCHPAD_GRADUATION_VOL24_USD || 500_000)

function finite(value: any, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function parseTs(value: any) {
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : Date.now()
}

function parseTsOrZero(value: any) {
  if (value === undefined || value === null || value === '') return 0
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : 0
}

function parseAmount(value: any) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const n = parseFloat(value)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function isBasePair(baseTokenId: string, tokenAId: string, tokenBId: string) {
  return (
    (tokenAId === baseTokenId && tokenBId !== baseTokenId)
    || (tokenBId === baseTokenId && tokenAId !== baseTokenId)
  )
}

type MinuteBucket = {
  volQuote: number
  volUsd: number
  trades: number
  price: number
  ts: number
}

type TokenRuntimeState = {
  tokenId: string
  symbol: string
  contract: string
  decimals: number | null
  name: string | null
  status: 'LAUNCH' | 'OPEN' | 'GRADUATED' | 'UNKNOWN'
  statusSource: 'auto' | 'meta'
  createdAt: number
  totalSupply: number | null
  quoteTokenId: string | null
  lastPriceQuote: number | null
  lastPriceBase: number | null
  lastPriceUsd: number | null
  lastTrade: any | null
  recentTrades: any[]
  buckets: Map<number, MinuteBucket>
  liquidityUsd: number
  liquidityBase: number
  volume5mQuote: number
  volume1hQuote: number
  volume24hQuote: number
  volume5mUsd: number
  volume1hUsd: number
  volume24hUsd: number
  trades5m: number
  trades1h: number
  trades24h: number
  chg5mPct: number
  chg1hPct: number
  chg24hPct: number
  updatedAt: number
}

type PoolRuntimeState = {
  id: number
  tokenAId: string
  tokenBId: string
  tokenAQuantity: number
  tokenBQuantity: number
  tvlUSD: number
  createdAt: number
}

type ChainRuntimeState = {
  chain: string
  baseTokenId: string
  baseUsd: number
  tokenPrices: Map<string, any>
  tokenFirstSeenById: Map<string, number>
  tokenFirstSeenLoadedAt: number
  tokens: Map<string, TokenRuntimeState>
  pools: Map<number, PoolRuntimeState>
  tokenPools: Map<string, Set<number>>
  seededTokenIds: Set<string>
  rankByToken: Map<string, number>
  queue: Promise<void>
  hydrated: boolean
  hydratePromise: Promise<void> | null
}

class LaunchpadMarketDataRuntime {
  private chainStates = new Map<string, ChainRuntimeState>()
  private metaPersistState = new Map<string, { ts: number, status: string, supply: number | null }>()
  private started = false

  start() {
    if (this.started) return
    this.started = true

    const timer = setInterval(() => {
      void this.recomputeAllTrending().catch((e) => {
        console.error('[launchpad] trending recompute failed', e)
      })
    }, TRENDING_RECALC_MS)

    if (typeof (timer as any).unref === 'function') {
      ;(timer as any).unref()
    }

    const poolsSyncTimer = setInterval(() => {
      void this.syncAllChainsFromPools().catch((e) => {
        console.error('[launchpad] pools sync failed', e)
      })
    }, POOLS_SYNC_MS)

    if (typeof (poolsSyncTimer as any).unref === 'function') {
      ;(poolsSyncTimer as any).unref()
    }

    void this.bootstrapAllConfiguredChains().catch((e) => {
      console.error('[launchpad] bootstrap failed', e)
    })
  }

  async handleChainAction(action: any) {
    const chain = String(action?.chain || '')
    if (!chain) return

    const state = await this.ensureChainState(chain)
    state.queue = state.queue
      .then(async () => {
        await this.processAction(state, action)
      })
      .catch((e) => {
        console.error(`[launchpad:${chain}] queue error`, e)
      })

    await state.queue
  }

  private async ensureChainState(chain: string) {
    const existing = this.chainStates.get(chain)
    if (existing) return existing

    const network = (config as any).networks?.[chain]
    if (!network) throw new Error(`Unknown chain: ${chain}`)

    const baseTokenId = String(network.baseToken?.id || '').toLowerCase()

    const created: ChainRuntimeState = {
      chain,
      baseTokenId,
      baseUsd: 0,
      tokenPrices: new Map(),
      tokenFirstSeenById: new Map(),
      tokenFirstSeenLoadedAt: 0,
      tokens: new Map(),
      pools: new Map(),
      tokenPools: new Map(),
      seededTokenIds: new Set(),
      rankByToken: new Map(),
      queue: Promise.resolve(),
      hydrated: false,
      hydratePromise: null,
    }

    this.chainStates.set(chain, created)
    created.hydratePromise = this.hydrateChainState(created)
    await created.hydratePromise
    return created
  }

  private async bootstrapAllConfiguredChains() {
    const networks = Object.keys((config as any).networks || {})
    for (const chain of networks) {
      try {
        await this.ensureChainState(chain)
      } catch (e) {
        console.error(`[launchpad:${chain}] bootstrap chain failed`, e)
      }
    }
  }

  private async hydrateChainState(state: ChainRuntimeState) {
    if (state.hydrated) return

    await this.refreshTokenPrices(state)
    await this.loadPools(state)
    await this.loadMeta(state)
    await this.restoreFromRedis(state)
    await this.syncTokenSnapshotsFromPools(state, true)

    state.hydrated = true

    await getRedis().hSet(bootStateKey(state.chain), {
      hydratedAt: String(Date.now()),
      processId: String(process.pid),
    })
  }

  private async syncAllChainsFromPools() {
    for (const state of this.chainStates.values()) {
      if (!state.hydrated) continue

      state.queue = state.queue
        .then(async () => {
          await this.refreshTokenPrices(state)
          await this.loadPools(state)
          await this.syncTokenSnapshotsFromPools(state, false)
        })
        .catch((e) => {
          console.error(`[launchpad:${state.chain}] sync queue error`, e)
        })
    }
  }

  private async refreshTokenPrices(state: ChainRuntimeState) {
    const redis = getRedis()
    const raw = await redis.get(`${state.chain}_token_prices`)
    const items = safeJsonParse<any[]>(raw, [])

    state.tokenPrices.clear()
    for (const token of items) {
      if (!token?.id) continue
      state.tokenPrices.set(String(token.id), token)
    }

    state.baseUsd = finite(await redis.get(`${state.chain}_price`), 0)

    const now = Date.now()
    if ((now - state.tokenFirstSeenLoadedAt) < TOKEN_SCORES_REFRESH_MS && state.tokenFirstSeenById.size > 0) {
      return
    }

    const tokenScoresRaw = await redis.get(`${state.chain}_token_scores`)
    const tokenScores = safeJsonParse<Record<string, any>>(tokenScoresRaw, {})
    state.tokenFirstSeenById.clear()

    for (const [tokenId, score] of Object.entries(tokenScores || {})) {
      const normalizedId = String(tokenId || '').toLowerCase()
      if (!normalizedId || normalizedId === state.baseTokenId) continue

      const firstSeenTs = parseTsOrZero((score as any)?.firstSeenAt)
      if (firstSeenTs > 0) {
        state.tokenFirstSeenById.set(normalizedId, firstSeenTs)
      }
    }

    state.tokenFirstSeenLoadedAt = now
  }

  private async loadPools(state: ChainRuntimeState) {
    const pools: any[] = await SwapPool.find({ chain: state.chain })
      .select('id tokenA tokenB tvlUSD firstSeenAt')
      .lean()

    for (const pool of pools) {
      this.registerPool(state, pool)
    }
  }

  private async loadMeta(state: ChainRuntimeState) {
    const docs: any[] = await LaunchpadTokenMeta.find({ chain: state.chain }).lean()

    for (const meta of docs) {
      const tokenId = String(meta.token_id || '').toLowerCase()
      if (!tokenId || tokenId === state.baseTokenId) continue

      const rawCreatedAt = (meta?.created_at ?? meta?.createdAt)
      const createdAt = parseTsOrZero(rawCreatedAt)
      const token = this.ensureTokenState(state, tokenId, {
        createdAt,
      })

      if (meta.symbol) token.symbol = String(meta.symbol)
      if (meta.name) token.name = String(meta.name)
      if (meta.contract) token.contract = String(meta.contract)
      if (Number.isFinite(Number(meta.decimals))) token.decimals = Number(meta.decimals)
      if (Number.isFinite(Number(meta.total_supply))) token.totalSupply = Number(meta.total_supply)

      if (['LAUNCH', 'OPEN', 'GRADUATED', 'UNKNOWN'].includes(String(meta.status))) {
        token.status = String(meta.status) as any
        token.statusSource = 'meta'
      }
    }
  }

  private async restoreFromRedis(state: ChainRuntimeState) {
    const redis = getRedis()
    const tokenIds = await redis.sMembers(tokensSetKey(state.chain))

    for (const tokenId of tokenIds) {
      const normalizedTokenId = String(tokenId).toLowerCase()
      if (!normalizedTokenId || normalizedTokenId === state.baseTokenId) continue

      const [summaryRaw, bucketsRaw] = await Promise.all([
        redis.get(tokenSummaryKey(state.chain, normalizedTokenId)),
        redis.get(tokenBucketsKey(state.chain, normalizedTokenId)),
      ])

      const summary = safeJsonParse<any>(summaryRaw, null)
      const buckets = safeJsonParse<Record<string, MinuteBucket>>(bucketsRaw, {})
      if (!summary) continue
      if (String(summary.quote_token_id || '').toLowerCase() !== state.baseTokenId) continue

      const rawCreatedAt = (summary?.created_at ?? summary?.createdAt)
      const createdAt = parseTsOrZero(rawCreatedAt)
      const token = this.ensureTokenState(state, normalizedTokenId, {
        createdAt,
      })

      token.quoteTokenId = state.baseTokenId
      if (['LAUNCH', 'OPEN', 'GRADUATED', 'UNKNOWN'].includes(String(summary.status))) {
        token.status = summary.status
      }
      token.lastPriceQuote = finite(summary.price_quote, null as any)
      token.lastPriceBase = finite(summary.price_base, null as any)
      token.lastPriceUsd = finite(summary.price_usd, null as any)
      token.lastTrade = summary.last_trade || null

      token.liquidityUsd = finite(summary?.liquidity?.usd)
      token.liquidityBase = finite(summary?.liquidity?.base)

      token.volume5mQuote = finite(summary?.volume?.m5)
      token.volume1hQuote = finite(summary?.volume?.h1)
      token.volume24hQuote = finite(summary?.volume?.h24)

      token.volume5mUsd = finite(summary?.volume_usd?.m5)
      token.volume1hUsd = finite(summary?.volume_usd?.h1)
      token.volume24hUsd = finite(summary?.volume_usd?.h24)

      token.trades5m = finite(summary?.trades_count?.m5)
      token.trades1h = finite(summary?.trades_count?.h1)
      token.trades24h = finite(summary?.trades_count?.h24)

      token.chg5mPct = finite(summary?.price_change_pct?.m5)
      token.chg1hPct = finite(summary?.price_change_pct?.h1)
      token.chg24hPct = finite(summary?.price_change_pct?.h24)

      token.updatedAt = parseTs(summary.updated_at || Date.now())

      for (const [minuteStr, bucket] of Object.entries(buckets || {})) {
        const minute = Number(minuteStr)
        if (!Number.isFinite(minute)) continue
        token.buckets.set(minute, {
          volQuote: finite((bucket as any)?.volQuote),
          volUsd: finite((bucket as any)?.volUsd),
          trades: finite((bucket as any)?.trades),
          price: finite((bucket as any)?.price),
          ts: finite((bucket as any)?.ts),
        })
      }

      this.pruneBuckets(token)
      this.recomputeRolling(token, Date.now())
      state.seededTokenIds.add(normalizedTokenId)
    }
  }

  private async syncTokenSnapshotsFromPools(state: ChainRuntimeState, force = false) {
    for (const [tokenId, poolIds] of state.tokenPools.entries()) {
      if (!tokenId || tokenId === state.baseTokenId) continue

      const token = this.ensureTokenState(state, tokenId)

      let earliest = Number.POSITIVE_INFINITY
      let liquidityUsd = 0

      for (const poolId of poolIds.values()) {
        const pool = state.pools.get(poolId)
        if (!pool) continue

        if (Number.isFinite(pool.createdAt) && pool.createdAt > 0 && pool.createdAt < earliest) {
          earliest = pool.createdAt
        }
        if (finite(pool.tvlUSD) > 0) liquidityUsd += finite(pool.tvlUSD) / 2
      }

      const globalFirstSeen = finite(state.tokenFirstSeenById.get(tokenId) as any, 0)
      const hasEarliestFromPools = Number.isFinite(earliest) && earliest > 0
      const candidates = [
        hasEarliestFromPools ? earliest : 0,
        globalFirstSeen > 0 ? globalFirstSeen : 0,
        token.createdAt > 0 ? token.createdAt : 0,
      ].filter((v) => Number.isFinite(v) && v > 0)
      const effectiveCreatedAt = candidates.length ? Math.min(...candidates) : 0

      const liquidityBase = state.baseUsd > 0 ? (liquidityUsd / state.baseUsd) : 0

      const prevCreatedAt = token.createdAt
      const prevLiquidityUsd = token.liquidityUsd
      const prevQuoteTokenId = token.quoteTokenId
      const prevStatus = token.status

      token.createdAt = effectiveCreatedAt
      token.quoteTokenId = state.baseTokenId
      token.liquidityUsd = liquidityUsd
      token.liquidityBase = liquidityBase
      token.updatedAt = Date.now()
      this.applyAutoStatus(token)

      const changed = (
        prevCreatedAt !== token.createdAt
        || Math.abs(prevLiquidityUsd - token.liquidityUsd) > 1e-9
        || prevQuoteTokenId !== token.quoteTokenId
        || prevStatus !== token.status
      )

      if (force || changed || !state.seededTokenIds.has(tokenId)) {
        await this.persistTokenState(state, token)
      }
    }
  }

  private ensureTokenState(state: ChainRuntimeState, tokenId: string, options: { createdAt?: number } = {}) {
    let token = state.tokens.get(tokenId)
    if (token) {
      if (options.createdAt && options.createdAt > 0) {
        if (!token.createdAt || token.createdAt <= 0 || options.createdAt < token.createdAt) {
          token.createdAt = options.createdAt
        }
      }
      return token
    }

    const tokenPrice = state.tokenPrices.get(tokenId)

    token = {
      tokenId,
      symbol: String(tokenPrice?.symbol || tokenId.split('-')[0] || '').toUpperCase(),
      contract: String(tokenPrice?.contract || tokenId.split('-')[1] || ''),
      decimals: Number.isFinite(Number(tokenPrice?.decimals)) ? Number(tokenPrice.decimals) : null,
      name: tokenPrice?.name ? String(tokenPrice.name) : null,
      status: 'LAUNCH',
      statusSource: 'auto',
      createdAt: (options.createdAt && options.createdAt > 0) ? options.createdAt : 0,
      totalSupply: null,
      quoteTokenId: null,
      lastPriceQuote: null,
      lastPriceBase: null,
      lastPriceUsd: null,
      lastTrade: null,
      recentTrades: [],
      buckets: new Map(),
      liquidityUsd: 0,
      liquidityBase: 0,
      volume5mQuote: 0,
      volume1hQuote: 0,
      volume24hQuote: 0,
      volume5mUsd: 0,
      volume1hUsd: 0,
      volume24hUsd: 0,
      trades5m: 0,
      trades1h: 0,
      trades24h: 0,
      chg5mPct: 0,
      chg1hPct: 0,
      chg24hPct: 0,
      updatedAt: Date.now(),
    }

    state.tokens.set(tokenId, token)
    return token
  }

  private registerPool(state: ChainRuntimeState, pool: any) {
    const poolId = Number(pool?.id)
    if (!Number.isFinite(poolId)) return

    const tokenAId = String(pool?.tokenA?.id || '').toLowerCase()
    const tokenBId = String(pool?.tokenB?.id || '').toLowerCase()
    if (!tokenAId || !tokenBId) return
    if (!isBasePair(state.baseTokenId, tokenAId, tokenBId)) return

    const prev = state.pools.get(poolId)
    const createdAt = pool?.firstSeenAt
      ? parseTsOrZero(pool.firstSeenAt)
      : (Number.isFinite(prev?.createdAt) ? Number(prev?.createdAt) : 0)
    const launchTokenId = tokenAId === state.baseTokenId ? tokenBId : tokenAId

    state.pools.set(poolId, {
      id: poolId,
      tokenAId,
      tokenBId,
      tokenAQuantity: finite(pool?.tokenA?.quantity),
      tokenBQuantity: finite(pool?.tokenB?.quantity),
      tvlUSD: finite(pool?.tvlUSD),
      createdAt,
    })

    if (!state.tokenPools.has(launchTokenId)) state.tokenPools.set(launchTokenId, new Set())
    state.tokenPools.get(launchTokenId)?.add(poolId)

    if (createdAt > 0) {
      this.ensureTokenState(state, launchTokenId, { createdAt })
    } else {
      this.ensureTokenState(state, launchTokenId)
    }
  }

  private async processAction(state: ChainRuntimeState, action: any) {
    await this.refreshTokenPrices(state)

    const name = String(action?.name || '')
    const chain = state.chain
    const data = action?.data || {}
    const poolId = Number(data?.poolId)

    const dedupeId = this.getDedupeId(action)
    if (dedupeId) {
      const redis = getRedis()
      const accepted = await redis.set(dedupeEventKey(chain, dedupeId), '1', { NX: true, EX: 2 * 24 * 60 * 60 })
      if (accepted !== 'OK') return
    }

    if (name === 'logswap') {
      await this.processSwap(state, {
        poolId,
        trxId: String(action?.trx_id || ''),
        ts: parseTs(action?.block_time),
        amountA: parseAmount(data?.tokenA),
        amountB: parseAmount(data?.tokenB),
      })
      return
    }

    if (name === 'logpool') {
      if (Number.isFinite(poolId)) {
        const pool = await this.refreshPoolById(state, poolId, 6)
        if (pool) {
          await this.handleNewPool(state, pool, parseTs(action?.block_time))
        }
      }
      return
    }

    if (['logmint', 'logburn', 'logcollect', 'logtransfer'].includes(name)) {
      if (Number.isFinite(poolId)) {
        const pool = await this.refreshPoolById(state, poolId, 6)
        if (pool) {
          await this.refreshPoolLiquidity(state, pool)
        }
      }
    }
  }

  private getDedupeId(action: any) {
    if (Number.isFinite(Number(action?.global_sequence))) {
      return `gs:${Number(action.global_sequence)}`
    }

    const trx = String(action?.trx_id || '')
    const name = String(action?.name || '')
    const poolId = String(action?.data?.poolId ?? '')
    const posId = String(action?.data?.posId ?? action?.data?.fromPosId ?? action?.data?.toPosId ?? '')

    if (!trx && !name) return null
    return `tx:${trx}:${name}:${poolId}:${posId}`
  }

  private async processSwap(
    state: ChainRuntimeState,
    swap: { poolId: number, trxId: string, ts: number, amountA: number, amountB: number }
  ) {
    if (!Number.isFinite(swap.poolId) || !Number.isFinite(swap.ts)) return
    if (swap.amountA === 0 && swap.amountB === 0) return

    let pool = state.pools.get(swap.poolId)
    if (!pool) {
      pool = await this.refreshPoolById(state, swap.poolId, 3)
      if (!pool) return
    }

    const trackedTrades = this.buildTokenTrades(state, pool, swap)
    if (!trackedTrades.length) return

    for (const trade of trackedTrades) {
      const token = pool.createdAt > 0
        ? this.ensureTokenState(state, trade.token_id, { createdAt: pool.createdAt })
        : this.ensureTokenState(state, trade.token_id)
      this.applyTradeToToken(state, token, trade)

      await this.persistTokenState(state, token)
      await this.persistTrade(state, token.tokenId, trade)

      await this.publishEvent(LAUNCHPAD_EVENT_CHANNELS.trade, {
        ...trade,
        type: 'trade',
        channel: `trades:${state.chain}:${token.tokenId}`,
      })

      await this.publishEvent(LAUNCHPAD_EVENT_CHANNELS.tokenUpdate, {
        type: 'token_update',
        channel: `token:${state.chain}:${token.tokenId}`,
        ...(this.buildTokenSummary(state, token)),
      })
    }
  }

  private buildTokenTrades(
    state: ChainRuntimeState,
    pool: PoolRuntimeState,
    swap: { poolId: number, trxId: string, ts: number, amountA: number, amountB: number }
  ) {
    if (!isBasePair(state.baseTokenId, pool.tokenAId, pool.tokenBId)) return []

    const baseOnA = pool.tokenAId === state.baseTokenId
    const tokenId = baseOnA ? pool.tokenBId : pool.tokenAId
    const tokenAmount = baseOnA ? swap.amountB : swap.amountA
    const baseAmount = baseOnA ? swap.amountA : swap.amountB

    if (!Number.isFinite(tokenAmount) || !Number.isFinite(baseAmount) || tokenAmount === 0) {
      return []
    }

    const price = Math.abs(baseAmount / tokenAmount)
    if (!Number.isFinite(price) || price <= 0) return []

    const volumeBase = Math.abs(baseAmount)
    const baseUsd = this.getUsdPriceForQuote(state, state.baseTokenId)

    return [{
      chain: state.chain,
      token_id: tokenId,
      pool_id: swap.poolId,
      ts: swap.ts,
      price,
      amount: Math.abs(tokenAmount),
      side: tokenAmount < 0 ? 'buy' : 'sell',
      tx_id: swap.trxId,
      quote_token_id: state.baseTokenId,
      volume_quote: volumeBase,
      volume_usd: volumeBase * baseUsd,
    }]
  }

  private applyTradeToToken(state: ChainRuntimeState, token: TokenRuntimeState, trade: any) {
    const minute = Math.floor(trade.ts / BUCKET_MINUTE_MS) * BUCKET_MINUTE_MS

    token.quoteTokenId = state.baseTokenId

    const quoteToBase = this.getQuoteToBaseRate(state, state.baseTokenId)
    const quoteToUsd = this.getUsdPriceForQuote(state, state.baseTokenId)

    if (!token.lastTrade || trade.ts >= parseTs(token.lastTrade.ts)) {
      token.lastPriceQuote = trade.price
      token.lastPriceBase = quoteToBase > 0 ? trade.price * quoteToBase : null
      token.lastPriceUsd = quoteToUsd > 0 ? trade.price * quoteToUsd : null
      token.lastTrade = {
        ts: trade.ts,
        price: trade.price,
        amount: trade.amount,
        side: trade.side,
        tx_id: trade.tx_id,
      }
    }

    const bucket = token.buckets.get(minute) || {
      volQuote: 0,
      volUsd: 0,
      trades: 0,
      price: trade.price,
      ts: trade.ts,
    }

    bucket.volQuote += Math.abs(finite(trade.volume_quote))
    bucket.volUsd += Math.abs(finite(trade.volume_usd))
    bucket.trades += 1

    if (!Number.isFinite(bucket.ts) || trade.ts >= bucket.ts) {
      bucket.price = trade.price
      bucket.ts = trade.ts
    }

    token.buckets.set(minute, bucket)

    token.recentTrades.unshift({
      ts: trade.ts,
      price: trade.price,
      amount: trade.amount,
      side: trade.side,
      tx_id: trade.tx_id,
      quote_token_id: trade.quote_token_id,
      volume_quote: trade.volume_quote,
      volume_usd: trade.volume_usd,
    })

    if (token.recentTrades.length > MAX_RECENT_TRADES) {
      token.recentTrades.length = MAX_RECENT_TRADES
    }

    token.updatedAt = Date.now()

    this.pruneBuckets(token)
    this.recomputeRolling(token, Date.now())
    this.applyAutoStatus(token)
  }

  private pruneBuckets(token: TokenRuntimeState) {
    const minAllowed = Date.now() - BUCKET_RETENTION_MS

    for (const minute of token.buckets.keys()) {
      if (minute < minAllowed) token.buckets.delete(minute)
    }
  }

  private recomputeRolling(token: TokenRuntimeState, nowTs: number) {
    let volume5mQuote = 0
    let volume1hQuote = 0
    let volume24hQuote = 0

    let volume5mUsd = 0
    let volume1hUsd = 0
    let volume24hUsd = 0

    let trades5m = 0
    let trades1h = 0
    let trades24h = 0

    const minutes = [...token.buckets.keys()].sort((a, b) => a - b)

    for (const minute of minutes) {
      const bucket = token.buckets.get(minute)
      if (!bucket) continue

      const age = nowTs - minute
      if (age <= WINDOW_24H_MS) {
        volume24hQuote += bucket.volQuote
        volume24hUsd += bucket.volUsd
        trades24h += bucket.trades
      }
      if (age <= WINDOW_1H_MS) {
        volume1hQuote += bucket.volQuote
        volume1hUsd += bucket.volUsd
        trades1h += bucket.trades
      }
      if (age <= WINDOW_5M_MS) {
        volume5mQuote += bucket.volQuote
        volume5mUsd += bucket.volUsd
        trades5m += bucket.trades
      }
    }

    token.volume5mQuote = volume5mQuote
    token.volume1hQuote = volume1hQuote
    token.volume24hQuote = volume24hQuote

    token.volume5mUsd = volume5mUsd
    token.volume1hUsd = volume1hUsd
    token.volume24hUsd = volume24hUsd

    token.trades5m = trades5m
    token.trades1h = trades1h
    token.trades24h = trades24h

    token.chg5mPct = this.computeChangePct(token, nowTs, WINDOW_5M_MS)
    token.chg1hPct = this.computeChangePct(token, nowTs, WINDOW_1H_MS)
    token.chg24hPct = this.computeChangePct(token, nowTs, WINDOW_24H_MS)
  }

  private computeChangePct(token: TokenRuntimeState, nowTs: number, windowMs: number) {
    const lastPrice = finite(token.lastPriceQuote, 0)
    if (!lastPrice || !Number.isFinite(lastPrice)) return 0

    const targetTs = nowTs - windowMs
    const minutes = [...token.buckets.keys()].sort((a, b) => a - b)

    let baseline = 0
    for (const minute of minutes) {
      if (minute > targetTs) break
      const p = finite(token.buckets.get(minute)?.price)
      if (p > 0) baseline = p
    }

    if (!baseline) {
      for (const minute of minutes) {
        if (minute < targetTs) continue
        const p = finite(token.buckets.get(minute)?.price)
        if (p > 0) {
          baseline = p
          break
        }
      }
    }

    if (!baseline) return 0

    const chg = ((lastPrice / baseline) - 1) * 100
    return Number.isFinite(chg) ? chg : 0
  }

  private applyAutoStatus(token: TokenRuntimeState) {
    if (token.statusSource === 'meta') return

    const graduatedByLiquidity = token.liquidityUsd >= LIQUIDITY_GRADUATION_USD
    const graduatedByVolume = token.volume24hUsd >= VOLUME_GRADUATION_USD

    token.status = (graduatedByLiquidity || graduatedByVolume) ? 'GRADUATED' : 'LAUNCH'
  }

  private async persistTokenState(state: ChainRuntimeState, token: TokenRuntimeState) {
    const redis: any = getRedis()

    const summary = this.buildTokenSummary(state, token)
    const bucketsObj: Record<string, MinuteBucket> = {}
    for (const [minute, bucket] of token.buckets.entries()) {
      bucketsObj[String(minute)] = bucket
    }

    const multi = redis.multi()

    multi.set(tokenSummaryKey(state.chain, token.tokenId), JSON.stringify(summary), { EX: SUMMARY_TTL_SECONDS })
    multi.set(tokenBucketsKey(state.chain, token.tokenId), JSON.stringify(bucketsObj), { EX: SUMMARY_TTL_SECONDS })
    multi.sAdd(tokensSetKey(state.chain), token.tokenId)
    if (token.createdAt > 0) {
      multi.zAdd(listNewKey(state.chain), [{ score: token.createdAt, value: token.tokenId }])
    } else {
      multi.zRem(listNewKey(state.chain), token.tokenId)
    }

    if (token.status === 'GRADUATED') {
      multi.zAdd(listGraduatedKey(state.chain), [{ score: token.updatedAt, value: token.tokenId }])
    } else {
      multi.zRem(listGraduatedKey(state.chain), token.tokenId)
    }

    await multi.exec()
    state.seededTokenIds.add(token.tokenId)

    await this.upsertTokenMeta(state, token)
  }

  private async upsertTokenMeta(state: ChainRuntimeState, token: TokenRuntimeState) {
    const key = `${state.chain}:${token.tokenId}`
    const now = Date.now()
    const prev = this.metaPersistState.get(key)
    const supply = Number.isFinite(Number(token.totalSupply)) ? Number(token.totalSupply) : null

    if (
      prev &&
      prev.status === token.status &&
      prev.supply === supply &&
      (now - prev.ts) < (5 * 60 * 1000)
    ) {
      return
    }

    const hasCreatedAt = Number.isFinite(token.createdAt) && token.createdAt > 0
    const updateDoc: any = {
      $set: {
        chain: state.chain,
        token_id: token.tokenId,
        symbol: token.symbol,
        name: token.name,
        contract: token.contract,
        decimals: token.decimals,
        status: token.status,
        total_supply: supply,
        updated_at: new Date(token.updatedAt),
      },
    }

    if (hasCreatedAt) {
      updateDoc.$min = { created_at: new Date(token.createdAt) }
    }

    await LaunchpadTokenMeta.updateOne(
      { chain: state.chain, token_id: token.tokenId },
      updateDoc,
      { upsert: hasCreatedAt }
    )

    this.metaPersistState.set(key, {
      ts: now,
      status: token.status,
      supply,
    })
  }

  private async persistTrade(state: ChainRuntimeState, tokenId: string, trade: any) {
    const redis: any = getRedis()

    const multi = redis.multi()
    multi.lPush(tokenTradesKey(state.chain, tokenId), JSON.stringify(trade))
    multi.lTrim(tokenTradesKey(state.chain, tokenId), 0, MAX_RECENT_TRADES - 1)
    multi.expire(tokenTradesKey(state.chain, tokenId), TRADES_TTL_SECONDS)
    await multi.exec()
  }

  private getTopPoolForToken(state: ChainRuntimeState, tokenId: string) {
    const poolIds = state.tokenPools.get(tokenId)
    if (!poolIds || poolIds.size === 0) return null

    let top: PoolRuntimeState | null = null
    for (const poolId of poolIds.values()) {
      const pool = state.pools.get(poolId)
      if (!pool) continue
      if (!top || finite(pool.tvlUSD) > finite(top.tvlUSD)) {
        top = pool
      }
    }

    return top
  }

  private buildTokenSummary(state: ChainRuntimeState, token: TokenRuntimeState) {
    const tokenPrice = state.tokenPrices.get(token.tokenId)
    const topPool = this.getTopPoolForToken(state, token.tokenId)

    const supply = Number.isFinite(Number(token.totalSupply)) ? Number(token.totalSupply) : null
    const priceUsd = finite(token.lastPriceUsd)

    const fdv = supply && priceUsd > 0 ? supply * priceUsd : null

    return {
      chain: state.chain,
      token_id: token.tokenId,
      symbol: token.symbol,
      name: token.name,
      contract: token.contract,
      decimals: token.decimals,
      pool_id: topPool?.id ?? null,
      pool_tvl_usd: topPool ? finite(topPool.tvlUSD) : 0,
      icon_url: tokenPrice?.logo || null,
      status: token.status,
      created_at: token.createdAt || null,
      updated_at: token.updatedAt,
      quote_token_id: token.quoteTokenId,
      price_quote: token.lastPriceQuote,
      price_base: token.lastPriceBase,
      price_usd: token.lastPriceUsd,
      market_cap: fdv,
      fdv,
      supply,
      liquidity: {
        base: token.liquidityBase,
        usd: token.liquidityUsd,
      },
      volume: {
        m5: token.volume5mQuote,
        h1: token.volume1hQuote,
        h24: token.volume24hQuote,
      },
      volume_usd: {
        m5: token.volume5mUsd,
        h1: token.volume1hUsd,
        h24: token.volume24hUsd,
      },
      price_change_pct: {
        m5: token.chg5mPct,
        h1: token.chg1hPct,
        h24: token.chg24hPct,
      },
      trades_count: {
        m5: token.trades5m,
        h1: token.trades1h,
        h24: token.trades24h,
      },
      last_trade: token.lastTrade,
    }
  }

  private async handleNewPool(state: ChainRuntimeState, pool: PoolRuntimeState, ts: number) {
    const launchTokens = this.getLaunchTokensFromPool(state, pool)
    if (!launchTokens.length) return

    for (const tokenId of launchTokens) {
      const createdAt = pool.createdAt > 0 ? Math.min(pool.createdAt, ts) : ts
      const token = this.ensureTokenState(state, tokenId, { createdAt })
      token.quoteTokenId = state.baseTokenId
      await this.persistTokenState(state, token)
      await this.publishEvent(LAUNCHPAD_EVENT_CHANNELS.newPool, {
        type: 'new_pool',
        chain: state.chain,
        pool_id: pool.id,
        token_id: tokenId,
        ts,
        channel: `list:new:${state.chain}`,
      })
    }

    await this.refreshPoolLiquidity(state, pool)
    await this.publishNewListUpdate(state)
  }

  private getLaunchTokensFromPool(state: ChainRuntimeState, pool: PoolRuntimeState) {
    if (!isBasePair(state.baseTokenId, pool.tokenAId, pool.tokenBId)) return []
    return [pool.tokenAId === state.baseTokenId ? pool.tokenBId : pool.tokenAId]
  }

  private async refreshPoolById(state: ChainRuntimeState, poolId: number, retries = 1): Promise<PoolRuntimeState | null> {
    for (let i = 0; i < retries; i += 1) {
      const pool: any = await SwapPool.findOne({ chain: state.chain, id: poolId })
        .select('id tokenA tokenB tvlUSD firstSeenAt')
        .lean()

      if (pool) {
        this.registerPool(state, pool)
        return state.pools.get(poolId) || null
      }

      if (i < (retries - 1)) {
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
    }

    return null
  }

  private async refreshPoolLiquidity(state: ChainRuntimeState, pool: PoolRuntimeState) {
    if (!isBasePair(state.baseTokenId, pool.tokenAId, pool.tokenBId)) return

    const changedTokens = [pool.tokenAId === state.baseTokenId ? pool.tokenBId : pool.tokenAId]

    for (const tokenId of changedTokens) {
      const token = pool.createdAt > 0
        ? this.ensureTokenState(state, tokenId, { createdAt: pool.createdAt })
        : this.ensureTokenState(state, tokenId)

      const poolIds = state.tokenPools.get(tokenId) || new Set<number>()
      let liquidityUsd = 0

      for (const pid of poolIds) {
        const p = state.pools.get(pid)
        if (!p) continue
        if (p.tvlUSD > 0) liquidityUsd += p.tvlUSD / 2
      }

      const liquidityBase = state.baseUsd > 0 ? (liquidityUsd / state.baseUsd) : 0

      const liquidityChanged = Math.abs(liquidityUsd - token.liquidityUsd) > 1e-9

      token.liquidityUsd = liquidityUsd
      token.liquidityBase = liquidityBase
      token.updatedAt = Date.now()
      this.applyAutoStatus(token)

      await this.persistTokenState(state, token)

      if (liquidityChanged) {
        await this.publishEvent(LAUNCHPAD_EVENT_CHANNELS.poolLiquidityUpdate, {
          type: 'pool_liquidity_update',
          chain: state.chain,
          pool_id: pool.id,
          token_id: tokenId,
          liquidity: { usd: token.liquidityUsd, base: token.liquidityBase },
          ts: Date.now(),
          channel: `token:${state.chain}:${tokenId}`,
        })

        await this.publishEvent(LAUNCHPAD_EVENT_CHANNELS.tokenUpdate, {
          type: 'token_update',
          channel: `token:${state.chain}:${tokenId}`,
          ...(this.buildTokenSummary(state, token)),
        })
      }
    }
  }

  private getQuoteToBaseRate(state: ChainRuntimeState, quoteTokenId: string) {
    if (!quoteTokenId) return 0
    if (quoteTokenId === state.baseTokenId) return 1

    return 0
  }

  private getUsdPriceForQuote(state: ChainRuntimeState, quoteTokenId: string) {
    if (!quoteTokenId) return 0
    if (quoteTokenId === state.baseTokenId) return state.baseUsd > 0 ? state.baseUsd : 0
    return 0
  }

  private async publishNewListUpdate(state: ChainRuntimeState) {
    const items = await this.readListItems(state, listNewKey(state.chain), TRENDING_TOP_N)
    await this.publishEvent(LAUNCHPAD_EVENT_CHANNELS.listUpdate, {
      type: 'list_update',
      chain: state.chain,
      list: 'new',
      channel: `list:new:${state.chain}`,
      items,
      ts: Date.now(),
    })
  }

  private async recomputeAllTrending() {
    for (const state of this.chainStates.values()) {
      if (!state.hydrated) continue
      await this.recomputeTrendingForChain(state)
    }
  }

  private async recomputeTrendingForChain(state: ChainRuntimeState) {
    const now = Date.now()

    const scored = [...state.tokens.values()].map((token) => {
      const ageMinutes = Math.max(0, (now - token.createdAt) / 60000)
      const agePenalty = clamp01(ageMinutes / 360)

      const score = (
        2.0 * Math.log(token.volume5mUsd + 1)
        + 1.6 * Math.log(token.trades5m + 1)
        + 1.2 * Math.abs(token.chg5mPct)
        + 1.0 * Math.log(token.liquidityUsd + 1)
        - 0.8 * agePenalty
      )

      return {
        token,
        score: Number.isFinite(score) ? score : 0,
      }
    })
      .filter((row) => row.token.lastTrade)
      .sort((a, b) => b.score - a.score)

    const redis: any = getRedis()
    const multi = redis.multi()
    multi.del(listTrendingKey(state.chain))

    for (const row of scored) {
      multi.zAdd(listTrendingKey(state.chain), [{ score: row.score, value: row.token.tokenId }])
    }

    await multi.exec()

    const top = scored.slice(0, TRENDING_TOP_N).map((row, index) => ({
      token_id: row.token.tokenId,
      rank: index + 1,
      score: row.score,
      price: row.token.lastPriceBase,
      price_usd: row.token.lastPriceUsd,
      chg5m: row.token.chg5mPct,
      vol5m: row.token.volume5mUsd,
      liq_usd: row.token.liquidityUsd,
      status: row.token.status,
    }))

    const nextRanks = new Map<string, number>()
    top.forEach((row) => nextRanks.set(row.token_id, row.rank))

    let changed = nextRanks.size !== state.rankByToken.size
    if (!changed) {
      for (const [tokenId, rank] of nextRanks.entries()) {
        if (state.rankByToken.get(tokenId) !== rank) {
          changed = true
          break
        }
      }
    }

    if (changed) {
      state.rankByToken = nextRanks
      await this.publishEvent(LAUNCHPAD_EVENT_CHANNELS.listUpdate, {
        type: 'list_update',
        chain: state.chain,
        list: 'trending',
        channel: `list:trending:${state.chain}`,
        items: top,
        ts: now,
      })
    }
  }

  private async readListItems(state: ChainRuntimeState, key: string, limit: number) {
    const redis: any = getRedis()
    const raw: string[] = await redis.sendCommand([
      'ZREVRANGE',
      key,
      '0',
      String(Math.max(0, limit - 1)),
      'WITHSCORES',
    ])

    const out: any[] = []
    for (let i = 0; i < raw.length; i += 2) {
      const tokenId = String(raw[i] || '').toLowerCase()
      const score = finite(raw[i + 1])
      if (!tokenId) continue

      const summaryRaw = await redis.get(tokenSummaryKey(state.chain, tokenId))
      const summary = safeJsonParse<any>(summaryRaw, null)
      if (!summary) continue

      out.push({ token_id: tokenId, score, summary })
    }

    return out
  }

  private async publishEvent(channel: string, payload: any) {
    try {
      await getPublisher().publish(channel, JSON.stringify(payload))
    } catch (e) {
      console.error('[launchpad] publish failed', channel, e)
    }
  }
}

const runtime = new LaunchpadMarketDataRuntime()

export function initLaunchpadMarketDataRuntime() {
  runtime.start()
}

export async function ingestLaunchpadChainAction(action: any) {
  await runtime.handleChainAction(action)
}
