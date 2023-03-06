import fetch from 'node-fetch'
import { JsonRpc } from '../assets/libs/eosjs-jsonrpc'
import { getMultyEndRpc } from '../utils/eosjs'

export function getFailOverRpc(network) {
  // Try alcore's node first for updating orderbook
  const nodes = [network.protocol + '://' + network.host + ':' + network.port].concat(Object.keys(network.client_nodes))
  nodes.sort((a,) => a.includes('alcor') ? -1 : 1)

  return getMultyEndRpc(nodes)
}

const rpcs = {}
export function getSingleEndpointRpc(network) {
  if (network.name in rpcs) return rpcs[network.name]

  // Try alcore's node first for updating orderbook
  const nodes = [network.protocol + '://' + network.host + ':' + network.port].concat(Object.keys(network.client_nodes))
  nodes.sort((a, b) => a.includes('alcor') ? -1 : 1)

  const rpc = new JsonRpc(nodes, { fetch })
  rpcs[network.name] = rpc

  return rpc
}
