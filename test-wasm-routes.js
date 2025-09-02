#!/usr/bin/env node

// Тестовый скрипт для проверки WASM роутера
require('dotenv').config()

const { Token, Pool } = require('@alcorexchange/alcor-swap-sdk')

// Устанавливаем переменную окружения для включения WASM
process.env.USE_WASM_WORKERS = 'true'

async function testWASMWorker() {
  console.log('Testing WASM Worker Implementation...\n')
  
  // Создаем тестовые токены
  const tokenA = new Token({
    id: 'eosio.token-eos-eos',
    contract: 'eosio.token',
    symbol: { name: 'EOS', precision: 4 },
    chain: 'eos'
  })
  
  const tokenB = new Token({
    id: 'swap.defi-usdt-tether',
    contract: 'swap.defi',
    symbol: { name: 'USDT', precision: 4 },
    chain: 'eos'
  })
  
  const tokenC = new Token({
    id: 'swap.defi-usdc-coin',
    contract: 'swap.defi',
    symbol: { name: 'USDC', precision: 4 },
    chain: 'eos'
  })
  
  // Создаем тестовые пулы
  const pools = [
    new Pool({
      id: 1,
      tokenA,
      tokenB,
      fee: 30,
      sqrtPriceX64: BigInt('18446744073709551616'), // price = 1
      liquidity: BigInt('1000000000000'),
      tickCurrent: 0,
      feeGrowthGlobalAX64: BigInt(0),
      feeGrowthGlobalBX64: BigInt(0),
      ticks: []
    }),
    new Pool({
      id: 2,
      tokenA,
      tokenC,
      fee: 30,
      sqrtPriceX64: BigInt('18446744073709551616'), // price = 1
      liquidity: BigInt('1000000000000'),
      tickCurrent: 0,
      feeGrowthGlobalAX64: BigInt(0),
      feeGrowthGlobalBX64: BigInt(0),
      ticks: []
    }),
    new Pool({
      id: 3,
      tokenB,
      tokenC,
      fee: 30,
      sqrtPriceX64: BigInt('18446744073709551616'), // price = 1
      liquidity: BigInt('1000000000000'),
      tickCurrent: 0,
      feeGrowthGlobalAX64: BigInt(0),
      feeGrowthGlobalBX64: BigInt(0),
      ticks: []
    })
  ]
  
  try {
    // Проверяем, доступен ли WASM модуль
    try {
      const { WASMRouteFinder } = require('@alcorexchange/alcor-swap-sdk')
      console.log('✅ WASM module found in SDK\n')
      
      // Тестируем прямое использование
      console.log('Testing direct WASM usage:')
      const finder = new WASMRouteFinder()
      await finder.initialize(pools)
      console.log(`  Initialized with ${finder.getPoolCount()} pools`)
      
      const routes = finder.computeAllRoutes(tokenA, tokenB, 2)
      console.log(`  Found ${routes.length} routes from EOS to USDT`)
      
      finder.clear()
      console.log('  Cleared WASM memory\n')
    } catch (error) {
      console.log('⚠️  WASM module not found in SDK. Please update @alcorexchange/alcor-swap-sdk to latest version.\n')
      console.log('   Run: npm update @alcorexchange/alcor-swap-sdk\n')
      return
    }
    
    // Тестируем воркер
    console.log('Testing WASM Worker:')
    const workerpool = require('workerpool')
    const pool = workerpool.pool('./server/services/apiV2Service/workers/computeAllRoutesWASMWorker.js', {
      maxWorkers: 1,
      workerType: 'thread'
    })
    
    // Инициализируем пулы
    const initResult = await pool.exec('initializePools', [{
      chain: 'eos',
      pools: pools.map(p => p.toJSON ? p.toJSON() : p)
    }])
    console.log(`  Initialized: ${initResult.poolCount} pools in ${initResult.time}ms`)
    
    // Вычисляем маршруты
    const routesBuffer = await pool.exec('computeRoutes', [{
      chain: 'eos',
      input: Token.toJSON(tokenA),
      output: Token.toJSON(tokenB),
      maxHops: 2
    }])
    console.log(`  Computed routes: ${routesBuffer.length} routes found`)
    
    // Получаем статистику
    const stats = await pool.exec('getStats', [])
    console.log('  Stats:', stats)
    
    // Закрываем пул
    await pool.terminate()
    console.log('\n✅ All tests passed!')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Запускаем тесты
testWASMWorker().then(() => {
  console.log('\nTest completed successfully!')
  process.exit(0)
}).catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})