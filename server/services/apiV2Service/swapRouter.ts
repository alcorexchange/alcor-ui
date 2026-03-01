import { performance } from 'perf_hooks'

import { TradeType, Trade, Percent, Token, Pool, Route, computeAllRoutes } from '@alcorexchange/alcor-swap-sdk'
import { Router } from 'express'
import { tryParseCurrencyAmount } from '../../../utils/amm'
import { getPools } from '../swapV2Service/utils'
import { parseTrade } from './utils'
import { getRedis, getSubscriber } from '../redis'

export const swapRouter = Router()

const TRADE_LIMITS = { maxNumResults: 1, maxHops: 3 }
const ROUTES_CACHE_TIMEOUT_SECONDS = 60 * 60 * 24 * 20 // 20 дней
const ROUTES_UPDATING_TIMEOUT_SECONDS = 60 * 15
const ON_DEMAND_QUEUE_KEY = 'routes_on_demand_queue'
const ON_DEMAND_QUEUE_LOCK_KEY = 'routes_on_demand_queue_lock'
const ON_DEMAND_QUEUE_LOCK_TTL_SECONDS = 120
const ON_DEMAND_QUEUE_JOB_TTL_SECONDS = 60 * 5
const ON_DEMAND_WAIT_TIMEOUT_MS = 300000
const ON_DEMAND_WAIT_STEP_MS = 500
const ON_DEMAND_EMPTY_COOLDOWN_SECONDS = 20
const PROCESS_INSTANCE_ID = `${process.pid}-${Math.random().toString(36).slice(2, 10)}`
const POOLS = {}
const POOLS_LOADING_PROMISES = {}
const TOKEN_INDEX = {} // { chain: Map<tokenId, Token> }
const TRADE_CACHE = new Map() // Кеш для результатов trade
const CACHE_TTL = 5000 // 3 секунды TTL для кеша
let queueProcessorPromise: Promise<void> | null = null

interface OnDemandRouteJob {
  chain: string
  inputTokenId: string
  outputTokenId: string
  maxHops: number
  cacheKey: string
}

// Статистика по источникам запросов
const REQUEST_STATS = new Map() // origin -> { count, lastSeen, routes: Map }
const STATS_WINDOW = 60 * 60 * 1000 // 1 час окно статистики

// Функция для очистки старой статистики
function cleanRequestStats() {
  const now = Date.now()
  for (const [origin, stats] of REQUEST_STATS.entries()) {
    if (now - stats.lastSeen > STATS_WINDOW) {
      REQUEST_STATS.delete(origin)
    }
  }
}

// Функция для записи статистики
function recordRequestStats(origin, route) {
  if (!origin) origin = 'direct'

  if (!REQUEST_STATS.has(origin)) {
    REQUEST_STATS.set(origin, {
      count: 0,
      lastSeen: Date.now(),
      routes: new Map()
    })
  }

  const stats = REQUEST_STATS.get(origin)
  stats.count++
  stats.lastSeen = Date.now()

  // Считаем популярные роуты для каждого источника
  const routeKey = route
  stats.routes.set(routeKey, (stats.routes.get(routeKey) || 0) + 1)

  // Периодически чистим старую статистику
  if (REQUEST_STATS.size > 1000) {
    cleanRequestStats()
  }
}

// Subscribe после инициализации Redis (вызывается из index.ts)
export function initSwapRouterSubscriptions() {
  getSubscriber().subscribe('swap:pool:instanceUpdated', async msg => {
    const { chain, pool: poolJson } = JSON.parse(msg)
    const pool = Pool.fromJSON(poolJson)

    if (!POOLS[chain]) return getAllPools(chain)

    if (!pool) {
      console.warn('ADDING NULL POOL TO POOLS MAP!', pool)
    }

    POOLS[chain].set(pool.id, pool)

    // Обновляем индекс токенов
    if (TOKEN_INDEX[chain]) {
      TOKEN_INDEX[chain].set(pool.tokenA.id, pool.tokenA)
      TOKEN_INDEX[chain].set(pool.tokenB.id, pool.tokenB)
    }
  })
}

