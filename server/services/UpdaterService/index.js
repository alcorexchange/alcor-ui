require('dotenv').config()

import mongoose from 'mongoose'
import { createClient } from 'redis'

import { startUpdaters } from './start'

async function start () {
  // Trying to connect all service here before start

  while (true) {
    try {
      const redisClient = createClient()
      await redisClient.connect()
      console.log('Redis connected..')
      break
    } catch (e) {
      console.error('REDIS CONNECTION ERRR, restarting..: ', e)
      await new Promise((resolve, reject) => setTimeout(resolve, 1000))
    }
  }

  while (true) {
    try {
      const uri = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/alcor_prod_new`
      await mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true })
      console.log('MongoDB connected!')
      break
    } catch (e) {
      console.error('MONGO CONNECTION ERRR, restarting..: ', e)
      await new Promise((resolve, reject) => setTimeout(resolve, 1000))
    }
  }

  process.send('ready')
  startUpdaters()
}

start()
