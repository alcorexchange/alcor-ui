require('dotenv').config()

import { performance } from 'perf_hooks'
import workerpool from 'workerpool'
import { createClient } from 'redis'
import { Token, Pool, Route } from '@alcorexchange/alcor-swap-sdk'

import { getPools } from '../swapV2Service/utils'
import { mongoConnect } from '../../utils'

// КОНФИГУРАЦИЯ
const MAX_WORKERS = 2 // Количество воркеров для вычисления роутов
const CHECK_INTERVAL = 30000 // Интервал между проверками (30 сек)
const ROUTES_CACHE_TIMEOUT = 60 * 60 * 24 * 5 // 3 дня в секундах
const ROUTES_UPDATING_TIMEOUT = 60 * 15 // 15 минут
const NETWORKS = ['eos', 'proton', 'ux', 'wax', 'telos', 'ultra']
const EXPIRING_SOON_THRESHOLD = 60 * 60 // Обновляем роуты, истекающие в течение часа

// Redis клиент
const redisClient = createClient()

// Worker pool для вычислений
const pool = workerpool.pool('./server/services/apiV2Service/workers/computeAllRoutesWorker.js', {
  maxWorkers: MAX_WORKERS,
  workerType: 'thread'
})

// Локальный кеш пулов
const POOLS = {}
const POOLS_LOADING_PROMISES = {}

// Флаг для graceful shutdown
let isShuttingDown = false

// Подключение к Redis
async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect()
    console.log('[REDIS] Connected to Redis')
  }
}

// Загрузка всех пулов для сети
async function getAllPools(chain) {
  if (!POOLS[chain]) {
    // Если промис загрузки еще не существует, создаем его
    POOLS_LOADING_PROMISES[chain] =
      POOLS_LOADING_PROMISES[chain] ||
      (async () => {
        console.log(`[POOLS] Loading pools for ${chain}...`)
        const startTime = performance.now()
        const pools = await getPools(chain, true, (p) => p.active)
        POOLS[chain] = new Map(pools.map((p) => [p.id, p]))
        const endTime = performance.now()
        console.log(`[POOLS] Loaded ${POOLS[chain].size} active pools for ${chain} in ${Math.round(endTime - startTime)}ms`)
        delete POOLS_LOADING_PROMISES[chain]
        return POOLS[chain]
      })()
    // Ждем завершения загрузки
    POOLS[chain] = await POOLS_LOADING_PROMISES[chain]
  }
  return POOLS[chain]
}

// Вычисление роутов через воркер
async function computeRoutesInWorker(input, output, pools, maxHops) {
  const workerData = [
    Token.toJSON(input),
    Token.toJSON(output),
    pools.map(p => Pool.toBuffer(p)),
    maxHops
  ]

  try {
    const routes = await pool.exec('computeRoutes', workerData)
    return routes.map((r) => Route.fromBuffer(r))
  } catch (error) {
    console.error('[ERROR] Worker pool error:', error)
    throw error
  }
}

// Обновление кеша для конкретного роута
async function updateCache(chain, pools, input, output, maxHops, cacheKey) {
  const startTime = performance.now()
  const updatingKey = 'updating_' + cacheKey

  try {
    // Устанавливаем флаг обновления
    const setResult = await redisClient.set(updatingKey, 'true', { EX: ROUTES_UPDATING_TIMEOUT, NX: true })
    if (setResult !== 'OK') {
      console.log(`[SKIP] Route ${cacheKey} already updating`)
      return false
    }

    const routes = await computeRoutesInWorker(input, output, pools, maxHops)

    const redisRoutes = routes.map(({ input, output, pools }) => ({
      input: Token.toJSON(input),
      output: Token.toJSON(output),
      pools: pools.map((p) => p.id),
    }))

    await redisClient.set('routes_' + cacheKey, JSON.stringify(redisRoutes))
    await redisClient.set('routes_expiration_' + cacheKey, (Date.now() + ROUTES_CACHE_TIMEOUT * 1000).toString())

    const endTime = performance.now()
    console.log(`[SUCCESS] Route updated: ${cacheKey} in ${Math.round(endTime - startTime)}ms (found ${routes.length} routes)`)
    return true
  } catch (error) {
    console.error(`[ERROR] Failed to update route: ${cacheKey} -`, error.message)
    return false
  } finally {
    await redisClient.del(updatingKey)
  }
}