async function getAllPools(chain) {
  if (!POOLS[chain]) {
    // Если промис загрузки еще не существует, создаем его
    POOLS_LOADING_PROMISES[chain] =
      POOLS_LOADING_PROMISES[chain] ||
      (async () => {
        const pools = await getPools(chain, true, (p) => p.active)
        POOLS[chain] = new Map(pools.map((p) => [p.id, p]))

        // Создаем индекс токенов для быстрого поиска
        // Берём токен только из пулов с ликвидностью, чтобы избежать мусорных пулов с неправильными decimals
        TOKEN_INDEX[chain] = new Map()
        for (const pool of pools) {
          if (BigInt(pool.liquidity || 0) > BigInt(0)) {
            if (!TOKEN_INDEX[chain].has(pool.tokenA.id)) {
              TOKEN_INDEX[chain].set(pool.tokenA.id, pool.tokenA)
            }
            if (!TOKEN_INDEX[chain].has(pool.tokenB.id)) {
              TOKEN_INDEX[chain].set(pool.tokenB.id, pool.tokenB)
            }
          }
        }
        // Fallback для токенов которые есть только в пулах без ликвидности
        for (const pool of pools) {
          if (!TOKEN_INDEX[chain].has(pool.tokenA.id)) {
            TOKEN_INDEX[chain].set(pool.tokenA.id, pool.tokenA)
          }
          if (!TOKEN_INDEX[chain].has(pool.tokenB.id)) {
            TOKEN_INDEX[chain].set(pool.tokenB.id, pool.tokenB)
          }
        }

        console.log(POOLS[chain].size, 'initial', chain, 'pools fetched')
        delete POOLS_LOADING_PROMISES[chain] // Очищаем промис после завершения
        return POOLS[chain]
      })()
    // Ждем завершения загрузки
    POOLS[chain] = await POOLS_LOADING_PROMISES[chain]
  }
  return POOLS[chain]
}

async function getCachedRoutes(chain, inputToken, outputToken, maxHops = 2, allPoolsMap: Map<any, Pool> | null = null) {
  const cacheKey = `${chain}-${inputToken.id}-${outputToken.id}-${maxHops}`
  const redisRoutes = await getRedis().get('routes_' + cacheKey)

  if (!redisRoutes) {
    // Создаем пустой кеш с истекшим временем, чтобы updater подхватил его
    console.log(`[CACHE] Creating empty cache entry for: ${cacheKey}`)
    await getRedis().set('routes_' + cacheKey, JSON.stringify([]))
    // Устанавливаем время истечения в прошлое (1 час назад)
    await getRedis().set('routes_expiration_' + cacheKey, (Date.now() - 60 * 60 * 1000).toString())
    return { routes: [], cacheKey, cacheMiss: true, cacheEmpty: true }
  }

  const allPools = allPoolsMap || await getAllPools(chain)
  const routes = parseRoutesFromRedis(cacheKey, redisRoutes, allPools, inputToken, outputToken)

  // Если кеш пустой, помечаем как expired для пересчёта и возвращаем
  if (routes.length === 0) {
    // Устанавливаем время истечения в прошлое чтобы updater пересчитал
    await getRedis().set('routes_expiration_' + cacheKey, (Date.now() - 60 * 60 * 1000).toString())
    return { routes, cacheKey, cacheMiss: false, cacheEmpty: true }
  }

  return { routes, cacheKey, cacheMiss: false, cacheEmpty: false }
}

