require('dotenv').config()

import lodash from 'lodash'
import mongoose from 'mongoose'
import { createClient } from 'redis'

import JSBI from "jsbi"
import { Price, Q128 } from '@alcorexchange/alcor-swap-sdk'
import { parseAssetPlain, littleEndianToDesimalString } from '../../../utils'
import { SwapPool, Position, PositionHistory, Swap, SwapChartPoint } from '../../models'
import { networks } from '../../../config'
import { fetchAllRows } from '../../../utils/eosjs'
import { parseToken } from '../../../utils/amm'
import { updateTokensPrices } from '../updaterService/prices'
import { getPoolInstance, getRedisTicks, getPoolPriceA, getPoolPriceB } from './utils'
import { getSingleEndpointRpc, getFailOverRpc, getToken } from './../../utils'

const redis = createClient()
const publisher = redis.duplicate()
const subscriber = redis.duplicate()

// Used to wait for pool creation and fetching prices
let poolCreationLock = null

type Tick = {
  id: number,
  liquidityGross: number
}

type TicksList = Map<number, Tick>

// Getting sqrt price fot given time
export async function getClosestSqrtPrice(chain, pool, time) {
  const closestSwap = await Swap.findOne({ chain, pool, time: { $lte: new Date(time) } }).sort({ time: -1 }).limit(1).lean()

  if (closestSwap === null) {
    return (await getPool({ chain, id: pool })).sqrtPriceX64
  } else {
    return closestSwap.sqrtPriceX64
  }
}

async function setRedisTicks(chain: string, poolId: number, ticks: Array<[number, Tick]>) {
  // Orderbook style sort
  //ticks.sort((a, b) => a.id - b.id) они должны в сете сортернуться
  const mappedTicks = ticks.map(t => [t[0], t[1]])
  await redis.set(`ticks_${chain}_${poolId}`, JSON.stringify(mappedTicks))
}

// FIXME redo without request pool
async function handlePoolChart(
  chain: string,
  poolId: number,
  block_time: string,
  sqrtPriceX64: string,
  reserveA: number,
  reserveB: number,
  volumeA = 0,
  volumeB = 0,
) {
  //console.log({ chain, poolId, block_time, sqrtPriceX64, reserveA, reserveB, volumeA, volumeB })

  const network = networks[chain]

  const poolInstance = await getPool({ chain, id: poolId })
  const { tokenA: { id: tokenA_id }, tokenB: { id: tokenB_id } } = poolInstance

  const tokenAprice = await getToken(chain, tokenA_id)
  const tokenBprice = await getToken(chain, tokenB_id)

  const usdReserveA = reserveA * tokenAprice.usd_price
  const usdReserveB = reserveB * tokenBprice.usd_price

  const last_point = await SwapChartPoint.findOne({ chain: network.name, pool: poolId }, {}, { sort: { time: -1 } })

  const volumeTokenA = tokenAprice ? volumeA * tokenAprice.usd_price : 0
  const volumeTokenB = tokenBprice ? volumeB * tokenBprice.usd_price : 0

  const volumeUSD = volumeTokenA + volumeTokenB

  // Sptit by one minute
  //const minResolution = 60 * 60 // One hour
  const minResolution = 60 // FIXME
  if (last_point && Math.floor(last_point.time / 1000 / minResolution) == Math.floor(new Date(block_time).getTime() / 1000 / minResolution)) {
    last_point.sqrtPriceX64 = littleEndianToDesimalString(sqrtPriceX64)

    last_point.reserveA = reserveA
    last_point.reserveB = reserveB

    last_point.usdReserveA = usdReserveA
    last_point.usdReserveB = usdReserveB

    last_point.volumeUSD += volumeUSD

    return await last_point.save()
  } else {
    return await SwapChartPoint.create({
      chain,
      pool: poolId,
      price: littleEndianToDesimalString(sqrtPriceX64),
      reserveA,
      reserveB,
      volumeUSD,
      usdReserveA,
      usdReserveB,
      time: block_time
    })
  }
}

