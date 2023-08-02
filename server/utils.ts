import fetch from 'node-fetch'
import { createClient } from 'redis'
import { JsonRpc } from '../assets/libs/eosjs-jsonrpc'
import { getMultyEndRpc } from '../utils/eosjs'
import { Settings } from './models'

const redis = createClient()

export async function getTokenPrices(chain: string, id: string) {
  if (!redis.isOpen) await redis.connect()

  const tokens = JSON.parse(await redis.get(`${chain}_token_prices`))

  return tokens.find(t => t.id == id)
}

export function getFailOverRpc(network) {
  // Try alcore's node first for updating orderbook
  const nodes = [network.protocol + '://' + network.host + ':' + network.port].concat(Object.keys(network.client_nodes))
  nodes.sort((a) => a.includes('alcor') ? -1 : 1)

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

export async function getSettings(network: { name: string }) {
  const actions_stream_offset = {}

  try {
    let settings = await Settings.findOne({ chain: network.name })

    if (!settings) {
      console.log('creating settings')
      settings = await Settings.create({ chain: network.name, actions_stream_offset })
      console.log('created..')
    }

    return settings
  } catch (e) {
    console.log('db fail on get settinga, retry..', e)
    await new Promise(resolve => setTimeout(resolve, 1000))
    return await getSettings(network)
  }
}
