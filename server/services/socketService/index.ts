require('dotenv').config()

import { createServer } from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'

import { initRedis, mongoConnect } from '../../utils'
import { getSubscriber } from '../redis'
import { getRedis } from '../redis'
import { Match, Bar, SwapBar, SwapPool } from '../../models'
import { getSwapBarPriceAsString } from '../../../utils/amm.js'
import { littleEndianToDesimalString } from '../../../utils'
import { Price, Q128, Token } from '@alcorexchange/alcor-swap-sdk'
import { resolutions, getBarTimes } from '../updaterService/charts'

import { subscribe, unsubscribe } from './sockets'
import { pushDeal, pushAccountNewMatch } from './pushes'
import { initAccountUpdates } from './accountUpdates'
import { makeSwapTickerV2Key, setSwapTickerV2Snapshot } from './swapTickerV2State'

const httpServer = createServer()
const io = new Server(httpServer, { cors: { origin: '*' } })

const POOL_CACHE_TTL_MS = 5 * 60 * 1000
const poolCache = new Map<string, { value: any, expires: number }>()
const TOKEN_CACHE_TTL_MS = 60 * 1000
const tokenPriceCache = new Map<string, { value: Map<string, number>, expires: number }>()
const processedSwapTrx = new Map<string, number>()
const SWAP_DEDUPE_TTL_MS = 60 * 1000
const prevCloseByKey = new Map<string, { a: number, b: number, sqrt: string }>()
const prevClosePending = new Map<string, Promise<void>>()

type RealtimeSwapBar = {
  time: number
  volumeUSD: number
  aPerB: { open: number, high: number, low: number, close: number }
  bPerA: { open: number, high: number, low: number, close: number }
  sqrtPriceX64: { open: string, high: string, low: string, close: string }
}

const realtimeBars = new Map<string, RealtimeSwapBar>()

async function getPoolCached(chain: string, poolId: number) {
  const key = `${chain}:${poolId}`
  const cached = poolCache.get(key)
  if (cached && cached.expires > Date.now()) return cached.value

  const pool = await SwapPool.findOne({ chain, id: poolId }).lean()
  if (pool) poolCache.set(key, { value: pool, expires: Date.now() + POOL_CACHE_TTL_MS })
  return pool
}

async function getTokenPricesCached(chain: string) {
  const cached = tokenPriceCache.get(chain)
  if (cached && cached.expires > Date.now()) return cached.value

  const raw = await getRedis().get(`${chain}_token_prices`)
  const tokens = raw ? JSON.parse(raw) : []
  const map = new Map<string, number>()
  for (const t of tokens) {
    if (t?.id && typeof t?.usd_price === 'number') {
      map.set(t.id, t.usd_price)
    }
  }
  tokenPriceCache.set(chain, { value: map, expires: Date.now() + TOKEN_CACHE_TTL_MS })
  return map
}

function isDuplicateSwap(trx_id?: string) {
  if (!trx_id) return false
  const now = Date.now()
  const last = processedSwapTrx.get(trx_id)
  if (last && now - last < SWAP_DEDUPE_TTL_MS) return true
  processedSwapTrx.set(trx_id, now)
  return false
}

function initRealtimeBar(
  key: string,
  time: number,
  priceA: number,
  priceB: number,
  sqrtPriceX64: string,
  volumeUSD: number
) {
  const prev = prevCloseByKey.get(key)
  const openA = prev?.a ?? priceA
  const openB = prev?.b ?? priceB
  const openSqrt = prev?.sqrt ?? sqrtPriceX64

  const next = {
    time,
    volumeUSD,
    aPerB: { open: openA, high: priceA, low: priceA, close: priceA },
    bPerA: { open: openB, high: priceB, low: priceB, close: priceB },
    sqrtPriceX64: {
      open: openSqrt,
      high: sqrtPriceX64,
      low: sqrtPriceX64,
      close: sqrtPriceX64
    }
  }
  realtimeBars.set(key, next)
  return next
}

