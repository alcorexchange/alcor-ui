require('dotenv').config()

import { performance } from 'perf_hooks'
import * as workerpool from 'workerpool'
import { createClient } from 'redis'
import { Token, Route, Pool } from '@alcorexchange/alcor-swap-sdk'

import { getPools, poolInstanceFromMongoPool, getRedisTicks } from '../swapV2Service/utils'
import { mongoConnect, initRedis } from '../../utils'
import { SwapPool } from '../../models'

// КОНФИГУРАЦИЯ
const USE_WASM_WORKERS = process.env.USE_WASM_WORKERS !== 'false' // По умолчанию включен WASM
const MAX_WORKERS = USE_WASM_WORKERS ? 5 : 5 // Меньше воркеров для WASM (они эффективнее)
const CHECK_INTERVAL = 10000 // Интервал между проверками (10 сек)
const ROUTES_CACHE_TIMEOUT = 60 * 60 * 24 * 20 // 20 дня в секундах
const ROUTES_UPDATING_TIMEOUT = 60 * 15 // 15 минут
const NETWORKS = ['eos', 'proton', 'ux', 'wax', 'telos', 'ultra']
const EXPIRING_SOON_THRESHOLD = 60 * 60 // Обновляем роуты, истекающие в течение часа
const BATCH_SIZE = USE_WASM_WORKERS ? 50 : 10 // Больший батч для WASM (быстрее обрабатывает)
const POOLS_UPDATE_INTERVAL = USE_WASM_WORKERS ? 60000 : 30000 // Реже обновляем с WASM (60 сек vs 30 сек)
const SHARED_BUFFER_SIZE = 100_000_000 // 100MB для SharedArrayBuffer (не используется в WASM режиме)

// Redis клиент
const redisClient = createClient()

// Worker pool для вычислений
const workerPath = USE_WASM_WORKERS
  ? './server/services/apiV2Service/workers/computeAllRoutesWASMWorker.js'
  : './server/services/apiV2Service/workers/computeAllRoutesWorker.js'

const pool = workerpool.pool(workerPath, {
  maxWorkers: MAX_WORKERS,
  workerType: 'thread'
})

if (USE_WASM_WORKERS) {
  console.log('[CONFIG] Using WASM workers for route computation')
} else {
  console.log('[CONFIG] Using standard JS workers for route computation')
}

// Управление shared memory для пулов (только для non-WASM режима)
class SharedPoolsMemory {
  private sharedBuffer: SharedArrayBuffer
  private dataView: DataView
  private poolsMetadata: Map<string, Map<string, { offset: number, length: number }>>
  private currentOffset: number
  private lastUpdate: Map<string, number>

  constructor() {
    this.sharedBuffer = new SharedArrayBuffer(SHARED_BUFFER_SIZE)
    this.dataView = new DataView(this.sharedBuffer)
    this.poolsMetadata = new Map()
    this.currentOffset = 0
    this.lastUpdate = new Map()
  }

  // Сериализация пула в буфер
  private serializePool(pool: Pool): Uint8Array {
    // Используем Pool.toBuffer если доступен, иначе JSON
    const buffer = Pool.toBuffer ? Pool.toBuffer(pool) : Buffer.from(JSON.stringify(pool))
    return new Uint8Array(buffer)
  }