// Get pool and wait for pool lock while pool might be creating
async function getPool(filter) {
  let pool = await SwapPool.findOne(filter).lean()

  if (pool === null) {
    console.warn(`WARNING: Updating(and creating) non existing pool ${filter.id} action`)
    pool = await updatePool(filter.chain, filter.id)

    // It might be first position of just created pool
    // Update token prices in that case
    await updateTokensPrices(networks[filter.chain])
  }

  if (pool === null) {
    console.error('pool still null')
    process.exit(1)
  }

  return pool
}

const throttles = {}
function throttledPoolUpdate(chain: string, poolId: number) {
  if (`${chain}_${poolId}` in throttles) {
    // Second call in throttle time
    throttles[`${chain}_${poolId}`] = true
    return
  }

  updatePool(chain, poolId)

  throttles[`${chain}_${poolId}`] = false
  setTimeout(function() {
    if (throttles[`${chain}_${poolId}`] === true) {
      updatePool(chain, poolId)
    }

    delete throttles[`${chain}_${poolId}`]
  }, 500)
}

async function updatePositions(chain: string, poolId: number) {
  console.log('updatePositions', poolId)
  const network = networks[chain]
  const rpc = getFailOverRpc(network)

  const positions = await fetchAllRows(rpc, {
    code: network.amm.contract,
    scope: poolId,
    table: 'positions'
  })

  // Mapping pool id to position
  positions.forEach(p => p.pool = poolId)

  const current = JSON.parse(await redis.get(`positions_${chain}`) || '[]')
  const keep = current.filter(p => p.pool != poolId)

  const to_set = [...keep, ...positions]
  await redis.set(`positions_${chain}`, JSON.stringify(to_set))


  // Find removed/added positions for push
  // const changed = []

  // const oldPositions = current.filter(p => p.pool == poolId)
  // for (const old of oldPositions) {
  //   if (positions.find(p => p.id == old.id))
  // }


  //const push = JSON.stringify({ chain, account, positions })

  // Merging

  // JUST BULK EXAMPLE
  // FIXME Remove it's old, storing positions in mongo
  // const bulkOps = positions.map(p => {
  //   const { owner, id } = p

  //   return {
  //     updateOne: {
  //         filter: { chain, pool: poolId, owner, id },
  //         update: p,
  //         upsert: true,
  //     }
  //   }
  // })
  //return await Position.bulkWrite(bulkOps)
}

async function updatePool(chain: string, poolId: number) {
  console.log('update pool', poolId)
  const network = networks[chain]
  const rpc = getFailOverRpc(network)

  const [pool] = await fetchAllRows(rpc, {
    code: network.amm.contract,
    scope: network.amm.contract,
    table: 'pools',
    limit: 1,
    lower_bound: poolId,
    upper_bound: poolId
  })

  // TODO May be change to warning
  if (!pool) throw new Error('NOT FOUND POOL FOR UPDATE: ' + poolId)

  const push = JSON.stringify({ chain, poolId, update: [pool] })
  publisher.publish('swap:pool:update', push)

  updateTicks(chain, poolId)

  const parsedPool = parsePool(pool)

  // Update tvlUSD
  const tokenA = await getToken(chain, parsedPool.tokenA.id)
  const tokenB = await getToken(chain, parsedPool.tokenB.id)

  const tokenAUSDPrice = tokenA?.usd_price || 0
  const tokenBUSDPrice = tokenB?.usd_price || 0

  const tvlUSD = parsedPool.tokenA.quantity * tokenAUSDPrice + parsedPool.tokenB.quantity * tokenBUSDPrice

  const price = new Price(
    parseToken(pool.tokenA),
    parseToken(pool.tokenB),
    Q128,
    JSBI.multiply(JSBI.BigInt(parsedPool.sqrtPriceX64), JSBI.BigInt(parsedPool.sqrtPriceX64))
  )

  const priceA = price.toSignificant()
  const priceB = price.invert().toSignificant()

  // TODO FIX DEPRECATED
  return await SwapPool.findOneAndUpdate({ chain, id: poolId }, { ...parsedPool, priceA, priceB, tvlUSD }, { upsert: true, new: true })
}

