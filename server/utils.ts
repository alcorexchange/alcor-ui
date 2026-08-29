import mongoose from 'mongoose'
import { getNodes } from './services/chain/nodes'
import { makeRpc } from './services/chain/rpc'
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

// Insert or replace a single token in the `{chain}_token_prices` cache, so an on-the-fly
// generated token is served from the fast path until the next full price update rebuilds it.
export async function upsertTokenPrice(chain: string, token: any) {
  const tokens = (await getTokens(chain)) || []
  const idx = tokens.findIndex(t => t.id === token.id)

  if (idx >= 0) tokens[idx] = token
  else tokens.push(token)

  await getRedis().set(`${chain}_token_prices`, JSON.stringify(tokens))
}

export function getFailOverAlcorOnlyRpc(network) {
  // Try alcore's node first for updating orderbook
  return makeRpc(network, getNodes(network, { alcorOnly: true }))
}

export function getFailOverRpc(network) {
  return makeRpc(network, getNodes(network, { includeDirect: false }))
}

const rpcs = {}
export function getSingleEndpointRpc(network) {
  if (network.name in rpcs) return rpcs[network.name]

  const rpc = makeRpc(network, getNodes(network, { includeDirect: false }))
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

// Balance reading lives in services/chain — it is one of the four things that
// differ per chain type. See services/chain/balances.ts.