// Поиск токена в пулах
function findToken(pools, tokenID) {
  return pools.find((p) => p.tokenA.id === tokenID)?.tokenA || pools.find((p) => p.tokenB.id === tokenID)?.tokenB
}

// Парсинг ключа роута
function parseRouteKey(key) {
  // routes_chain-inputTokenId-outputTokenId-maxHops
  // Пример: routes_proton-xhbar-xtokens-dank-electronteam-2
  const withoutPrefix = key.replace('routes_', '')

  // Находим последний дефис для maxHops (всегда число в конце)
  const lastDashIndex = withoutPrefix.lastIndexOf('-')
  if (lastDashIndex === -1) return null

  const maxHops = parseInt(withoutPrefix.substring(lastDashIndex + 1))
  if (isNaN(maxHops)) return null

  // Оставшаяся часть без maxHops
  const withoutMaxHops = withoutPrefix.substring(0, lastDashIndex)

  // Находим первый дефис для chain
  const firstDashIndex = withoutMaxHops.indexOf('-')
  if (firstDashIndex === -1) return null

  const chain = withoutMaxHops.substring(0, firstDashIndex)

  // Оставшаяся часть - это два токена, разделенных посередине
  const tokensPart = withoutMaxHops.substring(firstDashIndex + 1)

  // Ищем разделитель между токенами
  // Предполагаем, что это средний дефис (может быть неточно для некоторых случаев)
  // Лучше искать по паттерну: symbol-contract
  const tokenParts = tokensPart.split('-')

  // Если частей меньше 4 (минимум symbol1-contract1-symbol2-contract2), значит ошибка
  if (tokenParts.length < 4) return null

  // Находим середину для разделения токенов
  const midIndex = Math.floor(tokenParts.length / 2)
  const inputTokenId = tokenParts.slice(0, midIndex).join('-')
  const outputTokenId = tokenParts.slice(midIndex).join('-')

  return {
    chain,
    inputTokenId,
    outputTokenId,
    maxHops
  }
}

