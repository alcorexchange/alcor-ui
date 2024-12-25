require('dotenv').config()

import mongoose from 'mongoose'
import { createClient } from 'redis'

import { startUpdaters } from './start'
import { mongoConnect } from '~/server/utils'

const redisClient = createClient()

async function makeConnections() {
  if (!redisClient.isOpen) await redisClient.connect()
  console.log('Redis connected..')

  await mongoConnect()
  console.log('MongoDB connected!')
}

async function start () {
  try {
    await makeConnections()
  } catch (e) {
    console.log('makeConnections retry... :' + e)
    await new Promise(resolve => setTimeout(resolve, 2000))
    await start()
  }

  startUpdaters()

  process.on('SIGINT', async () => {
    await redisClient.quit()
    await mongoose.connection.close()
    process.exit(0)
  })
}

start()
