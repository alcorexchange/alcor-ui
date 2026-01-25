require('dotenv').config()

import { isEqual, throttle } from 'lodash'

import { Price, Q128, Pool } from '@alcorexchange/alcor-swap-sdk'
import { parseAssetPlain, littleEndianToDesimalString } from '../../../utils'
import { SwapPool, Position, PositionHistory, Swap, SwapChartPoint, SwapBar } from '../../models'
import { networks } from '../../../config'
import { fetchAllRows } from '../../../utils/eosjs'
import { parseToken } from '../../../utils/amm'
import { updateTokensPrices } from '../updaterService/prices'
import { makeSwapBars, resolutions, getBarTimes } from '../updaterService/charts'
import { poolInstanceFromMongoPool, getRedisTicks } from './utils'
import { deleteKeysByPattern, getFailOverAlcorOnlyRpc, getToken, getTokens, initRedis, mongoConnect } from './../../utils'
import { getRedis, getPublisher } from '../redis'

// Used to wait for pool creation and fetching prices
let poolCreationLock = null

// Batching state per chain
type SwapBatchItem = {
  chain: string
  trx_id: string
  data: any
  block_time: string
  block_num: number
}

type SwapBatch = {
  block_num: number
  block_time: string
  swaps: SwapBatchItem[]
}

const chainBatches: Map<string, SwapBatch> = new Map()

// Flush all pending batches (for graceful shutdown)
export async function flushAllSwapBatches() {
  for (const [chain, batch] of chainBatches) {
    if (batch.swaps.length > 0) {
      console.log(`[FLUSH] Flushing pending batch for ${chain} block ${batch.block_num}`)
      await flushSwapBatch(chain, batch)
    }
  }
  chainBatches.clear()
}

// Flush swap batch - process all swaps for a block at once
async function flushSwapBatch(chain: string, batch: SwapBatch) {
  if (batch.swaps.length === 0) return

  const t0 = Date.now()

  // 1. Collect unique pool IDs (ensure numbers)
  const uniquePoolIds = [...new Set(batch.swaps.map(s => Number(s.data.poolId)))]

  // 2. Fetch all pools at once
  const pools = await SwapPool.find({ chain, id: { $in: uniquePoolIds } }).lean()
  const poolsMap = new Map(pools.map((p: any) => [Number(p.id), p]))

  if (pools.length === 0) {
    console.log(`[BATCH WARNING] No pools found for IDs: ${uniquePoolIds.slice(0, 5).join(', ')}...`)
  }

  // 3. Get all tokens (already cached in redis by getTokens)
  const tokenCache: any[] = await getTokens(chain)
  const tokensMap = new Map<string, any>(tokenCache.map(t => [t.id, t]))

  // Group swaps by pool for OHLC aggregation
  const poolSwaps = new Map<number, SwapBatchItem[]>()
  const swapDocs: any[] = []

  for (const s of batch.swaps) {
    const { data, trx_id, block_time, block_num } = s
    const { poolId, recipient, sender, sqrtPriceX64 } = data

    const tokenAamount = parseFloat(data.tokenA)
    const tokenBamount = parseFloat(data.tokenB)

    if (tokenAamount === 0 && tokenBamount === 0) continue

    const pool = poolsMap.get(Number(poolId))
    if (!pool) continue

    const tokenA = tokensMap.get(pool.tokenA.id)
    const tokenB = tokensMap.get(pool.tokenB.id)

    const tokenAUSDPrice = tokenA?.usd_price || 0
    const tokenBUSDPrice = tokenB?.usd_price || 0

    const totalUSDVolume = (Math.abs(tokenAamount * tokenAUSDPrice) + Math.abs(tokenBamount * tokenBUSDPrice)) / 2

    const swapDoc = {
      chain,
      pool: Number(poolId),
      recipient,
      trx_id,
      sender,
      sqrtPriceX64: littleEndianToDesimalString(sqrtPriceX64),
      totalUSDVolume,
      tokenA: tokenAamount,
      tokenB: tokenBamount,
      time: block_time,
      block_num,
    }

    swapDocs.push(swapDoc)

    // Group for OHLC
    const numPoolId = Number(poolId)
    if (!poolSwaps.has(numPoolId)) {
      poolSwaps.set(numPoolId, [])
    }
    poolSwaps.get(numPoolId)!.push(s)
  }

  const t1 = Date.now()

  // 1. Bulk insert all swap documents
  if (swapDocs.length > 0) {
    await Swap.insertMany(swapDocs, { ordered: true })
  }

  const t2 = Date.now()

  // 2. Update OHLC bars per pool (aggregated) - parallel
  await Promise.all([...poolSwaps.entries()].map(([poolId, swaps]) =>
    updateSwapBarsForPool(chain, poolId, swaps, swapDocs.filter(d => d.pool === poolId))
  ))

  const t3 = Date.now()

  // 3. Update pool chart with last swap data per pool - parallel
  await Promise.all([...poolSwaps.entries()].map(([poolId, swaps]) => {
    const lastSwap = swaps[swaps.length - 1]
    const { data, block_time } = lastSwap

    return handlePoolChart(
      chain,
      poolId,
      block_time,
      littleEndianToDesimalString(data.sqrtPriceX64),
      parseAssetPlain(data.reserveA).amount,
      parseAssetPlain(data.reserveB).amount,
      swaps.reduce((sum, s) => sum + Math.abs(parseAssetPlain(s.data.tokenA).amount), 0),
      swaps.reduce((sum, s) => sum + Math.abs(parseAssetPlain(s.data.tokenB).amount), 0)
    )
  }))

  const t4 = Date.now()

  const total = t4 - t0
  const account = networks[chain].amm.contract

  // Publish events
  for (const s of batch.swaps) {
    const message = JSON.stringify({
      chain,
      name: 'logswap',
      trx_id: s.trx_id,
      block_time: s.block_time,
      block_num: s.block_num,
      data: s.data
    })
    getPublisher().publish(`chainAction:${chain}:${account}:logswap`, message)
  }

  // Only log if slow (>500ms) or every 10th block for progress
  if (total > 500 || batch.block_num % 10 === 0) {
    console.log(`[${chain}:${account}] #${batch.block_num} ${batch.swaps.length} swaps ${total}ms`)
  }
}

