import mongoose from 'mongoose'
import fetch from 'cross-fetch'
import { createClient, RedisClientType } from 'redis'
import { JsonRpc } from '../assets/libs/eosjs-jsonrpc'
import { getMultyEndRpc } from '../utils/eosjs'
import { Settings } from './models'

const redisClient = createClient()
const publisherClient = createClient()

export async function initRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  } else {
    console.warn('REDIS CLIENT ALREADY OPENED')
  }

  if (!publisherClient.isOpen) {
    await publisherClient.connect()
  } else {
    console.warn('REDIS Publisher ALREADY OPENED')
  }

  console.log('✅ Redis and Publisher connected')
  return [redisClient, publisherClient]
}

// 🧠 Ленивые безопасные геттеры

export function redis() {
  if (!redisClient?.isOpen) throw new Error('redisClient is not connected!')
  return redisClient
}

export function publisher() {
  if (!publisherClient?.isOpen) throw new Error('publisherClient is not connected!')
  return publisherClient
}

export async function mongoConnect() {
  const uri = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?directConnection=true`
  await mongoose.connect(uri)
}

export async function getTokens(chain: string) {
  return JSON.parse(await redis().get(`${chain}_token_prices`))
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
  if (!client.isOpen) await client.connect()

  let totalDeleted = 0

  try {
    // Получаем все ключи по заданному паттерну
    const keys = await client.keys(pattern)

    if (keys.length > 0) {
      // Удаляем найденные ключи
      const deletedCount = await client.del(keys)
      totalDeleted += deletedCount
      console.log(`Deleted ${deletedCount} keys matching the pattern "${pattern}".`)
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