  // Загрузка пулов в shared memory
  async loadPools(chain: string, pools: Pool[]) {
    const chainMetadata = new Map<string, { offset: number, length: number }>()

    // Получаем начальный offset для этой сети
    // Если сеть уже есть, используем существующий offset, иначе currentOffset
    let chainOffset = this.getChainStartOffset(chain)
    const startOffset = chainOffset

    for (const pool of pools) {
      const serialized = this.serializePool(pool)
      const length = serialized.length

      // Проверяем, что есть место в буфере
      if (chainOffset + length > SHARED_BUFFER_SIZE) {
        console.error(`[ERROR] SharedArrayBuffer overflow for chain ${chain}`)
        break
      }

      // Записываем данные в shared buffer
      for (let i = 0; i < length; i++) {
        this.dataView.setUint8(chainOffset + i, serialized[i])
      }

      chainMetadata.set(pool.id.toString(), { offset: chainOffset, length })
      chainOffset += length
    }

    // Обновляем метаданные для этой сети (перезаписываем старые)
    this.poolsMetadata.set(chain, chainMetadata)
    this.lastUpdate.set(chain, Date.now())

    // Обновляем currentOffset только если это новая сеть или мы вышли за пределы
    if (chainOffset > this.currentOffset) {
      this.currentOffset = chainOffset
    }

    //console.log(`[SHARED] Loaded ${pools.length} pools for ${chain} at offset ${startOffset}-${chainOffset}`)

    return {
      buffer: this.sharedBuffer,
      metadata: Object.fromEntries(chainMetadata),
      chain
    }
  }

  // Получить начальный offset для сети
  private getChainStartOffset(chain: string): number {
    // Если сеть уже загружена, найдем минимальный offset её пулов
    const existingMetadata = this.poolsMetadata.get(chain)
    if (existingMetadata && existingMetadata.size > 0) {
      const offsets = Array.from(existingMetadata.values()).map(m => m.offset)
      return Math.min(...offsets)
    }
    // Для новой сети используем текущий offset
    return this.currentOffset
  }

  getSharedData() {
    return {
      buffer: this.sharedBuffer,
      metadata: Object.fromEntries(
        Array.from(this.poolsMetadata.entries()).map(([chain, pools]) => [
          chain,
          Object.fromEntries(pools)
        ])
      )
    }
  }

  needsUpdate(chain: string): boolean {
    const lastUpdate = this.lastUpdate.get(chain) || 0
    return Date.now() - lastUpdate > POOLS_UPDATE_INTERVAL
  }
}

const sharedPoolsMemory = USE_WASM_WORKERS ? null : new SharedPoolsMemory()

// Локальный кеш пулов для быстрого доступа
const POOLS = {}
const POOLS_LOADING_PROMISES = {}
// Трекинг версий пулов для WASM режима
const POOLS_VERSIONS = {}
const POOLS_LAST_UPDATE = {}

// Флаг для graceful shutdown
let isShuttingDown = false

// Подключение к Redis
async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect()
    console.log('[REDIS] Connected to Redis')
  }
}

// Загрузка пулов из MongoDB
async function loadPoolsFromMongo(chain: string): Promise<Pool[]> {
  //console.log(`[POOLS] Loading pools from MongoDB for ${chain}...`)
  const startTime = performance.now()

  // Загружаем активные пулы
  const mongoPools = await SwapPool.find({
    chain,
    active: true
  }).lean()

  const pools = []
  for (const mongoPool of mongoPools) {
    try {
      // Используем существующую функцию для конвертации
      const poolInstance = await poolInstanceFromMongoPool(mongoPool)

      // Проверяем что пул активен и имеет тики
      // poolInstanceFromMongoPool уже загружает тики из Redis
      pools.push(poolInstance)
    } catch (error) {
      console.error(`[ERROR] Failed to convert pool ${mongoPool.id}:`, error.message)
    }
  }

  const endTime = performance.now()
  //console.log(`[POOLS] Loaded ${pools.length} liquid pools for ${chain} in ${Math.round(endTime - startTime)}ms`)

  return pools
}

