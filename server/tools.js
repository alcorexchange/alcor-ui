require('dotenv').config()
import { difference } from 'lodash'
import Confirm from 'prompt-confirm'
import mongoose from 'mongoose'

import { createClient } from 'redis'
import fetch from 'node-fetch'
import config from '../config'
import { JsonRpc } from '../assets/libs/eosjs-jsonrpc'
import { fetchAllRows } from '../utils/eosjs'
import { Match, Market, Bar } from './models'

const uri = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/alcor_prod_new`

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

  process.exit()
}

main()
