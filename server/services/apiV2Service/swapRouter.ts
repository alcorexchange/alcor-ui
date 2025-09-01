import { performance } from 'perf_hooks'

import { createClient } from 'redis'
import { TradeType, Trade, Percent, Token, Pool, Route } from '@alcorexchange/alcor-swap-sdk'
import { Router } from 'express'
import { tryParseCurrencyAmount } from '../../../utils/amm'
import { getPools } from '../swapV2Service/utils'
import { parseTrade } from './utils'

export const swapRouter = Router()

const redisClient = createClient()
const subscriber = createClient()

// Подключаемся к Redis один раз при старте
redisClient.connect().catch(console.error)

const connectRedis = async (client) => {
  if (!client.isOpen) {
    await client.connect()
  }
}

const TRADE_LIMITS = { maxNumResults: 1, maxHops: 3 }
const POOLS = {}
const POOLS_LOADING_PROMISES = {}
const TOKEN_INDEX = {} // { chain: Map<tokenId, Token> }
const TRADE_CACHE = new Map() // Кеш для результатов trade
const CACHE_TTL = 3000 // 3 секунды TTL для кеша

// PM2 Instance configuration
const INSTANCE_ID = parseInt(process.env.NODE_APP_INSTANCE || '0')
const TOTAL_INSTANCES = parseInt(process.env.instances || '10')
const INSTANCE_ROLE = INSTANCE_ID < 5 ? 'user' : 'api' // 0-4 для Alcor users (5 инстансов), 5-9 для Direct API (5 инстансов)

console.log(`[PM2] Instance ${INSTANCE_ID} of ${TOTAL_INSTANCES} started as role: ${INSTANCE_ROLE}`)

// Предзагрузка пулов основных сетей при старте
const PRELOAD_CHAINS = ['wax', 'proton', 'eos', 'telos']

setTimeout(async () => {
  console.log(`[Instance ${INSTANCE_ID}] Starting pools preload for: ${PRELOAD_CHAINS.join(', ')}`)
  for (const chain of PRELOAD_CHAINS) {
    try {
      await getAllPools(chain)
      console.log(`[Instance ${INSTANCE_ID}] Loaded ${POOLS[chain]?.size || 0} pools, ${TOKEN_INDEX[chain]?.size || 0} tokens for ${chain}`)
    } catch (e) {
      console.error(`[Instance ${INSTANCE_ID}] Failed to preload ${chain}:`, e.message)
    }
  }
  console.log(`[Instance ${INSTANCE_ID}] Preloading complete`)
}, 5000) // 5 секунд задержка чтобы не нагружать старт

// Статистика по источникам запросов
const REQUEST_STATS = new Map() // origin -> { count, lastSeen, routes: Map }
const STATS_WINDOW = 60 * 60 * 1000 // 1 час окно статистики

// Система приоритетов для запросов
const REQUEST_QUEUE = []
const MAX_CONCURRENT_REQUESTS = 10 // Максимум параллельных запросов
let ACTIVE_REQUESTS = 0

// Определение приоритета по источнику
function getRequestPriority(origin) {
  if (!origin || origin === 'direct') return 0 // Низкий приоритет для direct API
  if (origin.includes('alcor.exchange')) return 2 // Высокий приоритет для Alcor
  return 1 // Средний приоритет для остальных
}

// Обработка очереди запросов
async function processRequestQueue() {
  while (REQUEST_QUEUE.length > 0 && ACTIVE_REQUESTS < MAX_CONCURRENT_REQUESTS) {
    // Сортируем очередь по приоритету (высокий приоритет первый)
    REQUEST_QUEUE.sort((a, b) => b.priority - a.priority)

    const request = REQUEST_QUEUE.shift()
    if (!request) break

    ACTIVE_REQUESTS++

    // Выполняем запрос асинхронно
    request.execute().finally(() => {
      ACTIVE_REQUESTS--
      // Запускаем обработку следующего запроса из очереди
      processRequestQueue()
    })
  }
}

