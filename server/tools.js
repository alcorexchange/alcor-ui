require('dotenv').config()
import { difference } from 'lodash'
import Confirm from 'prompt-confirm'
import mongoose from 'mongoose'

import { createClient } from 'redis'
import fetch from 'cross-fetch'
import config from '../config'
import { JsonRpc } from '../assets/libs/eosjs-jsonrpc'
import { fetchAllRows } from '../utils/eosjs'
import { Swap, SwapBar, Match, Market, Bar, GlobalStats } from './models'
import { initialUpdate as initialOrderbookUpdate } from './services/orderbookService/start'
import { updateGlobalStats } from './services/updaterService/analytics'
import { connectAll, initialUpdate as swapInitialUpdate, updatePool, initializeAllPoolsData, aggregatePositions } from './services/swapV2Service'
import { makeSwapBars, makeSpotBars, resolutions, normalizeResolution } from './services/updaterService/charts'
import { initRedis, mongoConnect } from './utils'

let redisClient
const ONEDAY = 60 * 60 * 24 * 1000
const WEEK = ONEDAY * 7

const command = process.argv[2]

if (!command) { console.log('No command provided'); process.exit() }

function parseDateOrExit(value, label) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    console.log(`Invalid ${label} date: ${value}`)
    process.exit(1)
  }
  return date
}

function parseOptions(args) {
  const options = { dryRun: false, timeframes: null, pool: null, market: null }
  for (const arg of args) {
    if (arg === '--dry-run') options.dryRun = true
    else if (arg.startsWith('--timeframes=')) options.timeframes = arg.split('=')[1]
    else if (arg.startsWith('--pool=')) options.pool = Number(arg.split('=')[1])
    else if (arg.startsWith('--market=')) options.market = Number(arg.split('=')[1])
  }
  return options
}

function parseTimeframes(input) {
  if (!input) return Object.keys(resolutions)
  const frames = input
    .split(',')
    .map((f) => normalizeResolution(f.trim()))
    .filter(Boolean)

  for (const frame of frames) {
    if (!Object.prototype.hasOwnProperty.call(resolutions, frame)) {
      console.log(`Unknown timeframe: ${frame}`)
      process.exit(1)
    }
  }
  return frames
}

function getBarStartMs(date, resolutionSeconds) {
  const resolutionMs = resolutionSeconds * 1000
  return Math.floor(date.getTime() / resolutionMs) * resolutionMs
}

function compareBigIntStrings(a, b) {
  if (a === b) return 0
  try {
    const aBig = BigInt(a)
    const bBig = BigInt(b)
    return aBig > bBig ? 1 : -1
  } catch (e) {
    if (a.length !== b.length) return a.length > b.length ? 1 : -1
    return a > b ? 1 : -1
  }
}

function initSpotBar(match, barStartMs, timeframe) {
  const price = match.unit_price
  const volume = match.type === 'buymatch' ? match.bid : match.ask

  return {
    timeframe,
    chain: match.chain,
    market: match.market,
    time: new Date(barStartMs),
    open: price,
    high: price,
    low: price,
    close: price,
    volume: volume || 0
  }
}

function updateSpotBar(bar, match) {
  const price = match.unit_price
  if (bar.high < price) bar.high = price
  if (bar.low > price) bar.low = price
  bar.close = price
  bar.volume += match.type === 'buymatch' ? match.bid : match.ask
}

function initSwapBar(swap, barStartMs, timeframe) {
  const price = swap.sqrtPriceX64

  return {
    timeframe,
    chain: swap.chain,
    pool: swap.pool,
    time: new Date(barStartMs),
    open: price,
    high: price,
    low: price,
    close: price,
    volumeA: Math.abs(swap.tokenA),
    volumeB: Math.abs(swap.tokenB),
    volumeUSD: swap.totalUSDVolume || 0
  }
}

function updateSwapBar(bar, swap) {
  const price = swap.sqrtPriceX64
  if (compareBigIntStrings(price, bar.high) > 0) bar.high = price
  if (compareBigIntStrings(price, bar.low) < 0) bar.low = price
  bar.close = price
  bar.volumeA += Math.abs(swap.tokenA)
  bar.volumeB += Math.abs(swap.tokenB)
  bar.volumeUSD += swap.totalUSDVolume || 0
}

