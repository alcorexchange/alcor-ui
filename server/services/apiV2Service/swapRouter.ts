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
const CACHE_TTL = 5000 // 3 секунды TTL для кеша

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

subscriber.connect().then(() => {
  subscriber.subscribe('swap:pool:instanceUpdated', async msg => {
    const { chain, buffer } = JSON.parse(msg)
    const pool = Pool.fromBuffer(Buffer.from(buffer, 'hex'))

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
    POOLS[chain] = await POOLS_LOADING_PROMISES[chain]
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
})

export default swapRouter
