const { parentPort, workerData } = require('worker_threads')
const { Token, Pool, computeAllRoutes, Route } = require('@alcorexchange/alcor-swap-sdk')
const workerpool = require('workerpool')

// Кеш для десериализованных пулов
const poolsCache = new Map()

// Shared memory data
let sharedData = null

// Инициализация shared memory
function initSharedMemory(data) {
  sharedData = {
    buffer: new Uint8Array(data.buffer),
    metadata: data.metadata
  }

  // Очищаем кеш при новой инициализации
  poolsCache.clear()

  workerpool.workerEmit({ type: 'log', message: `[WORKER] Initialized with shared memory` })
  return true
}

// Получение пула из shared memory
function getPoolFromSharedMemory(chain, poolId) {
  const cacheKey = `${chain}-${poolId}`

  // Проверяем кеш
  if (poolsCache.has(cacheKey)) {
    return poolsCache.get(cacheKey)
  }

  if (!sharedData || !sharedData.metadata[chain]) {
    throw new Error(`No shared data for chain ${chain}`)
  }

  const poolMetadata = sharedData.metadata[chain][poolId.toString()]
  if (!poolMetadata) {
    throw new Error(`Pool ${poolId} not found in shared memory`)
  }

  const { offset, length } = poolMetadata
  const poolBuffer = sharedData.buffer.slice(offset, offset + length)

  // Десериализуем пул
  let pool
  try {
    // Пробуем использовать Pool.fromBuffer если доступен
    if (Pool.fromBuffer) {
      pool = Pool.fromBuffer(Buffer.from(poolBuffer))
    } else {
      // Иначе парсим JSON
      const jsonStr = Buffer.from(poolBuffer).toString()
      const poolData = JSON.parse(jsonStr)
      pool = new Pool(poolData)
    }
  } catch (error) {
    workerpool.workerEmit({
      type: 'error',
      message: `Failed to deserialize pool ${poolId}: ${error.message}`
    })
    throw error
  }

  // Кешируем десериализованный пул
  poolsCache.set(cacheKey, pool)

  return pool
}

// Вычисление роутов с использованием shared memory
function computeRoutes(chain, input, output, poolIds, maxHops) {
  const startTime = Date.now()

  if (!sharedData) {
    throw new Error('Shared memory not initialized. Call initSharedMemory first.')
  }

  // Получаем пулы из shared memory по ID
  const pools = []
  let loadTime = 0

  for (const poolId of poolIds) {
    const loadStart = Date.now()
    try {
      const pool = getPoolFromSharedMemory(chain, poolId)
      pools.push(pool)
    } catch (error) {
      // Пропускаем пулы, которые не удалось загрузить
      workerpool.workerEmit({
        type: 'warning',
        message: `Skipping pool ${poolId}: ${error.message}`
      })
    }
    loadTime += Date.now() - loadStart
  }

  workerpool.workerEmit({
    type: 'log',
    message: `[WORKER] Loaded ${pools.length} pools from shared memory in ${loadTime}ms`
  })

  // Вычисляем роуты
  const computeStart = Date.now()
  const routes = computeAllRoutes(
    Token.fromJSON(input),
    Token.fromJSON(output),
    pools,
    maxHops
  )

  const computeTime = Date.now() - computeStart
  const totalTime = Date.now() - startTime

  workerpool.workerEmit({
    type: 'log',
    message: `[WORKER] Computed ${routes.length} routes in ${computeTime}ms (total: ${totalTime}ms)`
  })

  // Сериализуем роуты для возврата
  return routes.map((r) => Route.toBuffer ? Route.toBuffer(r) : r)
}

// Функция, которая инициализирует shared memory и вычисляет роуты
function computeRoutesWithInit(data) {
  const { sharedData, chain, input, output, poolIds, maxHops } = data
  
  // Всегда инициализируем/обновляем shared memory
  initSharedMemory(sharedData)
  
  // Вычисляем роуты
  return computeRoutes(chain, input, output, poolIds, maxHops)
}

// Регистрация функций воркера
workerpool.worker({
  initSharedMemory,
  computeRoutes,
  computeRoutesWithInit
})

