const workerpool = require('workerpool')
const { Token, Pool, Route, WASMRouteFinder } = require('@alcorexchange/alcor-swap-sdk')

// WASM Route Finder инстансы для каждой сети
const routeFinders = new Map()

// Получить или создать WASM finder для сети
async function getRouteFinder(chain) {
  if (!routeFinders.has(chain)) {
    const finder = new WASMRouteFinder()
    routeFinders.set(chain, finder)
    workerpool.workerEmit({ 
      type: 'log', 
      message: `[WASM-WORKER] Created new WASMRouteFinder for ${chain}` 
    })
  }
  return routeFinders.get(chain)
}

// Инициализация или обновление пулов в WASM
async function initializePools(data) {
  const { chain, pools, isUpdate = false } = data
  const startTime = Date.now()
  
  try {
    const finder = await getRouteFinder(chain)
    
    // Конвертируем пулы из JSON в объекты Pool
    const poolInstances = pools.map(poolData => {
      if (poolData instanceof Pool) {
        return poolData
      }
      // Используем статический метод fromJSON из SDK
      return Pool.fromJSON(poolData)
    })
    
    if (isUpdate) {
      // Обновляем существующие пулы или добавляем новые
      await finder.updatePools(poolInstances)
      workerpool.workerEmit({ 
        type: 'log', 
        message: `[WASM-WORKER] Updated ${poolInstances.length} pools for ${chain} in ${Date.now() - startTime}ms` 
      })
    } else {
      // Полная инициализация
      await finder.initialize(poolInstances)
      workerpool.workerEmit({ 
        type: 'log', 
        message: `[WASM-WORKER] Initialized ${poolInstances.length} pools for ${chain} in ${Date.now() - startTime}ms` 
      })
    }
    
    return {
      success: true,
      chain,
      poolCount: finder.getPoolCount(),
      time: Date.now() - startTime
    }
  } catch (error) {
    workerpool.workerEmit({ 
      type: 'error', 
      message: `[WASM-WORKER] Failed to initialize pools for ${chain}: ${error.message}` 
    })
    throw error
  }
}

// Вычисление маршрутов с использованием WASM
async function computeRoutes(data) {
  const { chain, input, output, maxHops } = data
  const startTime = Date.now()
  
  try {
    const finder = await getRouteFinder(chain)
    
    if (!finder || finder.getPoolCount() === 0) {
      throw new Error(`No pools loaded for chain ${chain}. Call initializePools first.`)
    }
    
    // Конвертируем токены из JSON
    const inputToken = Token.fromJSON(input)
    const outputToken = Token.fromJSON(output)
    
    // Вычисляем маршруты с помощью WASM
    const computeStart = Date.now()
    const routes = finder.computeAllRoutes(inputToken, outputToken, maxHops)
    const computeTime = Date.now() - computeStart
    
    workerpool.workerEmit({ 
      type: 'log', 
      message: `[WASM-WORKER] Computed ${routes.length} routes in ${computeTime}ms (total: ${Date.now() - startTime}ms)` 
    })
    
    // Сериализуем маршруты для возврата
    return routes.map(r => Route.toBuffer ? Route.toBuffer(r) : r)
  } catch (error) {
    workerpool.workerEmit({ 
      type: 'error', 
      message: `[WASM-WORKER] Failed to compute routes: ${error.message}` 
    })
    throw error
  }
}

// Комбинированная функция: инициализация + вычисление
async function computeRoutesWithInit(data) {
  const { pools, chain, input, output, maxHops, isUpdate = false } = data
  
  // Инициализируем или обновляем пулы
  if (pools && pools.length > 0) {
    await initializePools({ chain, pools, isUpdate })
  }
  
  // Вычисляем маршруты
  return computeRoutes({ chain, input, output, maxHops })
}

// Очистка памяти для сети
function clearChain(chain) {
  const finder = routeFinders.get(chain)
  if (finder) {
    finder.clear()
    routeFinders.delete(chain)
    workerpool.workerEmit({ 
      type: 'log', 
      message: `[WASM-WORKER] Cleared WASMRouteFinder for ${chain}` 
    })
  }
  return { success: true, chain }
}

// Получить статистику
function getStats() {
  const stats = {}
  for (const [chain, finder] of routeFinders.entries()) {
    stats[chain] = {
      poolCount: finder.getPoolCount()
    }
  }
  return stats
}

// Очистка всех finder'ов при завершении
function cleanup() {
  for (const [chain, finder] of routeFinders.entries()) {
    finder.clear()
    workerpool.workerEmit({ 
      type: 'log', 
      message: `[WASM-WORKER] Cleared WASMRouteFinder for ${chain}` 
    })
  }
  routeFinders.clear()
  return { success: true }
}

// Регистрация функций воркера
workerpool.worker({
  initializePools,
  computeRoutes,
  computeRoutesWithInit,
  clearChain,
  getStats,
  cleanup
})

// Обработка завершения процесса
process.on('SIGTERM', cleanup)
process.on('SIGINT', cleanup)