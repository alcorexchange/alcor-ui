import express from 'express'
import consola from 'consola'
import bodyParser from 'body-parser'
import NodeCache from 'node-cache'

import axios from 'axios'
import axiosRetry from 'axios-retry'

axiosRetry(axios, { retries: 3 })
import { Nuxt, Builder } from 'nuxt'

import config from '../nuxt.config.js'
import sign from './sign'
import markets from './markets'
import { serverInit } from './utils'

const app = express()

// Import and Set Nuxt.js options
config.dev = process.env.NODE_ENV !== 'production'

async function start () {
//function start () {
  app.use(bodyParser.json())
  app.use(serverInit)
  // Server routes
  app.post('/api/sign', sign)
  app.use('/api/markets', markets)

  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  const { host, port } = nuxt.options.server

  await nuxt.ready()
  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }
  // Give nuxt middleware to express | client routes
  app.use(nuxt.render)

  // Listen the server
  app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}
start()

export const cache = new NodeCache()
