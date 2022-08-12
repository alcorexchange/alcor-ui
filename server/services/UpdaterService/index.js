require('dotenv').config()

import mongoose from 'mongoose'
import { createClient } from 'redis'

import { startUpdaters } from './start'

async function start () {
  const redisClient = createClient()
  await redisClient.connect()
  console.log('Redis connected..')

  const uri = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/alcor_prod_new`
  await mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true })
  console.log('MongoDB connected!')

  startUpdaters()

  // FOR PM2
  //process.send('ready')

  process.on('SIGINT', async () => {
    await redisClient.quit()
    await mongoose.connection.close()
    process.exit(0)
  })
}

start()
