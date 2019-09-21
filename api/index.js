import ScatterJS from '@scatterjs/core'
import ScatterEOS from '@scatterjs/eosjs2'
import { Api, JsonRpc } from 'eosjs'
import fetch from 'node-fetch'

import config from '~/config'

ScatterJS.plugins(new ScatterEOS())

export const network = ScatterJS.Network.fromJson({
      blockchain: 'eos',
      ...config
})

export const rpc = new JsonRpc(config.host, { fetch })
export const eos = ScatterJS.eos(network, Api, {rpc, beta3: true})



          // this.rpc.get_table_rows({code: config.contract, scope: this.market_id, table: 'buyorder', limit: 1000 }),
          // this.rpc.get_table_rows({ code: config.contract, scope: this.market_id, table: 'sellorder', limit: 1000 }),