// Update OHLC bars for a pool with aggregated data from batch
async function updateSwapBarsForPool(chain: string, poolId: number, swaps: SwapBatchItem[], swapDocs: any[]) {
  if (swapDocs.length === 0) return

  // Calculate aggregated OHLC values
  const prices = swapDocs.map(d => d.sqrtPriceX64)
  const openPrice = prices[0]
  const closePrice = prices[prices.length - 1]
  const highPrice = prices.reduce((max, p) => BigInt(p) > BigInt(max) ? p : max, prices[0])
  const lowPrice = prices.reduce((min, p) => BigInt(p) < BigInt(min) ? p : min, prices[0])

  const totalVolumeA = swapDocs.reduce((sum, d) => sum + Math.abs(d.tokenA), 0)
  const totalVolumeB = swapDocs.reduce((sum, d) => sum + Math.abs(d.tokenB), 0)
  const totalVolumeUSD = swapDocs.reduce((sum, d) => sum + d.totalUSDVolume, 0)

  const swapTime = new Date(swaps[0].block_time)
  const timeframes = Object.keys(resolutions)

  // Build bar times for all timeframes
  const barQueries = timeframes.map(timeframe => {
    const frame = resolutions[timeframe]
    const { currentBarStart, nextBarStart } = getBarTimes(swapTime, frame)
    return { timeframe, currentBarStart, nextBarStart }
  })

  // Single query to get all existing bars
  const existingBars = await SwapBar.find({
    chain,
    pool: poolId,
    $or: barQueries.map(q => ({
      timeframe: q.timeframe,
      time: { $gte: q.currentBarStart, $lt: q.nextBarStart }
    }))
  }).lean()

  const existingBarsMap = new Map(existingBars.map((b: any) => [b.timeframe, b]))

  // Build bulk operations
  const bulkOps = barQueries.map(({ timeframe, currentBarStart }) => {
    const existingBar = existingBarsMap.get(timeframe)

    if (!existingBar) {
      // Insert new bar
      return {
        insertOne: {
          document: {
            timeframe,
            chain,
            pool: poolId,
            time: currentBarStart,
            open: openPrice,
            high: highPrice,
            low: lowPrice,
            close: closePrice,
            volumeA: totalVolumeA,
            volumeB: totalVolumeB,
            volumeUSD: totalVolumeUSD,
          }
        }
      }
    } else {
      // Update existing bar with BigInt comparison for high/low
      const newHigh = BigInt(existingBar.high) < BigInt(highPrice) ? highPrice : existingBar.high
      const newLow = BigInt(existingBar.low) > BigInt(lowPrice) ? lowPrice : existingBar.low

      return {
        updateOne: {
          filter: { _id: existingBar._id },
          update: {
            $set: {
              high: newHigh,
              low: newLow,
              close: closePrice,
            },
            $inc: {
              volumeA: totalVolumeA,
              volumeB: totalVolumeB,
              volumeUSD: totalVolumeUSD,
            }
          }
        }
      }
    }
  })

  if (bulkOps.length > 0) {
    await SwapBar.bulkWrite(bulkOps, { ordered: false })
  }
}

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
  // Сортируем при записи, чтобы не сортировать при каждом чтении
  const sortedTicks = [...ticks].sort((a, b) => a[0] - b[0])
  const mappedTicks = sortedTicks.map(t => [t[0], t[1]])
  await getRedis().set(`ticks_${chain}_${poolId}`, JSON.stringify(mappedTicks))
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

  const tokenCache = await getTokens(chain)
  const tokenAprice = tokenCache.find(t => t.id === tokenA_id)
  const tokenBprice = tokenCache.find(t => t.id === tokenB_id)

  const usdReserveA = reserveA * (tokenAprice?.usd_price || 0)
  const usdReserveB = reserveB * (tokenBprice?.usd_price || 0)

  const last_point = await SwapChartPoint.findOne({ chain: network.name, pool: poolId }, {}, { sort: { time: -1 } })

  const volumeTokenA = tokenAprice ? volumeA * tokenAprice?.usd_price : 0
  const volumeTokenB = tokenBprice ? volumeB * tokenBprice?.usd_price : 0

  const volumeUSD = volumeTokenA + volumeTokenB

  // Sptit by one minute
  //const minResolution = 60 * 60 // One hour
  const minResolution = 60 // FIXME
  if (last_point && Math.floor(Number(last_point.time) / 1000 / minResolution) == Math.floor(new Date(block_time).getTime() / 1000 / minResolution)) {
    last_point.price = littleEndianToDesimalString(sqrtPriceX64)

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
  const pool = await SwapPool.findOne(filter).lean()

  if (pool === null) {
    console.warn(`WARNING: Updating(and creating) non existing pool ${filter.id} action`)
    await throttledPoolUpdate(filter.chain, filter.id)

    // It might be first position of just created pool
    // Update token prices in that case
    await updateTokensPrices(networks[filter.chain])
  }

  return pool
}

