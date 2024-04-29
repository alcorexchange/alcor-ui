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
import { initialUpdate as swapInitialUpdate, updatePool } from './services/swapV2Service'
import { makeSwapBars, makeSpotBars } from './services/updaterService/charts'


const uri = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`

let redisClient
const ONEDAY = 60 * 60 * 24 * 1000
const WEEK = ONEDAY * 7

const command = process.argv[2]

if (!command) { console.log('No command provided'); process.exit() }

async function main() {
  await mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true })

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
    const poolId = process.argv[4]
    const network = config.networks[process.argv[3]]
    if (!network) { console.log('No network provided!'); process.exit() }

    if (poolId) {
      await updatePool(network.name, poolId)
    } else {
      await swapInitialUpdate(network.name)
    }
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
}

main()
