import socket from 'socket.io'
import express from 'express'
import mongoose from 'mongoose'
import consola from 'consola'
import bodyParser from 'body-parser'
import formidable from 'express-formidable'

import NodeCache from 'node-cache'
export const cache = new NodeCache()

import axios from 'axios'
import axiosRetry from 'axios-retry'

axiosRetry(axios, { retries: 3 })
import { Nuxt, Builder } from 'nuxt'

import config from '../nuxt.config.js'
//import sign from './sign'
import upload from './upload/ipfs'
import { markets } from './markets'
import { pools } from './pools'
import { startUpdaters } from './updaters'
import { account } from './account'
import { serverInit } from './utils'
import { subscribe, unsubscribe } from './markets/sockets'

const app = express()

// Import and Set Nuxt.js options
config.dev = process.env.NODE_ENV !== 'production'

async function start () {
  //db sync
  if (!process.env.DISABLE_DB) {
    try {
      const uri = config.dev ? 'mongodb://localhost:27017/alcor_dev' : 'mongodb://host.docker.internal:27017/alcor_prod'
      await mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true })
      console.log('MongoDB connected!')
    } catch (e) {
      console.log(e)
      throw new Error('MongoDB connect err')
    }
  }

  app.use(bodyParser.json())
  app.use(formidable())
  app.use(serverInit)

  // Server routes
  app.use('/api/markets', markets)
  app.use('/api/account', account)
  app.use('/api/upload', upload)
  app.use('/api/pools', pools)

  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  const { host, port } = nuxt.options.server

  // NuxtJS
  await nuxt.ready()
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }
  app.use(nuxt.render)

  // Listen the server
  const server = app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })

  if (process.env.DISABLE_DB) return

  const io = socket(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', socket => {
    subscribe(io, socket)
    unsubscribe(io, socket)
  })

  app.set('io', io)

  startUpdaters(app)
}

start()