function storePrevClose(key: string, bar: RealtimeSwapBar) {
  prevCloseByKey.set(key, {
    a: bar.aPerB.close,
    b: bar.bPerA.close,
    sqrt: bar.sqrtPriceX64.close
  })
}

function updateRealtimeBar(
  key: string,
  time: number,
  priceA: number,
  priceB: number,
  sqrtPriceX64: string,
  volumeUSD: number
) {
  const existing = realtimeBars.get(key)

  if (!existing || existing.time !== time) {
    if (existing) storePrevClose(key, existing)
    return initRealtimeBar(key, time, priceA, priceB, sqrtPriceX64, volumeUSD)
  }

  existing.aPerB.high = Math.max(existing.aPerB.high, priceA)
  existing.aPerB.low = Math.min(existing.aPerB.low, priceA)
  existing.aPerB.close = priceA

  existing.bPerA.high = Math.max(existing.bPerA.high, priceB)
  existing.bPerA.low = Math.min(existing.bPerA.low, priceB)
  existing.bPerA.close = priceB

  try {
    const sqrt = BigInt(sqrtPriceX64)
    const high = BigInt(existing.sqrtPriceX64.high)
    const low = BigInt(existing.sqrtPriceX64.low)
    if (sqrt > high) existing.sqrtPriceX64.high = sqrtPriceX64
    if (sqrt < low) existing.sqrtPriceX64.low = sqrtPriceX64
    existing.sqrtPriceX64.close = sqrtPriceX64
  } catch {
    existing.sqrtPriceX64.close = sqrtPriceX64
  }

  existing.volumeUSD += volumeUSD
  return existing
}

function applyDbBar(
  key: string,
  time: number,
  priceA: { open: number, high: number, low: number, close: number },
  priceB: { open: number, high: number, low: number, close: number },
  sqrt: { open: string, high: string, low: string, close: string },
  volumeUSD: number
) {
  const existing = realtimeBars.get(key)
  let bar: RealtimeSwapBar

  if (!existing || existing.time !== time) {
    if (existing) storePrevClose(key, existing)
    const init = initRealtimeBar(key, time, priceA.open, priceB.open, sqrt.open, volumeUSD)
    bar = init
  } else {
    bar = existing
    bar.volumeUSD = volumeUSD
  }

  bar.aPerB.high = priceA.high
  bar.aPerB.low = priceA.low
  bar.aPerB.close = priceA.close

  bar.bPerA.high = priceB.high
  bar.bPerA.low = priceB.low
  bar.bPerA.close = priceB.close

  bar.sqrtPriceX64.high = sqrt.high
  bar.sqrtPriceX64.low = sqrt.low
  bar.sqrtPriceX64.close = sqrt.close

  realtimeBars.set(key, bar)
  return bar
}

