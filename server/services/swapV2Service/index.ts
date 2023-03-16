require('dotenv').config()

import lodash from 'lodash'
import mongoose from 'mongoose'
import { createClient } from 'redis'

import { SwapPool, PositionHistory } from '../../models'
import { networks } from '../../../config'
import { fetchAllRows } from '../../../utils/eosjs'
import { getSingleEndpointRpc, getFailOverRpc } from './../../utils'

const client = createClient()
const publisher = client.duplicate()
const subscriber = client.duplicate()

type Tick = {
  id: number,
  liquidityGross: number
}

type TicksList = Map<number, Tick>

export async function getRedisTicks(chain: string, poolId: number) {
  const entries = await client.get(`ticks_${chain}_${poolId}`)
  return entries ? new Map(JSON.parse(entries) || []) : new Map()
}

async function setRedisTicks(chain: string, poolId: number, ticks: Array<[number, Tick]>) {
  // Orderbook style sort
  //ticks.sort((a, b) => a.id - b.id) они должны в сете сортернуться
  const mappedTicks = ticks.map(t => [t[0], t[1]])
  await client.set(`ticks_${chain}_${poolId}`, JSON.stringify(mappedTicks))
}

const throttles = {}
function throttledPoolUpdate(chain: string, poolId: number) {
  if (`${chain}_${poolId}` in throttles) {
    // Second call in throttle time
    throttles[`${chain}_${poolId}`] = true
    return
  }

  //console.log('pass call for', side, chain, market)
  updatePool(chain, poolId)
  updateTicks(chain, poolId)

  throttles[`${chain}_${poolId}`] = false

  setTimeout(function() {
    if (throttles[`${chain}_${poolId}`] === true) {
      updateTicks(chain, poolId)
    }

    delete throttles[`${chain}_${poolId}`]
  }, 500)
}

async function updatePool(chain: string, poolId: number) {
  // TODO Update pool in db and do pool update push
  //publisher.publish('pool_update', push)
}

async function updateTicks(chain: string, poolId: number) {
  const chainTicks = await getChianTicks(chain, poolId)
  const redisTicks = await getRedisTicks(chain, poolId)

  const update = []

  chainTicks.forEach((tick, id) => {
    const tick_old = redisTicks.get(id)

    if (!lodash.isEqual(tick_old, tick)) {
      update.push(tick)
    }
  })

  redisTicks.forEach((tick: Tick, id: number) => {
    if (!chainTicks.has(id)) {
      tick.liquidityGross = 0
      update.push(tick)
    }
  })

  await setRedisTicks(chain, poolId, Array.from(chainTicks))

  if (update.length == 0) return

  const push = JSON.stringify({ chain, poolId, update })
  publisher.publish('ticks_update', push)
}

async function connectAll() {
  const uri = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/alcor_prod_new`
  await mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true })

  // Redis
  await client.connect()
  await publisher.connect()
  await subscriber.connect()
}

async function getChianTicks(chain: string, poolId: number): Promise<TicksList> {
  const network = networks[chain]
  const rpc = getSingleEndpointRpc(network)

  const rows = await fetchAllRows(rpc, {
    code: network.amm.contract,
    scope: poolId,
    table: 'ticks'
  })

  return new Map(rows.map(r => [r.id, r]))
}

function parsePool(pool: { [key: string]: any }) {
  const tokenA = {
    contract: pool.tokenA.contract,
    symbol: pool.tokenA.quantity.split(' ')[1],
    quantity: pool.tokenA.quantity.split(' ')[0]
  }

  const tokenB = {
    contract: pool.tokenB.contract,
    symbol: pool.tokenB.quantity.split(' ')[1],
    quantity: pool.tokenB.quantity.split(' ')[0]
  }

  pool.protocolFeeA = parseFloat(pool.protocolFeeA)
  pool.protocolFeeB = parseFloat(pool.protocolFeeB)

  const { sqrtPriceX64, tick } = pool.currSlot
  delete pool.currSlot

  return { ...pool, tokenA, tokenB, sqrtPriceX64, tick }
}

async function updatePools(chain) {
  const network = networks[chain]
  const rpc = getFailOverRpc(network)

  const pools = await fetchAllRows(rpc, {
    code: network.amm.contract,
    scope: network.amm.contract,
    table: 'pools'
  })

  const to_create = []
  const current_pools = await SwapPool.distinct('id', { chain })

  for (const pool of pools) {
    if (!current_pools.includes(pool.id)) {
      to_create.push({ ...parsePool(pool), chain })
    }

    // TODO Get stats for pools
  }

  await SwapPool.insertMany(to_create)
}

export async function initialUpdate(chain: string, poolId?: number) {
  await connectAll()
  await updatePools(chain)

  if (poolId) {
    await updateTicks(chain, poolId)
    return
  }

  const markets = await SwapPool.find({ chain })

  for (const { chain, id } of markets) {
    console.log('updated ticks: ', chain, id)
    await updateTicks(chain, id)


    // Chain that we have our own nodes
    //if (!['wax', 'proton'].includes(chain)) await new Promise(resolve => setTimeout(resolve, 1000)) // Sleep for rate limit
  }
}

async function logMint({ chain, trx_id, data }) {
  // Get tokenA usd Price
  // Get tokenB usd Price

}


export async function main() {
  await connectAll()

  subscriber.subscribe('swap_action', message => {
    const { chain, name, trx_id, block_num, data } = JSON.parse(message)

    if (['logmint', 'logburn', 'logswap', 'logpool', 'logcollect'].includes(name)) {
      throttledPoolUpdate(chain, Number(data.poolId))
    }

    if (name == 'logswap') {
      // TODO Add swap to db
    }

    if (name == 'logmint') { // Pool creation
      logMint({ chain, trx_id, data })
      //PositionHistory

      //PositionHistory
      // add p&l
      // Pool update (will be created)
    }

    if (name == 'logburn') {
      // SUB pnl value
      // handle pnl update position
    }

    if (name == 'logcollect') {
      // add p&l
      // update position P&N
    }

  })

  console.log('TicksService started')
}


const command = process.argv[2]

if (command == 'initial') {
  initialUpdate(process.argv[3])
} else { main() }

//if (!command) { console.log('No command provided'); process.exit() }

