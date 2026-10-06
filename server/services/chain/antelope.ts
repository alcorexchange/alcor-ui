import axios from 'axios'

import { streamByTrace } from '../updaterService/streamers'
import { getNodes } from './nodes'
import { makeRpc } from './rpc'
import type { Balance, ChainAdapter, ActionCallback } from './types'

// CoinGecko ids match our chain names, except for the testnets, which are priced
// off their mainnet counterparts.
const COINGECKO_IDS = {
  waxtest: 'wax',
  xprtest: 'proton',
}

export function createAntelopeAdapter(network: Network): ChainAdapter {
  let cachedRpc: any = null

  return {
    network,

    rpc() {
      if (!cachedRpc) cachedRpc = makeRpc(network, getNodes(network))
      return cachedRpc
    },

    streamActions(account, names, callback: ActionCallback, delay = 500) {
      return streamByTrace(network, account, callback, names, delay) as Promise<never>
    },

    async getBalances(account): Promise<Balance[]> {
      if (!network.lightapi) {
        console.warn(`[${network.name}] no lightapi configured, cannot read balances for ${account}`)
        return []
      }

      try {
        const { data } = await axios.get(`${network.lightapi}/api/balances/${network.name}/${account}`)
        return data.balances || []
      } catch (e) {
        console.error(`[${network.name}] Failed to fetch balances for ${account}:`, e.message)
        return []
      }
    },

    async getSystemUsdPrice(): Promise<number> {
      const id = COINGECKO_IDS[network.name] || network.name

      try {
        const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
          params: { ids: id, vs_currencies: 'usd' },
        })

        return Number(data[id].usd)
      } catch (e) {
        if (e.response?.status === 429) {
          console.log(`[${network.name}] CoinGecko rate limit (429)`)
        } else {
          console.error('SYSTEM PRICE UPDATE FAILED!', network.name, e.message || e)
        }

        return 0
      }
    },
  }
}
