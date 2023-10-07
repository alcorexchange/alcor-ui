require('dotenv').config()
import { difference } from 'lodash'
import Confirm from 'prompt-confirm'
import mongoose from 'mongoose'

import { createClient } from 'redis'
import fetch from 'node-fetch'
import config from '../config'
import { JsonRpc } from '../assets/libs/eosjs-jsonrpc'
import { fetchAllRows } from '../utils/eosjs'
import { Match, Market, Bar, GlobalStats } from './models'
import { initialUpdate } from './services/orderbookService/start'
import { updateGlobalStats } from './services/updaterService/analytics'

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

    await initialUpdate(network.name, market_id)
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

  // TODO
  // if (command == 'fix_fees') {
  //   const network = config.networks[process.argv[3]]
  //   if (!network) { console.log('No network provided!'); process.exit() }

  //   const globals = await GlobalStats.find({
  //     chain: network.name,
  //     time: {
  //       $gte: new Date('')
  //     }
  //   })
  // }
}

main()
