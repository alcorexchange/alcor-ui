require('dotenv').config()

import { createServer } from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'

import { initRedis, mongoConnect } from '../../utils'
import { getSubscriber } from '../redis'
import { Match, Bar, SwapBar } from '../../models'

import { subscribe, unsubscribe } from './sockets'
import { pushDeal, pushAccountNewMatch } from './pushes'
import { initAccountUpdates } from './accountUpdates'

const httpServer = createServer()
const io = new Server(httpServer, { cors: { origin: '*' } })

//io.adapter(createAdapter())
//setupWorker(io)

httpServer.listen(process.env.PORT || 7002, function () {
  console.log(`SocketService Listening on port ${process.env.PORT || 7002}`)
})

async function main() {
  await mongoConnect()
  await initRedis()

  // FOR PM2
  //process.send('ready')
  process.on('SIGINT', async () => {
    await mongoose.connection.close()
    await httpServer.close()

    process.exit(0)
  })

  io.on('connection', socket => {
    console.log((<any>socket.client.conn).server.clientsCount + 'users connected')

    subscribe(io, socket)
    unsubscribe(io, socket)
  })

  Match.watch([{ $match: { operationType: 'insert' } }]).on('change', (op: any) => {
    pushDeal(io, op.fullDocument)
    pushAccountNewMatch(io, op.fullDocument)
  })

  Bar.watch([], { batchSize: 200 }).on('change', async (op) => {
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

  SwapBar.watch([], { batchSize: 200 }).on('change', async (op) => {
    let bar

    if (op.operationType == 'update') {
      const { documentKey: { _id } } = op
      bar = await SwapBar.findById(_id)
    } else if (op.operationType == 'insert') {
      bar = op.fullDocument
    }

    const { chain, pool, timeframe, time, close, open, high, low, volumeUSD } = bar
    const tick = { close, open, high, low, volumeUSD, time: new Date(time).getTime() }
    io.to(`swap-ticker:${chain}.${pool}.${timeframe}`).emit('swap-tick', tick)
  })

  getSubscriber().subscribe('orderbook_update', msg => {
    const { key, update } = JSON.parse(msg)
    const [chain, side, market] = key.split('_')

    io.to(`orderbook:${chain}.${side}.${market}`).emit(`orderbook_${side}`, update)
  })

  getSubscriber().subscribe('account:update-positions', msg => {
    const { chain, account, positions } = JSON.parse(msg)
    console.log('push to clicent:', 'account:update-positions', account)
    io.to(`account:${chain}.${account}`).emit('account:update-positions', positions)
  })

  getSubscriber().subscribe('swap:ticks:update', msg => {
    const { chain, poolId, update } = JSON.parse(msg)
    io.to(`swap:${chain}.${poolId}`).emit('swap:ticks:update', { poolId, ticks: update })

    // Push to room with all swap events
    io.to(`swap:${chain}`).emit('swap:ticks:update', { poolId, ticks: update })
  })

  getSubscriber().subscribe('swap:pool:update', msg => {
    const { chain, poolId, update } = JSON.parse(msg)
    io.to(`swap:${chain}.${poolId}`).emit('swap:pool:update', update)

    // Push to room with all swap events
    io.to(`swap:${chain}`).emit('swap:pool:update', update)
  })

  // ChainAction-based account updates (v2)
  initAccountUpdates(io)
}

main()