async function safeBackfillSpotCandles({ chain, from, to, market, timeframes, dryRun }) {
  const baseQuery = { chain, time: { $gte: from, $lte: to } }
  if (Number.isFinite(market)) baseQuery.market = market

  const markets = Number.isFinite(market)
    ? [market]
    : await Match.distinct('market', baseQuery)

  for (const marketId of markets) {
    for (const timeframe of timeframes) {
      const resolutionSeconds = resolutions[timeframe]
      const fromStartMs = getBarStartMs(from, resolutionSeconds)
      const toStartMs = getBarStartMs(to, resolutionSeconds)

      const existingBars = await Bar.find({
        chain,
        market: marketId,
        timeframe,
        time: { $gte: new Date(fromStartMs), $lte: new Date(toStartMs) }
      }).select('time').lean()

      const existingTimes = new Set(existingBars.map((b) => new Date(b.time).getTime()))
      const cursor = Match.find({ ...baseQuery, market: marketId }).sort({ time: 1, _id: 1 }).cursor()

      const bars = new Map()
      for await (const match of cursor) {
        const matchTime = match.time instanceof Date ? match.time : new Date(match.time)
        if (Number.isNaN(matchTime.getTime())) continue
        const barStartMs = getBarStartMs(matchTime, resolutionSeconds)
        if (barStartMs < fromStartMs || barStartMs > toStartMs) continue
        if (existingTimes.has(barStartMs)) continue

        const key = barStartMs
        let bar = bars.get(key)
        if (!bar) {
          bar = initSpotBar(match, barStartMs, timeframe)
          bars.set(key, bar)
        } else {
          updateSpotBar(bar, match)
        }
      }

      const toInsert = Array.from(bars.values())
      console.log(`[${chain}] spot market ${marketId} ${timeframe}: new bars ${toInsert.length}`)

      if (!dryRun && toInsert.length > 0) {
        const ops = toInsert.map((bar) => ({
          updateOne: {
            filter: { chain: bar.chain, market: bar.market, timeframe: bar.timeframe, time: bar.time },
            update: { $setOnInsert: bar },
            upsert: true
          }
        }))
        await Bar.bulkWrite(ops, { ordered: false })
      }
    }
  }
}

async function safeBackfillSwapCandles({ chain, from, to, pool, timeframes, dryRun }) {
  const baseQuery = { chain, time: { $gte: from, $lte: to } }
  if (Number.isFinite(pool)) baseQuery.pool = pool

  const pools = Number.isFinite(pool)
    ? [pool]
    : await Swap.distinct('pool', baseQuery)

  for (const poolId of pools) {
    for (const timeframe of timeframes) {
      const resolutionSeconds = resolutions[timeframe]
      const fromStartMs = getBarStartMs(from, resolutionSeconds)
      const toStartMs = getBarStartMs(to, resolutionSeconds)

      const existingBars = await SwapBar.find({
        chain,
        pool: poolId,
        timeframe,
        time: { $gte: new Date(fromStartMs), $lte: new Date(toStartMs) }
      }).select('time').lean()

      const existingTimes = new Set(existingBars.map((b) => new Date(b.time).getTime()))
      const cursor = Swap.find({ ...baseQuery, pool: poolId }).sort({ time: 1, _id: 1 }).cursor()

      const bars = new Map()
      for await (const swap of cursor) {
        const swapTime = swap.time instanceof Date ? swap.time : new Date(swap.time)
        if (Number.isNaN(swapTime.getTime())) continue
        const barStartMs = getBarStartMs(swapTime, resolutionSeconds)
        if (barStartMs < fromStartMs || barStartMs > toStartMs) continue
        if (existingTimes.has(barStartMs)) continue

        const key = barStartMs
        let bar = bars.get(key)
        if (!bar) {
          bar = initSwapBar(swap, barStartMs, timeframe)
          bars.set(key, bar)
        } else {
          updateSwapBar(bar, swap)
        }
      }

      const toInsert = Array.from(bars.values())
      console.log(`[${chain}] swap pool ${poolId} ${timeframe}: new bars ${toInsert.length}`)

      if (!dryRun && toInsert.length > 0) {
        const ops = toInsert.map((bar) => ({
          updateOne: {
            filter: { chain: bar.chain, pool: bar.pool, timeframe: bar.timeframe, time: bar.time },
            update: { $setOnInsert: bar },
            upsert: true
          }
        }))
        await SwapBar.bulkWrite(ops, { ordered: false })
      }
    }
  }
}

