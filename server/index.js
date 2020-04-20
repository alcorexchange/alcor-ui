const express = require('express')
const consola = require('consola')
const bodyParser = require('body-parser')

const { Nuxt, Builder } = require('nuxt')
const app = express()

const config = require('../nuxt.config.js')
const sign = require('./sign.js')

// Import and Set Nuxt.js options
config.dev = process.env.NODE_ENV !== 'production'

async function start () {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  const { host, port } = nuxt.options.server

  await nuxt.ready()
  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }

  app.use(bodyParser.json())
  // Server routes
  app.post('/api/sign', sign)

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