const throttles = {}
export async function throttledPoolUpdate(chain: string, poolId: number) {
  if (`${chain}_${poolId}` in throttles) {
    // Second call in throttle time
    throttles[`${chain}_${poolId}`] = true
    return
  }

  await updatePool(chain, poolId)

  throttles[`${chain}_${poolId}`] = false
  setTimeout(async function() {
    if (throttles[`${chain}_${poolId}`] === true) {
      await updatePool(chain, poolId)
    }

    delete throttles[`${chain}_${poolId}`]
  }, 500)
}

async function updatePositions(chain: string, poolId: number) {
  const network = networks[chain]
  const rpc = getFailOverAlcorOnlyRpc(network)

  const positions = await fetchAllRows(rpc, {
    code: network.amm.contract,
    scope: poolId,
    table: 'positions'
  })

  // Mapping pool id to position
  positions.forEach(p => p.pool = poolId)

  const current = JSON.parse(await getRedis().get(`positions_${chain}`) || '[]')
  const keep = current.filter(p => p.pool != poolId)

  const to_set = [...keep, ...positions]
  await getRedis().set(`positions_${chain}`, JSON.stringify(to_set))
}

export async function updatePool(chain: string, poolId: number) {
  const network = networks[chain]
  const rpc = getFailOverAlcorOnlyRpc(network)

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
  getPublisher().publish('swap:pool:update', push)

  await Promise.all([
    updateTicks(chain, poolId),
    updatePositions(chain, poolId)
  ])

  // updateTicks(chain, poolId)
  // updatePositions(chain, poolId)

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
    parsedPool.sqrtPriceX64 * parsedPool.sqrtPriceX64
  )

  const priceA = price.toSignificant()
  const priceB = price.invert().toSignificant()

  // TODO FIX DEPRECATED
  const r = await SwapPool.findOneAndUpdate({ chain, id: poolId }, { ...parsedPool, priceA, priceB, tvlUSD }, { upsert: true, new: true })

  const updatedPool: any = await poolInstanceFromMongoPool(r)

  getPublisher().publish(
    'swap:pool:instanceUpdated',
    JSON.stringify({
      chain,
      buffer: Pool.toBuffer(updatedPool).toString('hex')
    })
  )


  return r
}

