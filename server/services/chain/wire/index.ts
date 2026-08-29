import { getNodes } from '../nodes'
import { makeRpc } from '../rpc'
import type { Balance, ChainAdapter, ActionCallback } from '../types'
import { getWireBalances } from './balances'
import { streamByWireActions } from './streamer'

export function createWireAdapter(network: Network): ChainAdapter {
  let cachedRpc: any = null

  const rpc = () => {
    if (!cachedRpc) cachedRpc = makeRpc(network, getNodes(network))
    return cachedRpc
  }

  return {
    network,

    rpc,

    streamActions(account, names, callback: ActionCallback, delay = 500) {
      return streamByWireActions(network, account, rpc(), callback, names, delay)
    },

    getBalances(account, tokenContracts): Promise<Balance[]> {
      return getWireBalances(rpc(), tokenContracts, account)
    },

    async getSystemUsdPrice(): Promise<number> {
      // Nothing lists this chain's system token and it has no pool, so the only
      // honest source is the number set in config.
      if (network.fixedSystemPrice !== undefined) return Number(network.fixedSystemPrice)

      console.warn(`[${network.name}] no fixedSystemPrice and no market for ${network.baseToken.symbol}`)
      return 0
    },
  }
}
