require('dotenv').config()

async function testWorkerInit() {
  console.log('Testing worker initialization fix...\n')
  
  const { computeRoutesInWorker, getAllPools } = require('./server/services/apiV2Service/routeCacheUpdater')
  const { Token } = require('@alcorexchange/alcor-swap-sdk')
  const { mongoConnect } = require('./server/utils')
  const { createClient } = require('redis')
  
  const redis = createClient()
  
  try {
    await mongoConnect()
    await redis.connect()
    
    // Load pools for testing
    const chain = 'wax'
    console.log(`Loading pools for ${chain}...`)
    const pools = await getAllPools(chain)
    console.log(`Loaded ${pools.size} pools\n`)
    
    // Test route computation with worker
    const input = new Token('eosio.token', 8, 'WAX')
    const output = new Token('alien.worlds', 4, 'TLM')
    const poolIds = Array.from(pools.values()).slice(0, 10).map(p => p.id)
    
    console.log('Testing route computation with worker...')
    const routes = await computeRoutesInWorker(chain, input, output, poolIds, 2)
    
    console.log(`✅ SUCCESS: Computed ${routes.length} routes`)
    console.log('Worker initialization fix is working!')
    
  } catch (error) {
    console.error('❌ ERROR:', error.message)
  } finally {
    await redis.quit()
    process.exit(0)
  }
}

testWorkerInit().catch(console.error)