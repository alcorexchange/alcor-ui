// NEW API + OLD ROUTES
require('dotenv').config()

import express from 'express'
import consola from 'consola'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import { createClient } from 'redis'

import axios from 'axios'
import axiosRetry from 'axios-retry'
axiosRetry(axios, { retries: 3 })

import { mongoConnect, setRedisClient, setRedisPublisher } from '../../utils'
import { networkResolver } from '../apiService/middleware'
import { spot } from './spot'
import { swap } from './swap'
import { ibc } from './ibc'
import { tokens } from './tokens'
import { account } from './account'
import { swapRouter } from './swapRouter'
import { analytics } from './analytics'
import { farms } from './farms'

const app = express()

// Import and Set Nuxt.js options
async function start () {
  //db sync
  if (!process.env.DISABLE_DB) {
    try {
      await mongoConnect()
      console.log('MongoDB connected!')
    } catch (e) {
      console.log(e)
      throw new Error('MongoDB connect err')
    }

    // REDIS client shared globally
    const redis = createClient()
    await redis.connect()
    setRedisClient(redis)
    app.set('redisClient', redis)

    const publisher = redis.duplicate()
    await publisher.connect()
    setRedisPublisher(publisher)
    app.set('publisher', publisher)
  }

  app.use(networkResolver)

  // Before bodyParser coz use formidable
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  // Server routes
  app.use('/api/v2/', spot)
  app.use('/api/v2/', tokens)
  app.use('/api/v2/ibc', ibc)
  app.use('/api/v2/analytics', analytics)
  app.use('/api/v2/swap', swap)
  app.use('/api/v2/swapRouter', swapRouter)
  app.use('/api/v2/account/', account)
  app.use('/api/v2/farms/', farms)

  // Listen the server
  const PORT = process.env.PORT || 8000

  app.listen(PORT, () => {
    consola.ready({ message: `API Server listening on ${PORT}`, badge: true })
  })
  //process.send('ready')
}

start()