async function ensurePrevClose(
  key: string,
  chain: string,
  poolId: number,
  timeframe: string,
  barTime: number,
  tokenA: any,
  tokenB: any,
  fallback: { priceA: number, priceB: number, sqrt: string }
) {
  if (prevCloseByKey.has(key)) return
  const pending = prevClosePending.get(key)
  if (pending) {
    await pending
    return
  }

  const task = (async () => {
    const prevBar = await SwapBar.findOne(
      {
        chain,
        pool: poolId,
        timeframe,
        time: { $lt: new Date(barTime) }
      },
      { close: 1 },
      { sort: { time: -1 } }
    ).lean()

    if (prevBar?.close) {
      const priceA = Number(getSwapBarPriceAsString(prevBar.close, tokenA, tokenB, false))
      const priceB = Number(getSwapBarPriceAsString(prevBar.close, tokenA, tokenB, true))
      prevCloseByKey.set(key, { a: priceA, b: priceB, sqrt: prevBar.close })
      return
    }

    prevCloseByKey.set(key, {
      a: fallback.priceA,
      b: fallback.priceB,
      sqrt: fallback.sqrt
    })
  })()

  prevClosePending.set(key, task)
  try {
    await task
  } finally {
    prevClosePending.delete(key)
  }
}

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

    const poolInfo = await getPoolCached(chain, pool)
    const tokenA = poolInfo?.tokenA
    const tokenB = poolInfo?.tokenB
    const pair =
      tokenA && tokenB
        ? {
            tokenA: {
              id: tokenA.id,
              contract: tokenA.contract,
              symbol: tokenA.symbol,
              decimals: tokenA.decimals,
            },
            tokenB: {
              id: tokenB.id,
              contract: tokenB.contract,
              symbol: tokenB.symbol,
              decimals: tokenB.decimals,
            },
          }
        : null

    const priceA =
      tokenA && tokenB
        ? {
            open: getSwapBarPriceAsString(open, tokenA, tokenB, false),
            high: getSwapBarPriceAsString(high, tokenA, tokenB, false),
            low: getSwapBarPriceAsString(low, tokenA, tokenB, false),
            close: getSwapBarPriceAsString(close, tokenA, tokenB, false),
          }
        : null
    const priceB =
      tokenA && tokenB
        ? {
            open: getSwapBarPriceAsString(open, tokenA, tokenB, true),
            high: getSwapBarPriceAsString(high, tokenA, tokenB, true),
            low: getSwapBarPriceAsString(low, tokenA, tokenB, true),
            close: getSwapBarPriceAsString(close, tokenA, tokenB, true),
          }
        : null

    const barTime = new Date(time).getTime()
    const barKey = `${chain}:${pool}:${timeframe}`
    if (priceA && priceB && tokenA && tokenB) {
      await ensurePrevClose(
        barKey,
        chain,
        pool,
        timeframe,
        barTime,
        tokenA,
        tokenB,
        {
          priceA: Number(priceA.open),
          priceB: Number(priceB.open),
          sqrt: open
        }
      )
    }

    const dbBarState = (priceA && priceB)
      ? applyDbBar(
          barKey,
          barTime,
          {
            open: Number(priceA.open),
            high: Number(priceA.high),
            low: Number(priceA.low),
            close: Number(priceA.close),
          },
          {
            open: Number(priceB.open),
            high: Number(priceB.high),
            low: Number(priceB.low),
            close: Number(priceB.close),
          },
          { open, high, low, close },
          Number(volumeUSD) || 0
        )
      : null

    const tickV2 = {
      v: 2,
      chain,
      poolId: pool,
      resolution: timeframe,
      time: barTime,
      bar: {
        volumeUSD: dbBarState?.volumeUSD ?? volumeUSD,
        sqrtPriceX64: dbBarState?.sqrtPriceX64 ?? { open, high, low, close },
        price: dbBarState
          ? {
              aPerB: {
                open: dbBarState.aPerB.open.toString(),
                high: dbBarState.aPerB.high.toString(),
                low: dbBarState.aPerB.low.toString(),
                close: dbBarState.aPerB.close.toString(),
              },
              bPerA: {
                open: dbBarState.bPerA.open.toString(),
                high: dbBarState.bPerA.high.toString(),
                low: dbBarState.bPerA.low.toString(),
                close: dbBarState.bPerA.close.toString(),
              },
            }
          : { aPerB: priceA, bPerA: priceB },
      },
      pair,
      serverTime: Date.now(),
      source: 'db'
    }

    setSwapTickerV2Snapshot(makeSwapTickerV2Key(chain, pool, timeframe), tickV2)
    io.to(`swap-ticker-v2:${chain}.${pool}.${timeframe}`).emit('swap-tick-v2', tickV2)
  })

  getSubscriber().pSubscribe('chainAction:*:*:logswap', async (message) => {
    let action
    try {
      action = JSON.parse(message)
    } catch (e) {
      console.error('swap-tick-v2: bad message', e)
      return
    }

    const { chain, trx_id, block_time, data } = action
    if (isDuplicateSwap(trx_id)) return

    const poolId = Number(data?.poolId)
    if (!Number.isFinite(poolId)) return

    const poolInfo = await getPoolCached(chain, poolId)
    if (!poolInfo) return

    const sqrtPriceX64 = littleEndianToDesimalString(data?.sqrtPriceX64)
    let priceAString: string
    let priceBString: string
    try {
      const tokenA = new Token(poolInfo.tokenA.contract, poolInfo.tokenA.decimals, poolInfo.tokenA.symbol)
      const tokenB = new Token(poolInfo.tokenB.contract, poolInfo.tokenB.decimals, poolInfo.tokenB.symbol)
      const sqrt = BigInt(sqrtPriceX64)
      const priceA = new Price(tokenA, tokenB, Q128, sqrt * sqrt)
      const priceB = priceA.invert()
      priceAString = priceA.toSignificant(12)
      priceBString = priceB.toSignificant(12)
    } catch (error) {
      console.error('[swap-tick-v2] price calc failed', {
        chain,
        poolId,
        sqrtPriceX64,
        error,
      })
      return
    }
    const priceA = Number(priceAString)
    const priceB = Number(priceBString)

    const tokenPrices = await getTokenPricesCached(chain)
    const tokenAUsd = tokenPrices.get(poolInfo.tokenA.id) || 0
    const tokenBUsd = tokenPrices.get(poolInfo.tokenB.id) || 0

    const tokenAAmount = parseFloat(String(data?.tokenA || '0').split(' ')[0]) || 0
    const tokenBAmount = parseFloat(String(data?.tokenB || '0').split(' ')[0]) || 0
    const volumeUSD = (Math.abs(tokenAAmount * tokenAUsd) + Math.abs(tokenBAmount * tokenBUsd)) / 2

    const pair = {
      tokenA: {
        id: poolInfo.tokenA.id,
        contract: poolInfo.tokenA.contract,
        symbol: poolInfo.tokenA.symbol,
        decimals: poolInfo.tokenA.decimals,
      },
      tokenB: {
        id: poolInfo.tokenB.id,
        contract: poolInfo.tokenB.contract,
        symbol: poolInfo.tokenB.symbol,
        decimals: poolInfo.tokenB.decimals,
      },
    }

    const swapTime = new Date(block_time)
    const timeframes = Object.keys(resolutions)

    for (const timeframe of timeframes) {
      const frame = resolutions[timeframe]
      const { currentBarStart } = getBarTimes(swapTime, frame)
      const barTime = currentBarStart.getTime()
      const key = `${chain}:${poolId}:${timeframe}`

      await ensurePrevClose(
        key,
        chain,
        poolId,
        timeframe,
        barTime,
        poolInfo.tokenA,
        poolInfo.tokenB,
        {
          priceA,
          priceB,
          sqrt: sqrtPriceX64
        }
      )

      const barState = updateRealtimeBar(
        key,
        barTime,
        priceA,
        priceB,
        sqrtPriceX64,
        Number.isFinite(volumeUSD) ? volumeUSD : 0
      )

      const tickV2 = {
        v: 2,
        chain,
        poolId,
        resolution: timeframe,
        time: barState.time,
        bar: {
          volumeUSD: barState.volumeUSD,
          sqrtPriceX64: barState.sqrtPriceX64,
          price: {
            aPerB: {
              open: barState.aPerB.open.toString(),
              high: barState.aPerB.high.toString(),
              low: barState.aPerB.low.toString(),
              close: barState.aPerB.close.toString()
            },
            bPerA: {
              open: barState.bPerA.open.toString(),
              high: barState.bPerA.high.toString(),
              low: barState.bPerA.low.toString(),
              close: barState.bPerA.close.toString()
            }
          }
        },
        pair,
        serverTime: Date.now(),
        source: 'chain'
      }

      setSwapTickerV2Snapshot(makeSwapTickerV2Key(chain, poolId, timeframe), tickV2)
      io.to(`swap-ticker-v2:${chain}.${poolId}.${timeframe}`).emit('swap-tick-v2', tickV2)
    }
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