// Функция для добавления запроса в очередь
function queueRequest(priority, executeFunc) {
  return new Promise((resolve, reject) => {
    const request = {
      priority,
      timestamp: Date.now(),
      execute: async () => {
        try {
          const result = await executeFunc()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }
    }

    REQUEST_QUEUE.push(request)
    processRequestQueue()
  })
}

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

subscriber.connect().then(() => {
  subscriber.subscribe('swap:pool:instanceUpdated', async msg => {
    const { chain, buffer } = JSON.parse(msg)
    const pool = Pool.fromBuffer(Buffer.from(buffer, 'hex'))

    if (!POOLS[chain]) return getAllPools(chain)

    if (!pool) {
      console.warn('ADDING NULL POOL TO POOLS MAP!', pool)
    }

    POOLS[chain].set(pool.id, pool)

    // Создаем индекс если его нет
    if (!TOKEN_INDEX[chain]) {
      console.log(`[Instance ${INSTANCE_ID}] Creating TOKEN_INDEX for chain ${chain} from subscriber`)
      TOKEN_INDEX[chain] = new Map()
    }

    // Обновляем индекс токенов
    TOKEN_INDEX[chain].set(pool.tokenA.id, pool.tokenA)
    TOKEN_INDEX[chain].set(pool.tokenB.id, pool.tokenB)
  })
})

async function getAllPools(chain) {
  if (!POOLS[chain]) {
    // Если промис загрузки еще не существует, создаем его
    POOLS_LOADING_PROMISES[chain] =
      POOLS_LOADING_PROMISES[chain] ||
      (async () => {
        const pools = await getPools(chain, true, (p) => p.active)
        POOLS[chain] = new Map(pools.map((p) => [p.id, p]))

        // Создаем индекс токенов для быстрого поиска
        TOKEN_INDEX[chain] = new Map()
        for (const pool of pools) {
          TOKEN_INDEX[chain].set(pool.tokenA.id, pool.tokenA)
          TOKEN_INDEX[chain].set(pool.tokenB.id, pool.tokenB)
        }

        console.log(POOLS[chain].size, 'initial', chain, 'pools fetched')
        delete POOLS_LOADING_PROMISES[chain] // Очищаем промис после завершения
        return POOLS[chain]
      })()
    // Ждем завершения загрузки
    await POOLS_LOADING_PROMISES[chain]
  }

  // Гарантируем что TOKEN_INDEX существует даже если был создан через subscriber
  if (!TOKEN_INDEX[chain] && POOLS[chain]) {
    console.log(`[Instance ${INSTANCE_ID}] TOKEN_INDEX missing, rebuilding from ${POOLS[chain].size} pools`)
    TOKEN_INDEX[chain] = new Map()
    for (const pool of POOLS[chain].values()) {
      TOKEN_INDEX[chain].set(pool.tokenA.id, pool.tokenA)
      TOKEN_INDEX[chain].set(pool.tokenB.id, pool.tokenB)
    }
  }

  // Проверка консистентности
  if (POOLS[chain] && POOLS[chain].size > 0 && (!TOKEN_INDEX[chain] || TOKEN_INDEX[chain].size === 0)) {
    console.error(`[Instance ${INSTANCE_ID}][CRITICAL] TOKEN_INDEX empty but POOLS has ${POOLS[chain].size} pools!`)
  }

  return POOLS[chain]
}

async function getCachedRoutes(chain, inputToken, outputToken, maxHops = 2) {
  // Redis уже подключен при старте, не нужно переподключаться
  if (!redisClient.isOpen) {
    await connectRedis(redisClient)
  }

  const cacheKey = `${chain}-${inputToken.id}-${outputToken.id}-${maxHops}`
  const redisRoutes = await redisClient.get('routes_' + cacheKey)

  if (!redisRoutes) {
    // Создаем пустой кеш с истекшим временем, чтобы updater подхватил его
    console.log(`[CACHE] Creating empty cache entry for: ${cacheKey}`)
    await redisClient.set('routes_' + cacheKey, JSON.stringify([]))
    // Устанавливаем время истечения в прошлое (1 час назад)
    await redisClient.set('routes_expiration_' + cacheKey, (Date.now() - 60 * 60 * 1000).toString())
    return [] // Возвращаем пустой массив вместо ошибки
  }

  const allPools = await getAllPools(chain)
  const routes = []
  const parsedRoutes = JSON.parse(redisRoutes)

  // Если кеш пустой, возвращаем сразу
  if (!parsedRoutes || parsedRoutes.length === 0) {
    return routes
  }

  for (const route of parsedRoutes) {
    const pools = route.pools.map(p => allPools.get(p))
    const poolsValid = pools.every(p => p != undefined && p.active && p.tickDataProvider.ticks.length > 0)

    if (poolsValid) {
      routes.push(new Route(pools, inputToken, outputToken))
    }
  }

  return routes
}

// Оптимизированный поиск токенов через индекс O(1)
function findToken(chain, tokenID) {
  // Пробуем индекс
  let token = TOKEN_INDEX[chain]?.get(tokenID)

  // Если индекс пустой но пулы есть - пересоздаем индекс
  if (!token && POOLS[chain] && (!TOKEN_INDEX[chain] || TOKEN_INDEX[chain].size === 0)) {
    console.log(`[TOKEN_INDEX] Rebuilding index for chain ${chain}`)
    TOKEN_INDEX[chain] = new Map()
    for (const pool of POOLS[chain].values()) {
      TOKEN_INDEX[chain].set(pool.tokenA.id, pool.tokenA)
      TOKEN_INDEX[chain].set(pool.tokenB.id, pool.tokenB)
    }
    token = TOKEN_INDEX[chain].get(tokenID)
  }

  return token
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

// Эндпоинт для просмотра статистики
swapRouter.get('/stats', async (req, res) => {
  const stats = []
  const queueInfo = {
    queueLength: REQUEST_QUEUE.length,
    activeRequests: ACTIVE_REQUESTS,
    maxConcurrent: MAX_CONCURRENT_REQUESTS,
    queueByPriority: {
      high: REQUEST_QUEUE.filter(r => r.priority === 2).length,
      medium: REQUEST_QUEUE.filter(r => r.priority === 1).length,
      low: REQUEST_QUEUE.filter(r => r.priority === 0).length
    }
  }

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
    instance: {
      id: INSTANCE_ID,
      role: INSTANCE_ROLE,
      total: TOTAL_INSTANCES
    },
    queue: queueInfo,
    stats: stats.slice(0, 50) // Топ 50 источников
  })
})

