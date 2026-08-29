import fetch from 'cross-fetch'

import { JsonRpc } from '../../../assets/libs/eosjs-jsonrpc'
import { WireJsonRpc } from './wire/rpc'

// Deliberately free of any import from server/utils: that module builds RPCs
// through this one, and the chain adapters build on server/utils in turn.

/**
 * An RPC client for `network` whose get_table_rows returns flat rows whatever
 * the chain type. Pass the endpoints the caller wants tried, in order.
 */
export function makeRpc(network: Network, nodes: string[]): JsonRpc {
  if (network.chainType === 'wire') return new WireJsonRpc(nodes)

  return new JsonRpc(nodes, { fetch })
}
