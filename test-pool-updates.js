require('dotenv').config()

async function testPoolUpdates() {
  console.log('Testing pool updates fix...\n')
  
  // Temporarily reduce update interval for testing
  process.env.POOLS_UPDATE_INTERVAL = '5000' // 5 seconds for testing
  
  const { performance } = require('perf_hooks')
  
  // Start the service
  console.log('Starting Route Cache Updater...')
  require('./server/services/apiV2Service/routeCacheUpdater')
  
  // Monitor for 20 seconds
  const startTime = Date.now()
  const checkInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    console.log(`\n⏱️  Time elapsed: ${elapsed}s`)
    
    if (elapsed >= 20) {
      console.log('\n✅ Test completed. Check logs above for:')
      console.log('1. Initial pool loading')
      console.log('2. Periodic pool updates (every 5s)')
      console.log('3. Routes should continue working after updates')
      console.log('4. No "0 routes" after pool updates')
      clearInterval(checkInterval)
      process.exit(0)
    }
  }, 1000)
}

testPoolUpdates().catch(console.error)