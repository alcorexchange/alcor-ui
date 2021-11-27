require('dotenv').config()

import lodash from 'lodash'
import fetch from 'node-fetch'
import mongoose from 'mongoose'
import { createClient } from 'redis'
import { JsonRpc } from '../../assets/libs/eosjs-jsonrpc'

import { Market } from '../models'
import { networks } from '../../config'
import { littleEndianToDesimal, parseAsset } from '../../utils'

const client = createClient()
const publisher = client.duplicate()
const subscriber = client.duplicate()

export async function getOrderbook(chain, side, market) {
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

const throttles = {}
function throttledUpdate(side, chain, market) {
  if (`${side}_${chain}_${market}` in throttles) {
    // Second call in throttle time
    throttles[`${side}_${chain}_${market}`] = true
    return
  }

  //console.log('pass call for', side, chain, market)
  updateOrders(side, chain, market)
  throttles[`${side}_${chain}_${market}`] = false

  setTimeout(function() {
    if (throttles[`${side}_${chain}_${market}`] === true) {
      updateOrders(side, chain, market)
    }

    delete throttles[`${side}_${chain}_${market}`]
  }, 500)
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

  orderbook.forEach((row, key) => {
    if (!orders.has(key)) {
      row[1] = 0
      row[2] = 0
      update.push(row)
    }
  })

  await setOrderbook(chain, side, market_id, orders)

  if (update.length == 0) return

  const push = JSON.stringify({ key: `${chain}_${side}_${market_id}`, update })
  publisher.publish('orderbook_update', push)
}

const rpcs = {}
function getRpc(network) {
  if (network.name in rpcs) return rpcs[network.name]

  const nodes = [network.protocol + '://' + network.host + ':' + network.port].concat(network.client_nodes)
  nodes.sort((a, b) => a.includes('alcor') ? -1 : 1)

  const rpc = new JsonRpc(nodes, { fetch })
  rpcs[network.name] = rpc

  return rpc
}

async function getOrders({ chain, market_id, side }) {
  const network = networks[chain]
  const rpc = getRpc(network)

  const { rows } = await rpc.get_table_rows({
    code: network.contract,
    scope: market_id,
    table: `${side}order`,
    limit: 1000,
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

async function initialUpdate() {
  console.log('Start markets orderbooks update..')

  const markets = await Market.find()
  for (const { chain, id: market } of markets) {
    updateOrders('buy', chain, market)
    updateOrders('sell', chain, market)

    await new Promise(resolve => setTimeout(resolve, 1000)) // Sleep for rate limit
  }
}

export async function main() {
  const uri = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/alcor_prod_new`
  await mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true })

  // Redis
  await client.connect()
  await publisher.connect()
  await subscriber.connect()

  //initialUpdate()

  subscriber.subscribe('market_action', message => {
    const [chain, market, action] = message.split('_')

    if (['buyreceipt', 'cancelbuy', 'sellmatch'].includes(action)) {
      throttledUpdate('buy', chain, market)
    }

    if (['sellreceipt', 'cancelsell', 'buymatch'].includes(action)) {
      throttledUpdate('sell', chain, market)
    }
  })
}
