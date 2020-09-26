import socket from 'socket.io'
import express from 'express'
import consola from 'consola'
import bodyParser from 'body-parser'
import NodeCache from 'node-cache'
export const cache = new NodeCache()

import axios from 'axios'
import axiosRetry from 'axios-retry'

axiosRetry(axios, { retries: 3 })
import { Nuxt, Builder } from 'nuxt'

import config from '../nuxt.config.js'
//import sign from './sign'
import { markets, startUpdaters } from './markets'
import { serverInit } from './utils'
import { syncModels } from './models'

const app = express()

// Import and Set Nuxt.js options
config.dev = process.env.NODE_ENV !== 'production'

async function start () {
  //db sync
  await syncModels()
  startUpdaters(app)

  app.use(bodyParser.json())
  app.use(serverInit)
  // Server routes
  //app.post('/api/sign', sign)
  app.use('/api/markets', markets)

  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  const { host, port } = nuxt.options.server

  //// NuxtJS
  //await nuxt.ready()
  //if (config.dev) {
  //  const builder = new Builder(nuxt)
  //  await builder.build()
  //}

  //app.use(nuxt.render)

  // Listen the server
  const server = app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })

  const io = socket(server)
  io.on('connection', function (socket) {
    app.set('socket', socket)
  })
}

start()
