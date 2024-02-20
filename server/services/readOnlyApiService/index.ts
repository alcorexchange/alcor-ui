// NEW API + OLD ROUTES
require('dotenv').config()

import express from 'express'
import consola from 'consola'
import bodyParser from 'body-parser'

import { networkResolver } from '../apiService/middleware'
import { swapRouter } from './swapRoute'

const app = express()

// Import and Set Nuxt.js options
function start () {
  app.use(networkResolver)

  // Before bodyParser coz use formidable
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  // Server routes
  app.use('/api/v2/swap', swapRouter)

  // Listen the server
  const PORT = process.env.PORT || 8000

  app.listen(PORT, () => {
    consola.ready({ message: `API Server listening on ${PORT}`, badge: true })
  })
  //process.send('ready')
}

start()
