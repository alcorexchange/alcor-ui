require('dotenv').config()

import lodash from 'lodash'
import mongoose from 'mongoose'
import { createClient } from 'redis'

import { Market } from '../../models'
import { networks } from '../../../config'
import { littleEndianToDesimal, parseAsset } from '../../../utils'
import { fetchAllRows } from '../../../utils/eosjs'
import { getFailOverAlcorOnlyRpc, initRedis, mongoConnect } from './../../utils'

const client = createClient()
const publisher = client.duplicate()
const subscriber = client.duplicate()

async function updateBidAsk(chain, side, market_id, orders) {
  if (orders.size != 0) {
    if (side == 'buy') {
      await Market.updateOne({ id: market_id, chain }, { bid: Math.max(...orders.keys()) / 100000000 })
    } else {
      await Market.updateOne({ id: market_id, chain }, { ask: Math.min(...orders.keys()) / 100000000 })
    }
  }
}

export async function getOrderbook(chain, side, market) {
  if (!client.isOpen) await client.connect()

  const entries = await client.get(`orderbook_${chain}_${side}_${market}`)
  return entries ? new Map(JSON.parse(entries) || []) : new Map()
}

async function setOrderbook(chain, side, market, orderbook) {
  // Orderbook style sort
  const orders = Array.from(orderbook).sort((a, b) => side == 'buy' ? b[0] - a[0] : a[0] - b[0])
  await client.set(`orderbook_${chain}_${side}_${market}`, JSON.stringify(orders))
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

  if (orders.size == 0) {
    console.log('Empty orderbook update: ', { chain, side, market_id })
    await setOrderbook(chain, side, market_id, orders)
    return
  }

  await setOrderbook(chain, side, market_id, orders)
  updateBidAsk(chain, side, market_id, orders)

  if (update.length == 0) return

  const push = JSON.stringify({ key: `${chain}_${side}_${market_id}`, update })
  publisher.publish('orderbook_update', push)
  console.log(chain, side, 'orders updated', market_id)
}

async function connectAll() {
  await mongoConnect()

  // Redis
  await client.connect()
  await publisher.connect()
  await subscriber.connect()
}

async function getOrders({ chain, market_id, side }) {
  const network = networks[chain]
  const rpc = getFailOverAlcorOnlyRpc(network)

  const rows = await fetchAllRows(rpc, {
    code: network.contract,
    scope: market_id,
    table: `${side}order`
  })

  return rows.map((b) => {
    b.ask = parseAsset(b.ask)
    b.bid = parseAsset(b.bid)
    b.unit_price = littleEndianToDesimal(b.unit_price)

    return b
  })
}

export async function initialUpdate(chain, market_id) {
  await connectAll()

  if (market_id) {
    await updateOrders('buy', chain, market_id)
    await updateOrders('sell', chain, market_id)
    console.log('updated orderbook', market_id)
    return
  }

  const markets = await Market.find({ chain })

  for (const { chain, id: market } of markets) {
    await updateOrders('buy', chain, market)
    await updateOrders('sell', chain, market)

    console.log('updated orderbook: ', chain, market)
  }
}

function onChainEvent(message) {
  const { chain, name, data } = JSON.parse(message)
  console.log('onChainEvent', message)

  const market = data?.record?.market?.id || data?.market_id

  if (!market) {
    console.log('unknown action', { chain, name, data })
  }

  if (['buyreceipt', 'cancelbuy', 'sellmatch'].includes(name)) {
    throttledUpdate('buy', chain, market)
  }

  if (['sellreceipt', 'cancelsell', 'buymatch'].includes(name)) {
    throttledUpdate('sell', chain, market)
  }
}

export async function main() {
  await connectAll()
  await initRedis()
  console.log('OrderbookService setarted')

  subscriber.subscribe('market_action', message => {
    const [chain, market, action] = message.split('_')

    if (['buyreceipt', 'cancelbuy', 'sellmatch'].includes(action)) {
      throttledUpdate('buy', chain, market)
    }

    if (['sellreceipt', 'cancelsell', 'buymatch'].includes(action)) {
      throttledUpdate('sell', chain, market)
    }
  })

  // TODO update to use config
  subscriber.pSubscribe('chainAction:*:alcor:*', m => onChainEvent(m))
  subscriber.pSubscribe('chainAction:*:book.alcor:*', m => onChainEvent(m))
  subscriber.pSubscribe('chainAction:*:alcordexmain:*', m => onChainEvent(m))
  subscriber.pSubscribe('chainAction:*:eostokensdex:*', m => onChainEvent(m))
}