// Загрузка всех пулов для сети с кешированием и обновлением
async function getAllPools(chain) {
  const needsUpdate = USE_WASM_WORKERS
    ? (!POOLS_LAST_UPDATE[chain] || Date.now() - POOLS_LAST_UPDATE[chain] > POOLS_UPDATE_INTERVAL || !POOLS[chain])
    : (sharedPoolsMemory?.needsUpdate(chain) || !POOLS[chain])

  // Проверяем, нужно ли обновить пулы
  if (needsUpdate) {
    // Если промис загрузки еще не существует, создаем его
    POOLS_LOADING_PROMISES[chain] =
      POOLS_LOADING_PROMISES[chain] ||
      (async () => {
        const pools = await loadPoolsFromMongo(chain)
        POOLS[chain] = new Map(pools.map((p) => [p.id, p]))

        if (USE_WASM_WORKERS) {
          // Для WASM режима обновляем версию пулов
          POOLS_VERSIONS[chain] = (POOLS_VERSIONS[chain] || 0) + 1
          POOLS_LAST_UPDATE[chain] = Date.now()
        } else {
          // Загружаем в shared memory для воркеров
          await sharedPoolsMemory.loadPools(chain, pools)
        }

        delete POOLS_LOADING_PROMISES[chain]
        return POOLS[chain]
      })()
    // Ждем завершения загрузки
    POOLS[chain] = await POOLS_LOADING_PROMISES[chain]
  }
  return POOLS[chain]
}

// Вычисление роутов через воркер
async function computeRoutesInWorker(chain, input, output, poolIds, maxHops) {
  if (USE_WASM_WORKERS) {
    // WASM режим: передаем пулы напрямую, если нужно обновить
    const allPools = await getAllPools(chain)
    const pools: Pool[] = Array.from(allPools.values())

    // Проверяем, нужно ли передать пулы воркеру
    const currentVersion = POOLS_VERSIONS[chain] || 0
    const workerVersion = await pool.exec('getStats', []).then(stats => stats[chain]?.version || 0).catch(() => 0)

    const workerData = {
      chain,
      input: Token.toJSON(input),
      output: Token.toJSON(output),
      maxHops,
      // Передаем пулы только если версия изменилась
      pools: currentVersion !== workerVersion ? pools.map(p => Pool.toJSON(p)) : null,
      isUpdate: workerVersion > 0 // Если воркер уже инициализирован, это обновление
    }

    try {
      const routes = await pool.exec('computeRoutesWithInit', [workerData])
      return routes.map((r) => Route.fromBuffer ? Route.fromBuffer(r) : r)
    } catch (error) {
      console.error('[ERROR] WASM Worker pool error:', error)
      throw error
    }
  } else {
    // Стандартный режим с SharedArrayBuffer
    const sharedData = sharedPoolsMemory.getSharedData()

    const workerData = {
      sharedData, // Передаем shared data с каждым вызовом
      chain,
      input: Token.toJSON(input),
      output: Token.toJSON(output),
      poolIds, // Передаем только ID пулов
      maxHops
    }

    try {
      const routes = await pool.exec('computeRoutesWithInit', [workerData])
      return routes.map((r) => Route.fromBuffer ? Route.fromBuffer(r) : r)
    } catch (error) {
      console.error('[ERROR] Worker pool error:', error)
      throw error
    }
  }
}