// Сканирование и обновление роутов для сети
async function scanAndUpdateRoutes(chain) {
  const startTime = performance.now()
  console.log(`[SCAN] Checking routes for network: ${chain}`)

  try {
    // Получаем все ключи роутов для этой сети
    const pattern = `routes_${chain}-*`
    const keys = []
    for await (const key of redisClient.scanIterator({ MATCH: pattern })) {
      keys.push(key)
    }

    console.log(`[FOUND] Found ${keys.length} routes in Redis for ${chain}`)

    if (keys.length === 0) {
      return { updated: 0, total: 0, time: 0 }
    }

    // Загружаем пулы для сети
    const allPools = await getAllPools(chain)
    const liquidPools = Array.from(allPools.values()).filter((p: any) => p.active && p.tickDataProvider.ticks.length > 0)
    console.log(`[POOLS] Using ${liquidPools.length} liquid pools for ${chain}`)

    // Проверяем expiration для каждого роута
    const currentTime = Date.now()
    const routesToUpdate = []

    for (const key of keys) {
      const cacheKey = key.replace('routes_', '')
      const expirationKey = `routes_expiration_${cacheKey}`
      const expiration = await redisClient.get(expirationKey)

      if (!expiration || currentTime > parseInt(expiration, 10)) {
        // Истек
        const timeAgo = expiration ? Math.round((currentTime - parseInt(expiration, 10)) / 1000 / 60) : 'never'
        routesToUpdate.push({
          key: cacheKey,
          priority: 1,
          expiredAgo: timeAgo === 'never' ? 'never cached' : `${timeAgo} min ago`
        })
      } else if (currentTime + EXPIRING_SOON_THRESHOLD * 1000 > parseInt(expiration, 10)) {
        // Скоро истечет
        const expiresIn = Math.round((parseInt(expiration, 10) - currentTime) / 1000 / 60)
        routesToUpdate.push({
          key: cacheKey,
          priority: 2,
          expiresIn: `${expiresIn} min`
        })
      }
    }

    // Сортируем по приоритету (сначала истекшие)
    routesToUpdate.sort((a, b) => a.priority - b.priority)

    const expiredCount = routesToUpdate.filter(r => r.priority === 1).length
    const soonExpiring = routesToUpdate.filter(r => r.priority === 2).length

    console.log(`[EXPIRED] ${expiredCount} routes expired, ${soonExpiring} expiring soon`)

    // Обновляем роуты
    let updated = 0
    for (const route of routesToUpdate) {
      if (isShuttingDown) {
        console.log('[SHUTDOWN] Stopping route updates due to shutdown')
        break
      }

      const routeInfo = parseRouteKey('routes_' + route.key)
      if (!routeInfo || routeInfo.chain !== chain) continue

      const inputToken = findToken(liquidPools, routeInfo.inputTokenId)
      const outputToken = findToken(liquidPools, routeInfo.outputTokenId)

      if (!inputToken || !outputToken) {
        console.log(`[SKIP] Tokens not found for route: ${route.key}`)
        continue
      }

      const logInfo = route.priority === 1
        ? `(expired ${route.expiredAgo})`
        : `(expires in ${route.expiresIn})`

      console.log(`[UPDATE] Updating route: ${route.key} ${logInfo}`)

      const success = await updateCache(chain, liquidPools, inputToken, outputToken, routeInfo.maxHops, route.key)
      if (success) updated++
    }

    const endTime = performance.now()
    const totalTime = Math.round(endTime - startTime)
    console.log(`[STATS] Network ${chain}: updated ${updated}/${routesToUpdate.length} routes in ${totalTime}ms`)

    return { updated, total: routesToUpdate.length, time: totalTime }
  } catch (error) {
    console.error(`[ERROR] Failed to scan routes for ${chain}:`, error)
    return { updated: 0, total: 0, time: 0, error: error.message }
  }
}

// Основной цикл обновления
async function mainLoop() {
  console.log(`[START] Route Cache Updater service started with ${MAX_WORKERS} workers`)
  console.log(`[CONFIG] Networks: ${NETWORKS.join(', ')}`)
  console.log(`[CONFIG] Check interval: ${CHECK_INTERVAL}ms`)
  console.log(`[CONFIG] Cache timeout: ${ROUTES_CACHE_TIMEOUT}s (${ROUTES_CACHE_TIMEOUT / 60 / 60} hours)`)

  // Подключаемся к MongoDB и Redis
  await mongoConnect()
  console.log('[MONGO] Connected to MongoDB')

  await connectRedis()

  while (!isShuttingDown) {
    const cycleStartTime = performance.now()

    for (const network of NETWORKS) {
      if (isShuttingDown) break

      try {
        await scanAndUpdateRoutes(network)
      } catch (error) {
        console.error(`[ERROR] Failed to process network ${network}:`, error)
      }
    }

    const cycleEndTime = performance.now()
    const cycleTime = Math.round(cycleEndTime - cycleStartTime)

    if (!isShuttingDown) {
      console.log(`[CYCLE] Completed update cycle in ${cycleTime}ms. Waiting ${CHECK_INTERVAL}ms...`)
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL))
    }
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('[SHUTDOWN] Graceful shutdown initiated...')
  isShuttingDown = true

  try {
    // Ждем завершения текущих операций
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Закрываем worker pool
    console.log('[SHUTDOWN] Terminating worker pool...')
    await pool.terminate()

    // Отключаемся от Redis
    console.log('[SHUTDOWN] Disconnecting from Redis...')
    await redisClient.quit()

    console.log('[SHUTDOWN] Service stopped successfully')
    process.exit(0)
  } catch (error) {
    console.error('[SHUTDOWN] Error during shutdown:', error)
    process.exit(1)
  }
}

// Обработка сигналов завершения
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Запуск сервиса
if (require.main === module) {
  mainLoop().catch(error => {
    console.error('[FATAL] Service crashed:', error)
    process.exit(1)
  })
}

export {
  getAllPools,
  computeRoutesInWorker,
  updateCache
}
