// NEW API + OLD ROUTES
require('dotenv').config()

import express from 'express'
import consola from 'consola'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'

import axios from 'axios'
import axiosRetry from 'axios-retry'
axiosRetry(axios, { retries: 3 })

import { initRedis, mongoConnect } from '../../utils'
import { getRedis, getPublisher } from '../redis'
import { networkResolver } from '../apiService/middleware'
import { spot } from './spot'
import { swap } from './swap'
import { ibc } from './ibc'
import { tokens } from './tokens'
import { account } from './account'
import { swapRouter, initSwapRouterSubscriptions } from './swapRouter'
import { analytics } from './analytics'
import { farms } from './farms'
import { admin } from './admin'
import { configRouter } from './config'
import { amm as ammV3 } from '../apiV3Service/amm'
import { analytics as analyticsV3 } from '../apiV3Service/analytics'

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

    await initRedis()
    // Set for backward compatibility with routes using req.app.get('redisClient')
    app.set('redisClient', getRedis())
    app.set('publisher', getPublisher())

    // Initialize swapRouter subscriptions after Redis is ready
    initSwapRouterSubscriptions()
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
  app.use('/api/v2/admin', admin)
  app.use('/api/v2/config', configRouter)
  app.use('/api/v3/amm', ammV3)
  app.use('/api/v3/analytics', analyticsV3)

  // Listen the server
  const PORT = process.env.PORT || 8000

  app.listen(PORT, () => {
    consola.ready({ message: `API Server listening on ${PORT}`, badge: true })
  })
  //process.send('ready')
}

start()