swapRouter.get('/getRoute', async (req, res) => {
  const origin = req.headers['origin'] || req.headers['referer'] || 'direct'
  const priority = getRequestPriority(origin)

  // Адаптивная обработка в зависимости от роли инстанса
  if (INSTANCE_ROLE === 'user') {
    // Инстансы 0-1: приоритет для Alcor
    if (priority === 0 && REQUEST_QUEUE.length > 5) {
      // Добавляем задержку для direct запросов на user инстансах
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  } else {
    // Инстансы 2-9: приоритет для Direct API
    if (priority > 0) {
      // Добавляем задержку для Alcor запросов на API инстансах
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Обрабатываем запрос через очередь с приоритетом
  try {
    const result = await queueRequest(priority, async () => {
      return processRouteRequest(req, res, origin)
    })
    return result
  } catch (error) {
    console.error('Route request error:', error)
    return res.status(500).send('Internal server error')
  }
})

// Основная логика обработки запроса вынесена в отдельную функцию
async function processRouteRequest(req, res, origin) {
  const network = req.app.get('network')
  let { v2, trade_type, input, output, amount, slippage, receiver = '<receiver>', maxHops } = <any>req.query

  if (!trade_type || !input || !output) {
    return res.status(403).send('Invalid request')
  }

  if (isNaN(amount)) {
    return res.status(403).send('Invalid amount')
  }

  slippage = slippage ? new Percent(parseFloat(slippage) * 100, 10000) : new Percent(30, 10000)

  maxHops = Math.min(3, !isNaN(parseInt(maxHops)) ? parseInt(maxHops) : TRADE_LIMITS.maxHops)

  const exactIn = trade_type === 'EXACT_INPUT'

  // Создаем ключ для кеша
  const cacheKey = `${network.name}-${input}-${output}-${amount}-${trade_type}-${maxHops}-${slippage.toSignificant()}-${v2}`

  // Проверяем кеш
  const cached = TRADE_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const routeInfo = `${input}->${output}`
    recordRequestStats(origin, routeInfo)
    console.log(`Cache hit for ${input} -> ${output} from ${origin}`)
    return res.json(cached.data)
  }

  const startTime = performance.now()

  console.log(`[Instance ${INSTANCE_ID}] Before getAllPools - Pools: ${POOLS[network.name]?.size || 0}, Index: ${TOKEN_INDEX[network.name]?.size || 0}`)
  const allPools = await getAllPools(network.name)
  console.log(`[Instance ${INSTANCE_ID}] After getAllPools - Pools: ${POOLS[network.name]?.size || 0}, Index: ${TOKEN_INDEX[network.name]?.size || 0}`)

  const inputToken = findToken(network.name, input)
  const outputToken = findToken(network.name, output)

  if (!inputToken || !outputToken || inputToken.equals(outputToken)) {
    console.log(`[Token not found] chain: ${network.name}, input: ${input} (found: ${!!inputToken}), output: ${output} (found: ${!!outputToken})`)
    console.log(`[TOKEN_INDEX] size: ${TOKEN_INDEX[network.name]?.size || 0}, POOLS size: ${POOLS[network.name]?.size || 0}`)
    return res.status(403).send('Invalid input/output')
  }

  try {
    // Нормализуем amount - убираем лишние нули после точки
    const normalizedAmount = parseFloat(amount).toString()
    amount = tryParseCurrencyAmount(normalizedAmount, exactIn ? inputToken : outputToken)
  } catch (e) {
    console.log(`[Amount parse error] amount: ${amount}, token: ${exactIn ? inputToken.symbol : outputToken.symbol}, error: ${e.message}`)
    return res.status(403).send(e.message)
  }

  if (!amount) {
    console.log(`[Invalid amount] original: ${req.query.amount}, normalized: ${parseFloat(req.query.amount).toString()}`)
    return res.status(403).send('Invalid amount')
  }

  let cachedRoutes = []
  try {
    cachedRoutes = await getCachedRoutes(
      network.name,
      inputToken,
      outputToken,
      maxHops
    )
  } catch (e) {
    console.error('Error getting cached routes:', e.message)
    return res.status(500).send('Service temporarily unavailable')
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
  const userAgent = req.headers['user-agent'] || 'unknown'

  // Записываем статистику
  const routeInfo = `${inputToken.symbol}->${outputToken.symbol}`
  recordRequestStats(origin, routeInfo)

  console.log(
    network.name,
    `[Instance ${INSTANCE_ID}] find route ${maxHops} hop ${Math.round(
      endTime - startTime
    )} ms ${inputToken.symbol} -> ${outputToken.symbol} v2: ${Boolean(v2)} amount: ${amount.toSignificant()} origin: ${origin} IP: ${clientIp}`
  )

  if (!trade) {
    return res.status(403).send('No route found')
  }

  const parsedTrade = parseTrade(trade, slippage, receiver)

  // Сохраняем результат в кеш
  TRADE_CACHE.set(cacheKey, {
    data: parsedTrade,
    timestamp: Date.now()
  })

  // Периодически чистим кеш
  if (TRADE_CACHE.size > 1000) {
    cleanTradeCache()
  }

  return res.json(parsedTrade)
}

export default swapRouter