async function updateTicks(chain: string, poolId: number) {
  console.log('update ticks:', poolId)
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
  publisher.publish('swap:ticks:update', push)
}

export async function connectAll() {
  const uri = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`
  await mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true })

  // Redis
  if (!redis.isOpen) {
    await redis.connect()
    await publisher.connect()
    await subscriber.connect()
  }
}

async function getChianTicks(chain: string, poolId: number): Promise<TicksList> {
  const network = networks[chain]
  const rpc = getSingleEndpointRpc(network)

  const rows = await fetchAllRows(rpc, {
    code: network.amm.contract,
    scope: poolId,
    table: 'ticks',
    bigNumberFix: true
  })

  rows.forEach(i => { i.id = parseFloat(i.id) })

  return new Map(rows.map(r => [r.id, r]))
}

function parsePool(pool: { [key: string]: any }) {
  const tokenA = { ...parseToken(pool.tokenA), quantity: pool.tokenA.quantity.split(' ')[0] }
  const tokenB = { ...parseToken(pool.tokenB), quantity: pool.tokenB.quantity.split(' ')[0] }

  pool.protocolFeeA = parseFloat(pool.protocolFeeA)
  pool.protocolFeeB = parseFloat(pool.protocolFeeB)

  const { sqrtPriceX64, tick } = pool.currSlot
  delete pool.currSlot

  return { ...pool, tokenA, tokenB, sqrtPriceX64, tick }
}

export async function updatePools(chain) {
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
      const parsed_pool = parsePool(pool)

      const price = new Price(
        parseToken(pool.tokenA),
        parseToken(pool.tokenB),
        Q128,
        JSBI.multiply(JSBI.BigInt(parsed_pool.sqrtPriceX64), JSBI.BigInt(parsed_pool.sqrtPriceX64))
      )

      const priceA = price.toSignificant()
      const priceB = price.invert().toSignificant()

      const p = {
        ...parsed_pool,
        priceA,
        priceB,
        chain
      }

      to_create.push(p)
    } else {
      await updatePool(chain, pool.id)
    }
  }

  console.log('updated pools for ', chain)
  await SwapPool.insertMany(to_create)
}

export async function initialUpdate(chain: string, poolId?: number) {
  console.log('swap initialUpdate started: ', chain)
  await connectAll()
  await updatePools(chain)

  if (poolId) {
    await updateTicks(chain, poolId)
    return
  }

  const markets = await SwapPool.find({ chain })

  //for (const { chain, id } of markets) {
  //  //await updateTicks(chain, id)
  //  await updatePool(chain, id)

  //  // Chain that we have our own nodes
  //  //if (!['wax', 'proton'].includes(chain)) await new Promise(resolve => setTimeout(resolve, 1000)) // Sleep for rate limit
  //}
}

async function saveMintOrBurn({ chain, data, type, trx_id, block_time }) {
  // TODO Можно по ликвидности составить историю позиции складывать вычитать и сортировать по блоку
  // find last mint/burn and update it with -sub or +mint
  const { poolId, posId, owner, liquidity } = data

  const tokenAamount = parseFloat(data.tokenA)
  const tokenBamount = parseFloat(data.tokenB)

  if (tokenAamount == 0 && tokenBamount == 0) return undefined

  const pool = await getPool({ id: poolId, chain })

  const tokenA = await getToken(chain, pool.tokenA.id)
  const tokenB = await getToken(chain, pool.tokenB.id)

  const tokenAUSDPrice = tokenA?.usd_price || 0
  const tokenBUSDPrice = tokenB?.usd_price || 0

  const totalUSDValue = ((tokenAamount * tokenAUSDPrice) + (tokenBamount * tokenBUSDPrice)).toFixed(4)

  return await PositionHistory.create({
    chain,
    owner,
    type,
    id: posId,
    pool: poolId,
    tokenA: tokenAamount,
    tokenB: tokenBamount,
    tokenAUSDPrice,
    tokenBUSDPrice,
    totalUSDValue,
    liquidity,
    trx_id,
    time: block_time
  })
}

export async function handleSwap({ chain, data, trx_id, block_time }) {
  const { poolId, recipient, sender, sqrtPriceX64 } = data

  const tokenAamount = parseFloat(data.tokenA)
  const tokenBamount = parseFloat(data.tokenB)

  if (tokenAamount == 0 && tokenBamount == 0) return undefined

  const pool = await getPool({ id: poolId, chain })

  const tokenA = await getToken(chain, pool.tokenA.id)
  const tokenB = await getToken(chain, pool.tokenB.id)

  const tokenAUSDPrice = tokenA?.usd_price || 0
  const tokenBUSDPrice = tokenB?.usd_price || 0

  const totalUSDVolume = Math.abs(tokenAamount * tokenAUSDPrice) + Math.abs(tokenBamount * tokenBUSDPrice)

  return await Swap.create({
    chain,
    pool: poolId,
    recipient,
    trx_id,
    sender,
    sqrtPriceX64: littleEndianToDesimalString(sqrtPriceX64),
    totalUSDVolume,
    tokenA: tokenAamount,
    tokenB: tokenBamount,
    time: block_time,
  })
}

export async function onSwapAction(message: string) {
  const { chain, name, trx_id, block_time, data } = JSON.parse(message)

  console.log('swap action', name)

  if (name == 'logpool') {
    await updatePool(chain, data.poolId)
    await updateTokensPrices(networks[chain]) // Update right away so other handlers will have tokenPrices

    // poolCreationLock = new Promise(async (resolve, reject) => {
    //   await updatePool(chain, data.poolId)
    //   await updateTokensPrices(networks[chain]) // Update right away so other handlers will have tokenPrices

    //   resolve(true)
    //   poolCreationLock = null
    // })
  }

  if (name == 'logswap') {
    await handleSwap({ chain, trx_id, data, block_time })

    handlePoolChart(
      chain,
      data.poolId,
      block_time,
      littleEndianToDesimalString(data.sqrtPriceX64),
      parseAssetPlain(data.reserveA).amount,
      parseAssetPlain(data.reserveB).amount,

      // Providing volume, that only available in swap action
      // (should be positive for both values)
      Math.abs(parseAssetPlain(data.tokenA).amount),
      Math.abs(parseAssetPlain(data.tokenB).amount)
    )
  }

  if (name == 'logmint') {
    await saveMintOrBurn({ chain, trx_id, data, type: 'mint', block_time })
    await updatePositions(chain, data.poolId)
  }

  if (name == 'logburn') {
    await saveMintOrBurn({ chain, trx_id, data, type: 'burn', block_time })
    await updatePositions(chain, data.poolId)
  }

  if (name == 'logcollect') {
    await saveMintOrBurn({ chain, trx_id, data, type: 'collect', block_time })
    await updatePositions(chain, data.poolId)
  }

  if (['logmint', 'logburn', 'logswap', 'logcollect'].includes(name)) {
    throttledPoolUpdate(chain, Number(data.poolId))
  }

  // Send push to update user position
  if (['logmint', 'logburn', 'logcollect'].includes(name)) {
    const { posId, owner } = data
    const push = { chain, account: owner, positions: [posId] }

    console.log('account:update-positions', owner)
    publisher.publish('account:update-positions', JSON.stringify(push))
  }

  if (['logmint', 'logburn', 'logcollect'].includes(name)) {
    const sqrtPriceX64 = await getClosestSqrtPrice(chain, data.poolId, block_time)
    handlePoolChart(
      chain,
      data.poolId,
      block_time,
      sqrtPriceX64,
      parseAssetPlain(data.reserveA).amount,
      parseAssetPlain(data.reserveB).amount,
    )
  }
}

export async function main() {
  await connectAll()

  //updatePool('wax', 1095)
  //updatePositions

  subscriber.subscribe('swap_action', message => {
    onSwapAction(message)
  })

  console.log('SwapService started!')
}

// TODO Run as separate service
main()
