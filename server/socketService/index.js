require('dotenv').config()

import { createServer } from 'http'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/cluster-adapter'
import { setupWorker } from '@socket.io/sticky'

import mongoose from 'mongoose'

import { Match, Bar } from '../models'

import { subscribe, unsubscribe } from './sockets'
import { pushDeal, pushAccountNewMatch } from './pushes'

const PORT = process.env.PORT || 7002

const redis = require('redis')
const client = redis.createClient()
client.connect()

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
})

io.adapter(createAdapter())
setupWorker(io)

httpServer.listen(PORT, function () {
  console.log(`WS Listening on port ${PORT}`)
})

async function main() {
  const uri = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/alcor_prod_new`
  await mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true })

  io.on('connection', socket => {
    console.log(socket.client.conn.server.clientsCount + 'users connected')

    subscribe(io, socket)
    unsubscribe(io, socket)
  })

  Match.watch().on('change', ({ fullDocument: match, operationType }) => {
    if (operationType != 'insert') return

    pushDeal(io, match)
    pushAccountNewMatch(io, match)
  })

  Bar.watch().on('change', async (op) => {
    let bar

    if (op.operationType == 'update') {
      const { documentKey: { _id } } = op
      bar = await Bar.findById(_id)
    } else if (op.operationType == 'insert') {
      bar = op.fullDocument
    }

    const { chain, market, timeframe, time, close, open, high, low, volume } = bar
    const tick = { close, open, high, low, volume, time: new Date(time).getTime() }
    io.to(`ticker:${chain}.${market}.${timeframe}`).emit('tick', tick)
  })

  const timeout = {}
  client.subscribe('market_action', message => {
    const [chain, market, action] = message.split('_')

    if (timeout[message]) {
      clearTimeout(timeout[message])
    }
    timeout[message] = setTimeout(() => {
      if (['buyreceipt', 'cancelbuy', 'sellmatch'].includes(action)) {
        io.to(`orders:${chain}.${market}`).emit('update_bids')
      }

      if (['sellreceipt', 'cancelsell', 'buymatch'].includes(action)) {
        io.to(`orders:${chain}.${market}`).emit('update_asks')
      }
    }, 400)
  })
}

main()
