import redis from 'redis'
import express from 'express'
import socket from 'socket.io'
import mongoose from 'mongoose'

import { Match, Bar } from '../models'

import { subscribe, unsubscribe } from './sockets'
import { pushDeal, pushAccountNewMatch } from './pushes'

const dev = process.env.NODE_ENV !== 'production'
const PORT = 7002
const app = express()
const server = app.listen(PORT, function () {
  console.log(`WS Listening on port ${PORT}`)
})

const client = redis.createClient()
const io = socket(server)

async function main() {
  const uri = dev ? 'mongodb://localhost:27017/alcor_dev' : 'mongodb://host.docker.internal:27017/alcor_prod_new'
  await mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true })
  console.log('mongodb connected')

  io.on('connection', socket => {
    subscribe(io, socket)
    unsubscribe(io, socket)
  })

  Match.watch().on('change', ({ fullDocument: match, operationType }) => {
    if (operationType != 'insert') return

    pushDeal(io, match)
    pushAccountNewMatch(io, match)

    io.to(`orders:${match.chain}.${match.market}`).emit('update_orders')
  })

  Bar.watch().on('change', async (op) => {
    let bar

    if (op.operationType == 'update') {
      const { documentKey: { _id } } = op
      bar = await Bar.findById(_id)
    } else if (op.operationType == 'insert') {
      bar = op.fullDocument
    }

    const { chain, market, timeframe } = bar
    const tick = { ...bar, time: new Date(bar.time).getTime() }
    io.to(`ticker:${chain}.${market}.${timeframe}`).emit('tick', tick)
  })


  const timeout = {}
  client.on('message', (channel, message) => {
    if (channel == 'market_action') {
      const [chain, market, action] = message.split('_')

      if (timeout[message]) {
        clearTimeout(timeout[message])
      }
      timeout[message] = setTimeout(() => {
        if (['buyreceipt', 'cancelbuy'].includes(action)) {
          io.to(`orders:${chain}.${market}`).emit('update_bids')
        }

        if (['sellreceipt', 'cancelsell'].includes(action)) {
          io.to(`orders:${chain}.${market}`).emit('update_asks')
        }
      }, 400)
    }
  })

  client.subscribe('market_action')
}

main()
