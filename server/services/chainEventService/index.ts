require('dotenv').config()

import { initRedis, closeRedis } from '../../utils'
import { start } from './start'

async function init() {
  try {
    await initRedis()
    console.log('Redis connected..')
  } catch (e) {
    console.log('Redis connection retry... :' + e)
    await new Promise(resolve => setTimeout(resolve, 2000))
    await init()
  }

  start()

  process.on('SIGINT', async () => {
    await closeRedis()
    process.exit(0)
  })
}

init()