function parseRoutesFromRedis(cacheKey, redisRoutes, allPools, inputToken, outputToken) {
  let parsedRoutes = []
  const routes = []

  try {
    parsedRoutes = JSON.parse(redisRoutes)
  } catch (e) {
    console.error(`[ROUTES] Failed to parse routes from redis for ${cacheKey}:`, e.message)
    return routes
  }

  if (!parsedRoutes || parsedRoutes.length === 0) {
    return routes
  }

  for (const route of parsedRoutes) {
    // Backward compatibility: старый формат {pools: [id]} | новый формат [id, id]
    const poolIds = Array.isArray(route) ? route : route.pools
    const pools = poolIds.map(p => allPools.get(p))
    const poolsValid = pools.every(p => p != undefined && p.active && p.tickDataProvider.ticks.length > 0)

    if (poolsValid) {
      routes.push(new Route(pools, inputToken, outputToken))
    }
  }

  return routes
}

async function readCachedRoutesWithoutTouchingExpiration(chain, inputToken, outputToken, maxHops = 2, allPoolsMap: Map<any, Pool> | null = null) {
  const cacheKey = `${chain}-${inputToken.id}-${outputToken.id}-${maxHops}`
  const redisRoutes = await getRedis().get('routes_' + cacheKey)
  if (!redisRoutes) {
    return []
  }

  const allPools = allPoolsMap || await getAllPools(chain)
  return parseRoutesFromRedis(cacheKey, redisRoutes, allPools, inputToken, outputToken)
}

// Оптимизированный поиск токенов через индекс O(1)
function findToken(chain, tokenID) {
  return TOKEN_INDEX[chain]?.get(tokenID)
}

// Функция для очистки кеша
function cleanTradeCache() {
  const now = Date.now()
  for (const [key, value] of TRADE_CACHE.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      TRADE_CACHE.delete(key)
    }
  }
}

