import ScatterJS from '@scatterjs/core'
import ScatterEOS from '@scatterjs/eosjs2'
import { Api, JsonRpc } from 'eosjs'
import fetch from 'node-fetch'
import axios from 'axios'
import axiosRetry from 'axios-retry'

import config from '~/config'
import { parseAsset } from '~/utils'

axiosRetry(axios, { retries: 10 })
ScatterJS.plugins(new ScatterEOS())

export const network = ScatterJS.Network.fromJson({
  blockchain: 'eos',
  ...config
})

//export const rpc = new JsonRpc(network.fullhost())
export const rpc = new JsonRpc(config.protocol + '://' + config.host + ':' + config.port, { fetch })
export const eos = ScatterJS.eos(network, Api, { rpc })
export const hyperion = axios.create({
  baseURL: config.hyperion,
  timeout: 10000
})

export const backEnd = axios.create({
  baseURL: config.backEnd,
  timeout: 10000
})

async function getOrders(market_id, side, kwargs) {
  // Set default options
  kwargs = { limit: 1000, ...kwargs }

  const { rows } = await rpc.get_table_rows({
    code: config.contract,
    scope: market_id,
    table: `${side}order`,
    limit: 1000,
    ...kwargs
  })

  return rows.map((b) => {
    b.ask = parseAsset(b.ask)
    b.bid = parseAsset(b.bid)
    return b
  })
}

export async function getSellOrders(market_id, kwargs) {
  return await getOrders(market_id, 'sell', kwargs)
}

export async function getBuyOrders(market_id, kwargs) {
  return await getOrders(market_id, 'buy', kwargs)
}
