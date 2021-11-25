require('dotenv').config()

import lodash from 'lodash'
import fetch from 'node-fetch'
import mongoose from 'mongoose'
import { JsonRpc } from '../../assets/libs/eosjs-jsonrpc'

import { networks } from '../../config'
import { Match, Bar } from '../models'
import { littleEndianToDesimal, parseAsset } from '../../utils'

const redis = require('redis')
const client = redis.createClient()
client.connect()

async function getOrderbook(chain, side, market) {
  const entries = await client.get(`orderbook_${chain}_${side}_${market}`)
  return entries ? new Map(JSON.parse(entries) || []) : new Map()
}

async function setOrderbook(chain, side, market, orderbook) {
  await client.set(
    `orderbook_${chain}_${side}_${market}`, JSON.stringify(Array.from(orderbook))
  )
}

export function mergeSamePriceOrders(ords) {
  const orders = new Map()

  for (const o of ords) {
    const unit_price = parseInt(o.unit_price)
    const order = orders.get(unit_price)

    if (!order) {
      orders.set(unit_price, [unit_price, o.bid.amount, o.ask.amount])
    } else {
      order[1] += o.bid.amount
      order[2] += o.ask.amount
    }
  }

  return orders
}

async function updateOrders(side, chain, market_id) {
  const orderbook = await getOrderbook(chain, side, market_id)
  const _orders = await getOrders({ side, chain, market_id })
  const orders = mergeSamePriceOrders(_orders)

  const update = []
  orders.forEach((row_new, key) => {
    const row_old = orderbook.get(key)

    if (!lodash.isEqual(row_old, row_new)) {
      update.push(row_new)
    }
  })

  await setOrderbook(chain, side, market_id, orders)

  // TODO Пушит это пабсабом в прокси
  console.log('update', side, update)
}

async function getOrders({ chain, market_id, side }) {
  const network = networks[chain]
  const nodes = [network.protocol + '://' + network.host + ':' + network.port].concat(network.client_nodes)
  const rpc = new JsonRpc(nodes, { fetch })

  const { rows } = await rpc.get_table_rows({
    code: network.contract,
    scope: market_id,
    table: `${side}order`,
    //limit: 1000,
    limit: 100,
    key_type: 'i128',
    index_position: 2
  })

  return rows.map((b) => {
    b.ask = parseAsset(b.ask)
    b.bid = parseAsset(b.bid)
    b.unit_price = littleEndianToDesimal(b.unit_price)

    return b
  })
}

//async function main() {
//  const uri = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/alcor_prod_new`
//  await mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true })
//
//  io.on('connection', socket => {
//    console.log(socket.client.conn.server.clientsCount + 'users connected')
//
//    subscribe(io, socket)
//    unsubscribe(io, socket)
//  })
//
//  Match.watch().on('change', ({ fullDocument: match, operationType }) => {
//    if (operationType != 'insert') return
//
//    pushDeal(io, match)
//    pushAccountNewMatch(io, match)
//  })
//
//  Bar.watch().on('change', async (op) => {
//    let bar
//
//    if (op.operationType == 'update') {
//      const { documentKey: { _id } } = op
//      bar = await Bar.findById(_id)
//    } else if (op.operationType == 'insert') {
//      bar = op.fullDocument
//    }
//
//    const { chain, market, timeframe, time, close, open, high, low, volume } = bar
//    const tick = { close, open, high, low, volume, time: new Date(time).getTime() }
//    io.to(`ticker:${chain}.${market}.${timeframe}`).emit('tick', tick)
//  })
//
//  client.subscribe('market_action', message => {
//    const [chain, market, action] = message.split('_')
//
//    if (['buyreceipt', 'cancelbuy', 'sellmatch'].includes(action)) {
//      updateBuyOrders(chain, market)
//    }
//
//    if (['sellreceipt', 'cancelsell', 'buymatch'].includes(action)) {
//      io.to(`orders:${chain}.${market}`).emit('update_asks')
//    }
//  })
//
//  const timeout = {}
//  client.subscribe('market_action', message => {
//    const [chain, market, action] = message.split('_')
//
//    if (timeout[message]) {
//      clearTimeout(timeout[message])
//    }
//    timeout[message] = setTimeout(() => {
//      if (['buyreceipt', 'cancelbuy', 'sellmatch'].includes(action)) {
//        io.to(`orders:${chain}.${market}`).emit('update_bids')
//      }
//
//      if (['sellreceipt', 'cancelsell', 'buymatch'].includes(action)) {
//        io.to(`orders:${chain}.${market}`).emit('update_asks')
//      }
//    }, 500)
//  })
//}

//main()
setInterval(() => updateOrders('buy', 'wax', 104), 5000)
setInterval(() => updateOrders('sell', 'wax', 104), 5000)


// TODO Тут слушаем на новые экшены и обновляем ордербук в редис
// TODO Функция которая при запуске сразу обновляет все маркеты
