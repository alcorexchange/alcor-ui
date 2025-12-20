require('dotenv').config()

import mongoose from 'mongoose'

import { initRedis, mongoConnect, closeRedis } from '../../utils'
import { start } from './start'

async function makeConnections() {
  await initRedis()
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
  }

  start()

  process.on('SIGINT', async () => {
    await closeRedis()
    await mongoose.connection.close()
    process.exit(0)
  })
}

init()