async function main() {
  await mongoConnect()
  await connectAll()
  await initRedis()

  if (command == 'clean_markets') {
    const network = config.networks[process.argv[3]]
    if (!network) { console.log('No network provided!'); process.exit() }

    const nodes = [network.protocol + '://' + network.host + ':' + network.port].concat(Object.keys(network.client_nodes))
    const rpc = new JsonRpc(nodes, { fetch })

    const rows = await fetchAllRows(rpc, { code: network.contract, scope: network.contract, table: 'markets' })

    const current_markets = await Market.distinct('id', { chain: network.name })
    const removed = difference(current_markets, rows.map(r => r.id))

    if (removed.length) {
      console.log('Markets to remove: ', removed)
      const confirm = await new Confirm('Delete data for markets: ').run()

      if (confirm) {
        const { deletedCount: markets } = await Market.deleteMany({ id: { $in: removed }, chain: network.name })
        const { deletedCount: matches } = await Match.deleteMany({ market: { $in: removed }, chain: network.name })
        const { deletedCount: bars } = await Bar.deleteMany({ market: { $in: removed }, chain: network.name })

        console.log(markets, 'market deleted.')
        console.log(matches, 'matches deleted.')
        console.log(bars, 'bars deleted.')
      }
    }
  }

  if (command == 'load_orderbooks') {
    const market_id = process.argv[4]
    const network = config.networks[process.argv[3]]
    if (!network) { console.log('No network provided!'); process.exit() }

    await initialOrderbookUpdate(network.name, market_id)
  }

  if (command == 'updatePools') {
    const network = config.networks[process.argv[3]]
    if (!network) { console.log('No network provided!'); process.exit() }

    const arg4 = process.argv[4]

    if (arg4 === '--force') {
      // Force update all ticks and positions
      await swapInitialUpdate(network.name, undefined, true)
    } else if (arg4) {
      // Update specific pool
      await updatePool(network.name, arg4)
    } else {
      // Just sync new pools
      await swapInitialUpdate(network.name)
    }
  }

  if (command == 'initPositions') {
    const network = config.networks[process.argv[3]]
    if (!network) { console.log('No network provided!'); process.exit() }

    await initializeAllPoolsData(network.name)
    await aggregatePositions(network.name)
  }

  if (command == 'load_global_analytics') {
    let days_back = parseInt(process.argv[4])
    const network = config.networks[process.argv[3]]

    if (!network) { console.log('No network provided!'); process.exit() }

    const now = new Date()

    while (days_back != 0) {
      const day = new Date(new Date().setDate(now.getDate() - days_back))
      await updateGlobalStats(network, day)
      days_back -= 1
    }
  }

  if (command == 'create_swap_candles') {
    const total = await Swap.count({})
    const cursor = Swap.find().sort({ time: 1 }).cursor()

    let i = 0
    for (let swap = await cursor.next(); swap != null; swap = await cursor.next()) {
      await makeSwapBars(swap)
      i++
      process.stdout.write(`${i}/${total}\r`)
    }
  }

  if (command == 'create_match_candles') {
    const total = await Match.count({})
    const cursor = Match.find().sort({ time: 1 }).cursor()

    let i = 0
    for (let match = await cursor.next(); match != null; match = await cursor.next()) {
      await makeSpotBars(match)
      i++
      process.stdout.write(`${i}/${total}\r`)
    }
  }

  if (command == 'fix_swap_vol') {
    const total = await Swap.count({})
    const bulkOps = []
    const cursor = Swap.find().sort({ time: 1 }).batchSize(500).cursor()

    let i = 0
    for (let swap = await cursor.next(); swap != null; swap = await cursor.next()) {
      bulkOps.push({
        updateOne: {
          filter: { _id: swap._id },
          update: { $set: { totalUSDVolume: swap.totalUSDVolume / 2 } },
        },
      })

      if (bulkOps.length === 500) {
        await Swap.bulkWrite(bulkOps)
        bulkOps.length = 0 // очистка массива для следующего пакета
        process.stdout.write(`${i}/${total}\r`)
      }

      i++
    }

    if (bulkOps.length > 0) {
      await Swap.bulkWrite(bulkOps) // обработка последнего пакета
      process.stdout.write(`${i}/${total}\r`)
    }
  }

  if (command == 'fix_global') {
    const total = await GlobalStats.count({})
    const network = config.networks[process.argv[3]]

    const cursor = GlobalStats.find().sort({ time: 1 }).cursor()

    let i = 0
    for (let glob = await cursor.next(); glob != null; glob = await cursor.next()) {
      glob.swapTradingVolume = glob.swapTradingVolume / 2
      glob.swapFees = glob.swapFees / 2
      await glob.save()
      i++
      process.stdout.write(`${i}/${total}\r`)
    }
  }

  if (command == 'safe_backfill_candles') {
    const type = process.argv[3]
    const chain = process.argv[4]
    const fromRaw = process.argv[5]
    const toRaw = process.argv[6]

    if (!type || !chain || !fromRaw || !toRaw) {
      console.log('Usage: safe_backfill_candles <swap|spot> <chain> <from> <to> [--pool=ID|--market=ID] [--timeframes=1,5,15,1D] [--dry-run]')
      process.exit(1)
    }

    const from = parseDateOrExit(fromRaw, 'from')
    const to = parseDateOrExit(toRaw, 'to')
    const options = parseOptions(process.argv.slice(7))
    const timeframes = parseTimeframes(options.timeframes)

    if (type === 'spot' && options.pool) {
      console.log('Use --market for spot candles')
      process.exit(1)
    }

    if (type === 'swap' && options.market) {
      console.log('Use --pool for swap candles')
      process.exit(1)
    }

    if (type === 'spot') {
      await safeBackfillSpotCandles({
        chain,
        from,
        to,
        market: options.market,
        timeframes,
        dryRun: options.dryRun
      })
    } else if (type === 'swap') {
      await safeBackfillSwapCandles({
        chain,
        from,
        to,
        pool: options.pool,
        timeframes,
        dryRun: options.dryRun
      })
    } else {
      console.log('Type must be swap or spot')
      process.exit(1)
    }
  }
}

async function cleanup() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }

  if (redisClient?.isOpen) {
    await redisClient.quit()
  }
}

main()
  .then(() => cleanup())
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Unhandled error:', err)
    cleanup().then(() => process.exit(1))
  })
