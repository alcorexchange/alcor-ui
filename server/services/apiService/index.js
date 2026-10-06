require('dotenv').config()

import express from 'express'
import consola from 'consola'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'

import axios from 'axios'
import axiosRetry from 'axios-retry'
axiosRetry(axios, { retries: 3 })

import { initRedis, mongoConnect } from '../../utils'
import { getRedis } from '../redis'
import upload from './upload.js'

import { networkResolver } from './middleware.js'

import { markets } from './markets.js'
import { pools } from './pools.js'
import { account } from './account.js'

const app = express()

// Import and Set Nuxt.js options
async function start () {
  //db sync
  if (!process.env.DISABLE_DB) {
    try {
      await mongoConnect()
      console.log('MongoDB connected!')
    } catch (e) {
      console.log('MongoDB connect err: ', e)
      process.exit(1)
    }

    await initRedis()
    // Set getter for backward compatibility with routes using req.app.get('redisClient')
    app.set('redisClient', getRedis())
  }

  app.use(networkResolver)

  // Before bodyParser coz use formidable
  app.use('/api/upload', upload)

  // Parsers
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  // Server routes
  app.use('/api/markets', markets)
  app.use('/api/account', account)
  app.use('/api/pools', pools)

  // Listen the server
  const PORT = process.env.PORT || 8000

  app.listen(PORT, () => {
    consola.ready({ message: `API Server listening on ${PORT}`, badge: true })
  })

  // FOR PM2
  //process.send('ready')
  process.on('SIGINT', async () => {
    await mongoose.connection.close()
    process.exit(0)
  })
}

start()
