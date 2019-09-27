import ScatterJS from '@scatterjs/core'
import ScatterEOS from '@scatterjs/eosjs2'
import { Api, JsonRpc } from 'eosjs'
import fetch from 'node-fetch'

import config from '~/config'
import { parseAsset } from '~/utils'

ScatterJS.plugins(new ScatterEOS())

export const network = ScatterJS.Network.fromJson({
  blockchain: 'eos',
  ...config
})

export const rpc = new JsonRpc(config.host, { fetch })
export const eos = ScatterJS.eos(network, Api, { rpc, beta3: true })

async function getOrders(market_id, side, kwargs) {
  // Set default options
  kwargs = {limit: 1000, ...kwargs}

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
