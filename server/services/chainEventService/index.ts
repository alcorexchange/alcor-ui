require('dotenv').config()

import mongoose from 'mongoose'
import { createClient } from 'redis'

import { initRedis, mongoConnect } from '../../utils'
import { start } from './start'

const redisClient = createClient()

async function makeConnections() {
  if (!redisClient.isOpen) await redisClient.connect()
  console.log('Redis connected..')

  await mongoConnect()
  console.log('MongoDB connected!')
}

async function init () {
  try {
    await makeConnections()
  } catch (e) {
    console.log('makeConnections retry... :' + e)
    await new Promise(resolve => setTimeout(resolve, 2000))
    await init()
    await initRedis()
  }

  start()

  process.on('SIGINT', async () => {
    await redisClient.quit()
    await mongoose.connection.close()
    process.exit(0)
  })
}

init()
