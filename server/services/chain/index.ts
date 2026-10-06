import config from '../../../config'
import { createAntelopeAdapter } from './antelope'
import type { ChainAdapter } from './types'
import { createWireAdapter } from './wire'

export type { Balance, ChainAdapter } from './types'

const adapters = new Map<string, ChainAdapter>()

/** The chain adapter for a network name. Cached, so RPC clients are reused. */
export function getChain(chain: string): ChainAdapter {
  const cached = adapters.get(chain)
  if (cached) return cached

  const network: Network = config.networks[chain]
  if (!network) throw new Error(`Unknown chain: ${chain}`)

  const adapter = network.chainType === 'wire'
    ? createWireAdapter(network)
    : createAntelopeAdapter(network)

  adapters.set(chain, adapter)

  return adapter
}