// Обновление кеша для конкретного роута
async function updateCache(chain, poolIds, input, output, maxHops, cacheKey) {
  const startTime = performance.now()
  const updatingKey = 'updating_' + cacheKey

  try {
    // Устанавливаем флаг обновления
    const setResult = await redisClient.set(updatingKey, 'true', { EX: ROUTES_UPDATING_TIMEOUT, NX: true })
    if (setResult !== 'OK') {
      console.log(`[SKIP] Route ${cacheKey} already updating`)
      return false
    }

    const routes = await computeRoutesInWorker(chain, input, output, poolIds, maxHops)

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
    // Все пулы из getAllPools уже отфильтрованы (активные с тиками)
    const liquidPools = Array.from(allPools.values())
    console.log(`[POOLS] Using ${liquidPools.length} liquid pools for ${chain}`)

    // Проверяем expiration для каждого роута с использованием pipeline
    const currentTime = Date.now()
    const routesToUpdate = []

    // Используем pipeline для массовой проверки expiration
    const pipeline = redisClient.multi()
    const cacheKeys = keys.map(key => key.replace('routes_', ''))

    // Добавляем все GET операции в pipeline
    for (const cacheKey of cacheKeys) {
      pipeline.get(`routes_expiration_${cacheKey}`)
    }

    // Выполняем все операции одним запросом
    const expirations = await pipeline.exec()

    // Обрабатываем результаты
    for (let i = 0; i < cacheKeys.length; i++) {
      const cacheKey = cacheKeys[i]
      // Redis pipeline возвращает массив [error, result] для каждой операции
      const expiration = expirations[i] as string | null

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

    // Обновляем роуты батчами для параллельной обработки
    let updated = 0
    const poolIds = liquidPools.map((p: any) => p.id)

    // Разбиваем на батчи
    for (let i = 0; i < routesToUpdate.length; i += BATCH_SIZE) {
      if (isShuttingDown) {
        console.log('[SHUTDOWN] Stopping route updates due to shutdown')
        break
      }

      const batch = routesToUpdate.slice(i, Math.min(i + BATCH_SIZE, routesToUpdate.length))

      // Параллельно обрабатываем батч
      const updatePromises = batch.map(async (route) => {
        const routeInfo = parseRouteKey('routes_' + route.key)
        if (!routeInfo || routeInfo.chain !== chain) return false

        const inputToken = findToken(liquidPools, routeInfo.inputTokenId)
        const outputToken = findToken(liquidPools, routeInfo.outputTokenId)

        if (!inputToken || !outputToken) {
          console.log(`[SKIP] Tokens not found for route: ${route.key}`)
          return false
        }

        return updateCache(chain, poolIds, inputToken, outputToken, routeInfo.maxHops, route.key)
      })

      // Ждем завершения батча
      const results = await Promise.allSettled(updatePromises)
      const batchUpdated = results.filter(r => r.status === 'fulfilled' && r.value).length
      updated += batchUpdated

      const currentBatch = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(routesToUpdate.length / BATCH_SIZE)
      const processedSoFar = Math.min(i + BATCH_SIZE, routesToUpdate.length)

      console.log(`[BATCH] Processed batch ${currentBatch}/${totalBatches}, updated ${batchUpdated}/${batch.length} routes | Total progress: ${updated}/${processedSoFar} (${Math.round(processedSoFar / routesToUpdate.length * 100)}%)`)
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

// Периодическое обновление пулов из MongoDB
async function startPoolsUpdater() {
  setInterval(async () => {
    if (isShuttingDown) return

    //console.log('[POOLS] Starting periodic pools update...')
    for (const chain of NETWORKS) {
      try {
        // Принудительно обновляем пулы
        // loadPools автоматически перезапишет данные для этой сети
        delete POOLS[chain]
        await getAllPools(chain)
      } catch (error) {
        console.error(`[ERROR] Failed to update pools for ${chain}:`, error)
      }
    }
  }, POOLS_UPDATE_INTERVAL)
}

// Основной цикл обновления
async function mainLoop() {
  console.log(`[START] Route Cache Updater service started with ${MAX_WORKERS} ${USE_WASM_WORKERS ? 'WASM' : 'JS'} workers`)
  console.log(`[CONFIG] Networks: ${NETWORKS.join(', ')}`)
  console.log(`[CONFIG] Check interval: ${CHECK_INTERVAL}ms`)
  console.log(`[CONFIG] Cache timeout: ${ROUTES_CACHE_TIMEOUT}s (${ROUTES_CACHE_TIMEOUT / 60 / 60} hours)`)
  console.log(`[CONFIG] Batch size: ${BATCH_SIZE} routes`)
  console.log(`[CONFIG] Pools update interval: ${POOLS_UPDATE_INTERVAL}ms`)
  console.log(`[CONFIG] Mode: ${USE_WASM_WORKERS ? 'WASM (10-13x faster)' : 'Standard JS'}`)

  // Подключаемся к MongoDB и Redis
  await mongoConnect()
  console.log('[MONGO] Connected to MongoDB')

  await connectRedis()
  await initRedis()

  // Загружаем начальные пулы для всех сетей
  for (const chain of NETWORKS) {
    await getAllPools(chain)
  }

  // Запускаем периодическое обновление пулов
  startPoolsUpdater()

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
    if (USE_WASM_WORKERS) {
      // Очищаем WASM память перед завершением
      await pool.exec('cleanup', []).catch(() => {})
    }
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