async function updateTicks(chain: string, poolId: number) {
  const chainTicks = await getChianTicks(chain, poolId)
  const redisTicks = await getRedisTicks(chain, poolId)

  const update = []

  chainTicks.forEach((tick, id) => {
    const tick_old = redisTicks.get(id)

    if (!isEqual(tick_old, tick)) {
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
  getPublisher().publish('swap:ticks:update', push)
}

export async function connectAll() {
  await mongoConnect()
  await initRedis()
}

async function getChianTicks(chain: string, poolId: number): Promise<TicksList> {
  const network = networks[chain]

  // ONLY ALCOR NODES
  const rpc = getFailOverAlcorOnlyRpc(network)

  const rows = await fetchAllRows(rpc, {
    code: network.amm.contract,
    scope: poolId,
    table: 'ticks',
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
  const rpc = getFailOverAlcorOnlyRpc(network)

  const pools = await fetchAllRows(rpc, {
    code: network.amm.contract,
    scope: network.amm.contract,
    table: 'pools'
  })

  const to_create = []
  const current_pools = await SwapPool.distinct('id', { chain })

  // 1. Сначала собираем все новые пулы
  for (const pool of pools) {
    if (!current_pools.includes(pool.id)) {
      const parsed_pool = parsePool(pool)

      const price = new Price(
        parseToken(pool.tokenA),
        parseToken(pool.tokenB),
        Q128,
        parsed_pool.sqrtPriceX64 * parsed_pool.sqrtPriceX64
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
    }
  }

  // 2. Записываем новые пулы в MongoDB
  if (to_create.length > 0) {
    await SwapPool.insertMany(to_create)
    console.log(`inserted ${to_create.length} new pools for ${chain}`)
  }

  // 3. Обновляем тики только для новых пулов
  console.log(`updating ticks for ${to_create.length} new pools...`)
  for (const p of to_create) {
    await updatePool(chain, p.id)
  }

  console.log('updated pools for ', chain)
}

export async function initialUpdate(chain: string, poolId?: number) {
  console.log('swap initialUpdate started: ', chain)
  await connectAll()
  await updatePools(chain)

  if (poolId) {
    updatePool(chain, poolId)
    //await updateTicks(chain, poolId)
  }

  //const markets = await SwapPool.find({ chain })

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

export async function handleSwap({ chain, data, trx_id, block_time, block_num }) {
  const { poolId, recipient, sender, sqrtPriceX64 } = data

  const tokenAamount = parseFloat(data.tokenA)
  const tokenBamount = parseFloat(data.tokenB)

  if (tokenAamount == 0 && tokenBamount == 0) return undefined

  const pool = await getPool({ id: poolId, chain })

  const tokenA = await getToken(chain, pool.tokenA.id)
  const tokenB = await getToken(chain, pool.tokenB.id)

  const tokenAUSDPrice = tokenA?.usd_price || 0
  const tokenBUSDPrice = tokenB?.usd_price || 0

  const totalUSDVolume = (Math.abs(tokenAamount * tokenAUSDPrice) + Math.abs(tokenBamount * tokenBUSDPrice)) / 2

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
    block_num,
  })
}

export async function onSwapAction(message: string) {
  await connectAll()

  const { chain, name, trx_id, block_time, block_num, data } = JSON.parse(message)

  // Flush pending swap batch if block changed (for any action type)
  const existingBatch = chainBatches.get(chain)
  if (existingBatch && existingBatch.block_num !== block_num) {
    await flushSwapBatch(chain, existingBatch)
    chainBatches.delete(chain)
  }

  if (name == 'logpool') {
    await throttledPoolUpdate(chain, data.poolId)
    await updateTokensPrices(networks[chain]) // Update right away so other handlers will have tokenPrices

    // Lead to high load
    try {
      const quantityA = data.tokenA.quantity || data.tokenA.asset
      const quantityB = data.tokenB.quantity || data.tokenB.asset

      const contractA = data.tokenA.contract || data.tokenA.Contract
      const contractB = data.tokenB.contract || data.tokenB.Contract

      const tokenA_id = quantityA.split(' ')[1].toLowerCase() + '-' + contractA
      const tokenB_id = quantityB.split(' ')[1].toLowerCase() + '-' + contractB

      // Removing cache to re-generate swap routes
      deleteKeysByPattern(getRedis(), `routes_expiration_${chain}-*${tokenA_id}*`)
      deleteKeysByPattern(getRedis(), `routes_expiration_${chain}-*${tokenB_id}*`)
    } catch (e) {
      console.error('REMOVE CACHE ROUTES ERR', e, data)
    }
  }

  if (name == 'logswap') {
    // Get or create batch for current block (flush already happened above if needed)
    let batch = chainBatches.get(chain)
    if (!batch) {
      batch = { block_num, block_time, swaps: [] }
      chainBatches.set(chain, batch)
    }

    // Add swap to batch
    batch.swaps.push({ chain, trx_id, data, block_time, block_num })

    // Don't process immediately - will be flushed on next block
    return
  }

  if (name == 'logmint') {
    console.log(`[${chain}] mint pos #${data.posId} owner:${data.owner} pool:${data.poolId}`)
    await saveMintOrBurn({ chain, trx_id, data, type: 'mint', block_time })
  }

  if (name == 'logburn') {
    console.log(`[${chain}] burn pos #${data.posId} owner:${data.owner} pool:${data.poolId}`)
    await saveMintOrBurn({ chain, trx_id, data, type: 'burn', block_time })
  }

  if (name == 'logcollect') {
    console.log(`[${chain}] collect pos #${data.posId} owner:${data.owner} pool:${data.poolId}`)
    await saveMintOrBurn({ chain, trx_id, data, type: 'collect', block_time })
  }

  // Update pool directly for position changes (don't rely on swap-service)
  // Fire and forget - don't block updater
  if (['logmint', 'logburn', 'logcollect'].includes(name)) {
    throttledPoolUpdate(chain, Number(data.poolId)).catch(e =>
      console.error(`[${chain}] pool update error:`, e.message)
    )
  }

  // Only publish realtime events (skip during catch-up to avoid flooding swap-service)
  const eventAge = Date.now() - new Date(block_time).getTime()
  const isRealtime = eventAge < 5 * 60 * 1000 // 5 minutes

  if (isRealtime && ['logpool', 'logmint', 'logburn', 'logswap', 'logcollect'].includes(name)) {
    const account = networks[chain].amm.contract
    getPublisher().publish(`chainAction:${chain}:${account}:${name}`, message)
  }

  // Send push to update user position (only realtime)
  if (isRealtime && ['logmint', 'logburn', 'logcollect'].includes(name)) {
    const { posId, owner } = data
    const push = { chain, account: owner, positions: [posId] }

    getPublisher().publish('account:update-positions', JSON.stringify(push))
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
