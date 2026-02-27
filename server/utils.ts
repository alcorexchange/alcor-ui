import mongoose from 'mongoose'
import axios from 'axios'
import fetch from 'cross-fetch'
import { JsonRpc } from '../assets/libs/eosjs-jsonrpc'
import { getMultyEndRpc } from '../utils/eosjs'
import { Settings } from './models'

// Re-export из нового singleton
export { initRedis, getRedis as redis, getPublisher as publisher, closeRedis } from './services/redis'
import { getRedis } from './services/redis'

export async function mongoConnect() {
  const uri = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?directConnection=true`
  await mongoose.connect(uri)
}

export async function getTokens(chain: string) {
  return JSON.parse(await getRedis().get(`${chain}_token_prices`))
}

export async function getToken(chain: string, id: string) {
  const tokens = await getTokens(chain)

  return tokens.find(t => t.id == id)
}

export function getFailOverAlcorOnlyRpc(network) {
  // Try alcore's node first for updating orderbook
  let nodes = [network.protocol + '://' + network.host + ':' + network.port]
    .concat(Object.keys(network.client_nodes))
    .filter(n => n.includes('alcor'))

  if (nodes.length == 0) {
    console.warn('NOT FOUND ALCOR NODE FOR:', network.name)
    nodes = [network.protocol + '://' + network.host + ':' + network.port]
      .concat(Object.keys(network.client_nodes))
  }

  const direct = process.env[network.name.toUpperCase() + '_DIRECT_NODE']

  if (direct) nodes.unshift(direct)

  const rpc = getMultyEndRpc(nodes, false)

  return rpc
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

export async function deleteKeysByPattern(client, pattern) {
  let totalDeleted = 0

  try {
    // Используем SCAN вместо KEYS (не блокирует Redis)
    const keysToDelete: string[] = []
    for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keysToDelete.push(key)
    }

    if (keysToDelete.length > 0) {
      // Удаляем найденные ключи батчами по 100
      for (let i = 0; i < keysToDelete.length; i += 100) {
        const batch = keysToDelete.slice(i, i + 100)
        const deletedCount = await client.del(batch)
        totalDeleted += deletedCount
      }
      console.log(`Deleted ${totalDeleted} keys matching the pattern "${pattern}".`)
    } else {
      console.log(`No keys found matching the pattern "${pattern}".`)
    }

    return totalDeleted
  } catch (error) {
    console.error('Error while deleting keys:', error)
    throw error
  }
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function getPlatformContracts(network): string[] {
  const contracts = [
    network.contract,
    network.amm?.contract,
    network.otc?.contract,
    network.staking?.contract,
  ]
  return [...new Set(contracts.filter(Boolean))]
}

async function fetchLightApiBalances(network, account: string): Promise<any[]> {
  try {
    const { data } = await axios.get(
      `${network.lightapi}/api/balances/${network.name}/${account}`
    )
    return data.balances || []
  } catch (e) {
    console.error(`[${network.name}] Failed to fetch balances for ${account}:`, e.message)
    return []
  }
}

export async function fetchPlatformBalances(network, tokens: any[]) {
  const contracts = getPlatformContracts(network)
  const tokenPriceMap = new Map<string, number>(tokens.map(t => [
    t.id,
    Number.isFinite(Number(t.safe_usd_price)) ? Number(t.safe_usd_price) : (t.usd_price || 0)
  ]))

  const results = await Promise.all(
    contracts.map(async (account) => ({
      account,
      balances: await fetchLightApiBalances(network, account)
    }))
  )

  const tokenTvlMap = new Map<string, number>()
  const contractTvlMap = new Map<string, number>()

  for (const { account, balances } of results) {
    let contractTvl = 0
    for (const balance of balances) {
      const tokenId = (balance.currency + '-' + balance.contract).toLowerCase()
      const price = tokenPriceMap.get(tokenId) ?? 0
      const tvl = parseFloat(balance.amount) * price
      tokenTvlMap.set(tokenId, (tokenTvlMap.get(tokenId) || 0) + tvl)
      contractTvl += tvl
    }
    contractTvlMap.set(account, contractTvl)
  }

  return { tokenTvlMap, contractTvlMap }
}