async function computeRoutesOnDemand(
  chain,
  inputToken,
  outputToken,
  maxHops,
  allPools: Map<any, Pool>,
  cacheKey
) {
  const startTime = performance.now()

  const pools = (Array.from(allPools.values()) as any[]).filter(
    (p) => Boolean(p && p.active && p.tickDataProvider?.ticks?.length > 0)
  )
  const poolsForRoutes = pools as Pool[]

  let routes: Route<Token, Token>[] = []
  try {
    routes = computeAllRoutes(inputToken, outputToken, poolsForRoutes, maxHops) as Route<Token, Token>[]
  } catch (e) {
    console.error(`[ROUTES] On-demand compute failed for ${cacheKey}:`, e.message)
    return []
  }

  if (routes.length > 0) {
    const redisRoutes = routes.map(({ pools }) => pools.map(p => p.id))
    await getRedis().set('routes_' + cacheKey, JSON.stringify(redisRoutes))
    await getRedis().set('routes_expiration_' + cacheKey, (Date.now() + ROUTES_CACHE_TIMEOUT_SECONDS * 1000).toString())
  }

  const endTime = performance.now()
  console.log(`[ROUTES] On-demand compute: ${cacheKey} -> ${routes.length} routes in ${Math.round(endTime - startTime)}ms`)

  return routes
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function onDemandEnqueuedKey(cacheKey: string) {
  return `routes_on_demand_enqueued_${cacheKey}`
}

function onDemandCooldownKey(cacheKey: string) {
  return `routes_on_demand_cooldown_${cacheKey}`
}

async function enqueueOnDemandRoute(job: OnDemandRouteJob) {
  const redis = getRedis()
  const enqueuedKey = onDemandEnqueuedKey(job.cacheKey)

  // Если недавно уже считали и не нашли роутов, не заспамливаем очередь.
  if (await redis.get(onDemandCooldownKey(job.cacheKey))) {
    console.log(`[ROUTES] On-demand skip (cooldown): ${job.cacheKey}`)
    return { enqueued: false, reason: 'cooldown' }
  }

  const setResult = await redis.set(enqueuedKey, PROCESS_INSTANCE_ID, { EX: ON_DEMAND_QUEUE_JOB_TTL_SECONDS, NX: true })
  if (setResult !== 'OK') {
    const queueSize = await redis.lLen(ON_DEMAND_QUEUE_KEY)
    console.log(`[ROUTES] On-demand already queued: ${job.cacheKey} | queue size: ${queueSize}`)
    return { enqueued: false, reason: 'already_queued' }
  }

  try {
    const queueSize = await redis.rPush(ON_DEMAND_QUEUE_KEY, JSON.stringify(job))
    const position = queueSize
    console.log(`[ROUTES] On-demand queued: ${job.cacheKey} | position: ${position}/${queueSize}`)
    return { enqueued: true, reason: 'queued' }
  } catch (e) {
    await redis.del(enqueuedKey)
    throw e
  }
}

async function releaseQueueLock(lockValue: string) {
  const redis = getRedis()
  const current = await redis.get(ON_DEMAND_QUEUE_LOCK_KEY)
  if (current === lockValue) {
    await redis.del(ON_DEMAND_QUEUE_LOCK_KEY)
  }
}

async function processQueuedOnDemandRoute(job: OnDemandRouteJob) {
  const redis = getRedis()
  const { chain, inputTokenId, outputTokenId, maxHops, cacheKey } = job
  const updatingKey = 'updating_' + cacheKey

  try {
    const allPools = await getAllPools(chain)
    const inputToken = findToken(chain, inputTokenId)
    const outputToken = findToken(chain, outputTokenId)

    if (!inputToken || !outputToken || inputToken.equals(outputToken)) {
      return
    }

    const routesInCache = await readCachedRoutesWithoutTouchingExpiration(chain, inputToken, outputToken, maxHops, allPools)
    if (routesInCache.length > 0) {
      return
    }

    const lockSet = await redis.set(updatingKey, PROCESS_INSTANCE_ID, { EX: ROUTES_UPDATING_TIMEOUT_SECONDS, NX: true })
    if (lockSet !== 'OK') {
      return
    }

    try {
      const routes = await computeRoutesOnDemand(chain, inputToken, outputToken, maxHops, allPools, cacheKey)
      if (routes.length === 0) {
        await redis.set(onDemandCooldownKey(cacheKey), Date.now().toString(), { EX: ON_DEMAND_EMPTY_COOLDOWN_SECONDS })
      }
    } finally {
      await redis.del(updatingKey)
    }
  } catch (e) {
    console.error(`[ROUTES] Failed to process queued job ${cacheKey}:`, e.message)
  } finally {
    await redis.del(onDemandEnqueuedKey(cacheKey))
  }
}

function startOnDemandQueueProcessor() {
  if (queueProcessorPromise) return queueProcessorPromise

  queueProcessorPromise = (async () => {
    const redis = getRedis()
    const lockValue = `${PROCESS_INSTANCE_ID}:${Date.now()}`
    const lockSet = await redis.set(ON_DEMAND_QUEUE_LOCK_KEY, lockValue, { EX: ON_DEMAND_QUEUE_LOCK_TTL_SECONDS, NX: true })

    if (lockSet !== 'OK') {
      return
    }

    try {
      while (true) {
        const rawJob = await redis.lPop(ON_DEMAND_QUEUE_KEY)
        if (!rawJob) break

        await redis.expire(ON_DEMAND_QUEUE_LOCK_KEY, ON_DEMAND_QUEUE_LOCK_TTL_SECONDS)

        let job: OnDemandRouteJob
        try {
          job = JSON.parse(rawJob)
        } catch (e) {
          console.error('[ROUTES] Invalid on-demand queue payload:', e.message)
          continue
        }

        if (!job?.cacheKey || !job?.chain || !job?.inputTokenId || !job?.outputTokenId) {
          continue
        }

        const queueLeft = await redis.lLen(ON_DEMAND_QUEUE_KEY)
        console.log(`[ROUTES] On-demand processing: ${job.cacheKey} | left in queue: ${queueLeft}`)

        await processQueuedOnDemandRoute(job)
        await redis.expire(ON_DEMAND_QUEUE_LOCK_KEY, ON_DEMAND_QUEUE_LOCK_TTL_SECONDS)
      }
    } finally {
      await releaseQueueLock(lockValue)
    }
  })()
    .catch((e) => {
      console.error('[ROUTES] On-demand queue processor failed:', e.message)
    })
    .finally(() => {
      queueProcessorPromise = null
    })

  return queueProcessorPromise
}

async function waitForQueuedRoutes(chain, inputToken, outputToken, maxHops, cacheKey, allPools) {
  const startAt = Date.now()
  while (Date.now() - startAt < ON_DEMAND_WAIT_TIMEOUT_MS) {
    const routesInCache = await readCachedRoutesWithoutTouchingExpiration(chain, inputToken, outputToken, maxHops, allPools)
    if (routesInCache.length > 0) {
      return routesInCache
    }

    const enqueued = await getRedis().get(onDemandEnqueuedKey(cacheKey))
    if (!enqueued) {
      break
    }

    await sleep(ON_DEMAND_WAIT_STEP_MS)
  }

  return []
}

// Эндпоинт для просмотра статистики
swapRouter.get('/stats', async (req, res) => {
  const stats = []

  // Чистим старую статистику перед показом
  cleanRequestStats()

  for (const [origin, data] of REQUEST_STATS.entries()) {
    const topRoutes = Array.from(data.routes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([route, count]) => ({ route, count }))

    stats.push({
      origin,
      count: data.count,
      lastSeen: new Date(data.lastSeen).toISOString(),
      topRoutes
    })
  }

  // Сортируем по количеству запросов
  stats.sort((a, b) => b.count - a.count)

  res.json({
    totalOrigins: stats.length,
    totalRequests: stats.reduce((sum, s) => sum + s.count, 0),
    window: '1 hour',
    stats: stats.slice(0, 50) // Топ 50 источников
  })
})

swapRouter.get('/getRoute', async (req, res) => {
  const network = req.app.get('network')
  let {
    v2,
    trade_type,
    input,
    output,
    amount,
    slippage,
    receiver = '<receiver>',
    maxHops,
    includePoolDetails
  } = <any>req.query

  if (!trade_type || !input || !output) {
    return res.status(403).send('Invalid request')
  }

  if (isNaN(amount)) {
    return res.status(403).send('Invalid amount')
  }

  slippage = slippage ? new Percent(parseFloat(slippage) * 100, 10000) : new Percent(30, 10000)

  maxHops = Math.min(3, !isNaN(parseInt(maxHops)) ? parseInt(maxHops) : TRADE_LIMITS.maxHops)
  includePoolDetails = includePoolDetails === true || includePoolDetails === 'true'

  const exactIn = trade_type === 'EXACT_INPUT'

  // Создаем ключ для кеша
  const tradeCacheKey = `${network.name}-${input}-${output}-${amount}-${trade_type}-${maxHops}-${slippage.toSignificant()}-${v2}-${includePoolDetails}`

  // Проверяем кеш
  const cached = TRADE_CACHE.get(tradeCacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const origin = req.headers['origin'] || req.headers['referer'] || 'direct'
    const routeInfo = `${input}->${output}`
    recordRequestStats(origin, routeInfo)
    console.log(`Cache hit for ${input} -> ${output} from ${origin}`)
    return res.json(cached.data)
  }

  const startTime = performance.now()

  const allPools = await getAllPools(network.name)

  const inputToken = findToken(network.name, input)
  const outputToken = findToken(network.name, output)

  if (!inputToken || !outputToken || inputToken.equals(outputToken)) {
    return res.status(403).send('Invalid input/output')
  }

  try {
    amount = tryParseCurrencyAmount(amount, exactIn ? inputToken : outputToken)
  } catch (e) {
    return res.status(403).send(e.message)
  }

  if (!amount) {
    return res.status(403).send('Invalid amount')
  }

  let cachedRoutes = []
  let cacheKey = ''
  try {
    const cachedRoutesInfo = await getCachedRoutes(
      network.name,
      inputToken,
      outputToken,
      maxHops,
      allPools
    )
    cachedRoutes = cachedRoutesInfo.routes
    cacheKey = cachedRoutesInfo.cacheKey
  } catch (e) {
    console.error('Error getting cached routes:', e.message)
    return res.status(500).send('Service temporarily unavailable')
  }

  if (cachedRoutes.length == 0) {
    console.log(`[ROUTES] Cache empty: ${network.name} ${inputToken.symbol}(${inputToken.id}) -> ${outputToken.symbol}(${outputToken.id}) maxHops:${maxHops}`)
    const effectiveCacheKey = cacheKey || `${network.name}-${inputToken.id}-${outputToken.id}-${maxHops}`

    try {
      const queueResult = await enqueueOnDemandRoute({
        chain: network.name,
        inputTokenId: inputToken.id,
        outputTokenId: outputToken.id,
        maxHops,
        cacheKey: effectiveCacheKey
      })

      startOnDemandQueueProcessor()

      if (queueResult.reason !== 'cooldown') {
        cachedRoutes = await waitForQueuedRoutes(
          network.name,
          inputToken,
          outputToken,
          maxHops,
          effectiveCacheKey,
          allPools
        )
      }
    } catch (e) {
      console.error('Error computing routes on-demand:', e.message)
    }
  }

  if (cachedRoutes.length == 0) {
    // Более информативная ошибка
    console.log(`No routes available: ${network.name} ${inputToken.symbol}(${inputToken.id}) -> ${outputToken.symbol}(${outputToken.id}) maxHops:${maxHops}`)
    return res.status(404).send('No trading route available. Try again in a few moments.')
  }

  //cachedRoutes.sort((a, b) => a.midPrice.greaterThan(b.midPrice) ? -1 : 1)

  let trade
  try {
    if (v2) {
      trade = Trade.bestTradeWithSplit(
        cachedRoutes,
        amount,
        maxHops > 2 ? [25, 50, 75, 100] : [5, 10, 15, 25, 50, 75, 100],
        //[5, 10, 15, 25, 50, 75, 100],
        exactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
        { minSplits: 1, maxSplits: 10 }
      )
    } else {
      ;[trade] = exactIn
        ? Trade.bestTradeExactIn(cachedRoutes, amount)
        : Trade.bestTradeExactOut(cachedRoutes, amount)
    }
  } catch (e) {
    console.error('GET ROUTE ERROR', e)
    return res.status(403).send('Get Route error: ' + e.message)
  }

  const endTime = performance.now()

  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  const origin = req.headers['origin'] || req.headers['referer'] || 'direct'

  // Извлекаем домен или IP для direct calls
  let source
  if (origin === 'direct') {
    // Если direct call, показываем IP
    const ipString = Array.isArray(clientIp) ? clientIp[0] : clientIp
    source = ipString ? ipString.split(',')[0].trim() : 'unknown'
  } else {
    // Если есть origin/referer, показываем домен
    source = new URL(origin).hostname
  }

  // Записываем статистику
  const routeInfo = `${inputToken.symbol}->${outputToken.symbol}`
  recordRequestStats(origin, routeInfo)

  console.log(
    `[${network.name.toUpperCase()}] ${Math.round(endTime - startTime)}ms | ${inputToken.symbol} → ${outputToken.symbol} | h${maxHops} | ${source}`
  )

  if (!trade) {
    return res.status(403).send('No route found')
  }

  const parsedTrade = parseTrade(trade, slippage, receiver, includePoolDetails)

  // Сохраняем результат в кеш
  TRADE_CACHE.set(tradeCacheKey, {
    data: parsedTrade,
    timestamp: Date.now()
  })

  // Периодически чистим кеш
  if (TRADE_CACHE.size > 1000) {
    cleanTradeCache()
  }

  return res.json(parsedTrade)
})

export default swapRouter
