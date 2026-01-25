import { performance } from 'perf_hooks'
import fetch from 'cross-fetch'
import { JsonRpc } from '../../../assets/libs/eosjs-jsonrpc'
const { Api } = require('enf-eosjs')

import { Match, Swap, Settings } from '../../models'
import { getSettings, sleep } from '../../utils'

function getAccountAsKey(account: string) {
  return account.replace('.', '-')
}

// Get all public nodes for a network (no direct nodes - they may not have full API)
function getPublicNodes(network: any): string[] {
  return [
    `${network.protocol}://${network.host}:${network.port}`,
    ...Object.keys(network.client_nodes)
  ]
}

// Try an async operation across all nodes until one succeeds
async function tryAllNodes<T>(
  network: any,
  operation: (rpc: any, nodeUrl: string) => Promise<T>,
  operationName: string
): Promise<T> {
  const nodes = getPublicNodes(network)

  for (const nodeUrl of nodes) {
    try {
      const rpc = new JsonRpc(nodeUrl, { fetch })
      return await operation(rpc, nodeUrl)
    } catch (e: any) {
      console.log(`[${network.name}] ${operationName} failed from ${nodeUrl}: ${e.message}`)
    }
  }

  throw new Error(`[${network.name}] ${operationName} failed on all nodes`)
}

// ABI Cache - invalidate only on decode failure
const abiCache: Map<string, any> = new Map()

async function getCachedAbi(network: any, account: string): Promise<any> {
  const key = `${network.name}:${account}`

  if (abiCache.has(key)) {
    return abiCache.get(key)
  }

  const abi = await tryAllNodes(network, async (rpc, nodeUrl) => {
    console.log(`[${network.name}] Fetching ABI for ${account} from ${nodeUrl}`)
    return await rpc.getRawAbi(account)
  }, `ABI fetch for ${account}`)

  abiCache.set(key, abi)
  return abi
}

function invalidateAbi(chain: string, account: string): void {
  const key = `${chain}:${account}`
  abiCache.delete(key)
  console.log(`[${chain}] Invalidated ABI cache for ${account}`)
}

function isHexString(str: any): boolean {
  return typeof str === 'string' && /^[0-9a-fA-F]+$/.test(str)
}

async function decodeActionData(hexData: any, abi: any, actionName: string): Promise<any> {
  if (!isHexString(hexData)) {
    return hexData
  }

  const api = new Api({
    abiProvider: {
      getRawAbi: () => abi,
    },
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  })

  const buffer = Buffer.from(hexData, 'hex')
  const data = await api.deserializeActions([
    {
      account: '',
      name: actionName,
      authorization: [],
      data: buffer,
    },
  ])

  return data[0].data
}

class RpcFailoverManager {
  private network: any
  private allNodes: string[] = []
  private currentNodeIndex: number = 0
  private currentRpc: any
  private failedNodes: Set<string> = new Set()
  private lastPrimaryRetry: number = Date.now()
  private readonly PRIMARY_RETRY_INTERVAL = 600000 // 10 minutes
  private greymassMode: boolean = false

  constructor(network: any) {
    this.network = network

    // Build list of all nodes to try
    // 1. Direct node (ENV) first
    const directNode = process.env[network.name.toUpperCase() + '_DIRECT_NODE']
    if (directNode) {
      this.allNodes.push(directNode)
    }

    // 2. Main node from config
    this.allNodes.push(network.protocol + '://' + network.host + ':' + network.port)

    // 3. All client nodes
    this.allNodes.push(...Object.keys(network.client_nodes))

    // Remove duplicates (normalize by removing :443 port)
    this.allNodes = [...new Set(this.allNodes.map(n => n.replace(':443', '')))]

    console.log(`[${network.name}] Initialized ${this.allNodes.length} RPC nodes`)

    this.currentRpc = new JsonRpc(this.allNodes[0], { fetch })
  }

  getCurrentRpc(): any {
    // Periodically retry from beginning (clear failed nodes)
    if (this.failedNodes.size > 0 && Date.now() - this.lastPrimaryRetry > this.PRIMARY_RETRY_INTERVAL) {
      console.log(`[${this.network.name}] Retrying all nodes from beginning...`)
      this.failedNodes.clear()
      this.currentNodeIndex = 0
      this.greymassMode = false
      this.lastPrimaryRetry = Date.now()
      this.currentRpc = new JsonRpc(this.allNodes[0], { fetch })
    }

    return this.currentRpc
  }

  markFailed(): void {
    const currentNode = this.allNodes[this.currentNodeIndex]
    this.failedNodes.add(currentNode)

    // Find next non-failed node
    let nextIndex = (this.currentNodeIndex + 1) % this.allNodes.length
    let attempts = 0

    while (this.failedNodes.has(this.allNodes[nextIndex]) && attempts < this.allNodes.length) {
      nextIndex = (nextIndex + 1) % this.allNodes.length
      attempts++
    }

    if (attempts >= this.allNodes.length || this.failedNodes.size >= this.allNodes.length) {
      console.log(`[${this.network.name}] All ${this.allNodes.length} RPC nodes failed, falling back to Greymass API`)
      this.greymassMode = true
      return
    }

    this.currentNodeIndex = nextIndex
    const nextNode = this.allNodes[nextIndex]
    console.log(`[${this.network.name}] RPC switch: ${nextNode} (${this.failedNodes.size}/${this.allNodes.length} failed)`)
    this.currentRpc = new JsonRpc(nextNode, { fetch })
  }

  isGreymassMode(): boolean {
    return this.greymassMode
  }

  getCurrentNodeUrl(): string {
    return this.allNodes[this.currentNodeIndex]
  }
}

async function getBlockNumByTrxId(network: any, trxId: string): Promise<number | null> {
  const allNodes: string[] = []

  const directNode = process.env[network.name.toUpperCase() + '_DIRECT_NODE']
  if (directNode) allNodes.push(directNode)

  allNodes.push(network.protocol + '://' + network.host + ':' + network.port)
  allNodes.push(...Object.keys(network.client_nodes))

  for (const nodeUrl of allNodes) {
    try {
      const rpc = new JsonRpc(nodeUrl, { fetch })
      const result = await rpc.history_get_transaction(trxId)
      if (result?.block_num && result.block_num > 0) {
        return result.block_num
      }
    } catch (e: any) {
      // Try next node
    }
  }

  return null
}

async function getStartingBlock(network: any, account: string, rpc: any): Promise<number> {
  console.log(`[${network.name}:${account}] Getting starting block...`)
  const settings = await getSettings(network)
  const key = getAccountAsKey(account)
  console.log(`[${network.name}:${account}] Settings key: ${key}, last_block_num: ${settings.last_block_num?.[key]}`)

  // 1. Check Settings for saved last_block_num
  const savedBlockNum = settings.last_block_num?.[key]
  if (savedBlockNum && savedBlockNum > 0) {
    console.log(`[${network.name}:${account}] Resuming from block ${savedBlockNum} (saved)`)
    return savedBlockNum
  }

  // 2. For orderbook contract - get from Match model (use time index, not block_num)
  if (account === network.contract) {
    console.log(`[${network.name}:${account}] Querying Match model by time...`)
    const lastMatch: any = await Match.findOne({ chain: network.name })
      .sort({ time: -1 })
      .select('block_num trx_id')
      .lean()

    if (lastMatch?.block_num && lastMatch.block_num > 0) {
      console.log(`[${network.name}:${account}] Starting from block ${lastMatch.block_num} (last Match)`)
      return lastMatch.block_num
    }

    // Fallback: resolve block_num via trx_id
    if (lastMatch?.trx_id) {
      console.log(`[${network.name}:${account}] Resolving block_num via trx_id...`)
      const blockNum = await getBlockNumByTrxId(network, lastMatch.trx_id)
      if (blockNum && blockNum > 0) {
        console.log(`[${network.name}:${account}] Starting from block ${blockNum} (from trx_id)`)
        return blockNum
      }
    }
  }

  // 3. For AMM contract - get from Swap model (use time index)
  if (account === network.amm?.contract) {
    console.log(`[${network.name}:${account}] Querying Swap model by time...`)
    const lastSwap: any = await Swap.findOne({ chain: network.name })
      .sort({ time: -1 })
      .select('block_num trx_id')
      .lean()

    if (lastSwap?.block_num && lastSwap.block_num > 0) {
      console.log(`[${network.name}:${account}] Starting from block ${lastSwap.block_num} (last Swap)`)
      return lastSwap.block_num
    }

    // Fallback: resolve block_num via trx_id
    if (lastSwap?.trx_id) {
      console.log(`[${network.name}:${account}] Resolving block_num via trx_id...`)
      const blockNum = await getBlockNumByTrxId(network, lastSwap.trx_id)
      if (blockNum && blockNum > 0) {
        console.log(`[${network.name}:${account}] Starting from block ${blockNum} (from trx_id)`)
        return blockNum
      }
    }
  }

  throw new Error(
    `[${network.name}:${account}] Cannot determine starting block. Manual intervention required.`
  )
}

export async function streamByGreymass(network: any, account: string, callback: Function, actions: string[], delay = 500) {
  console.info(`[${network.name}] Starting Greymass streamer for ${account}...`)

  const rpc = new JsonRpc(`${network.protocol}://${network.host}:${network.port}`, { fetch })
  const settings = await getSettings(network)

  let offset = settings.actions_stream_offset[getAccountAsKey(account)] || 0

  console.log(`[${network.name}] Greymass: starting from offset ${offset} for ${account}`)

  while (true) {
    let r
    try {
      const startTime = performance.now()
      r = await rpc.history_get_actions(account, offset, 100)
      const endTime = performance.now()

      if (r.actions.length > 0) {
        console.log(`[greymass:${network.name}:${account}] received ${r.actions.length} actions in ${Math.round(endTime - startTime)}ms`)
      }
    } catch (e: any) {
      console.log(`[${network.name}] Greymass error:`, e.message)
      await sleep(delay)
      continue
    }

    for (const a of r.actions.map((a: any) => a.action_trace)) {
      offset += 1

      if (actions.includes(a.act.name)) {
        await callback(a, network)
      }
    }

    const $set: any = {}
    $set[`actions_stream_offset.${getAccountAsKey(account)}`] = offset

    await Settings.updateOne({ chain: network.name }, { $set })

    const pause = r.actions.length < 100 ? delay : 20
    await sleep(pause)
  }
}

export async function streamByTrace(network: any, account: string, callback: Function, actions: string[], delay = 500) {
  console.info(`[${network.name}] Starting trace streamer for ${account}...`)

  const failoverManager = new RpcFailoverManager(network)
  let rpc = failoverManager.getCurrentRpc()

  let currentBlock = await getStartingBlock(network, account, rpc)

  // Dynamic delay calculation
  let lastBlockTime: number | null = null
  let averageBlockTime = 500
  const smoothingFactor = 0.03

  const MAX_ABI_RETRIES = 3

  while (true) {
    // Check if we should use Greymass fallback
    if (failoverManager.isGreymassMode()) {
      console.log(`[${network.name}] All RPCs failed, falling back to Greymass for ${account}`)
      await streamByGreymass(network, account, callback, actions, delay)
      return
    }

    rpc = failoverManager.getCurrentRpc()

    try {
      const block = await rpc.get_trace_block(currentBlock)

      // Log progress every 100 blocks
      if (currentBlock % 100 === 0) {
        console.log(`[${network.name}:${account}] #${currentBlock} via ${failoverManager.getCurrentNodeUrl()}`)
      }

      if (block && block.transactions) {
        for (const transaction of block.transactions) {
          // status may be undefined in trace API (means executed), or explicitly 'executed'
          if (!transaction.status || transaction.status === 'executed') {
            for (const action of transaction.actions) {
              // Check if this action is for our account and action type
              if (action.account === account && (actions.includes(action.action) || actions.includes(action.name) || actions.includes('*'))) {
                const actionName = action.action || action.name

                // Decode action data with retry on ABI failure
                let data = action.data
                let abiRetries = 0

                while (abiRetries < MAX_ABI_RETRIES) {
                  try {
                    const abi = await getCachedAbi(network, action.account)
                    data = await decodeActionData(action.data, abi, actionName)
                    break
                  } catch (e: any) {
                    abiRetries++
                    console.log(`[${network.name}] ABI decode error for ${actionName} (attempt ${abiRetries}):`, e.message)

                    if (abiRetries < MAX_ABI_RETRIES) {
                      invalidateAbi(network.name, action.account)
                      await sleep(100)
                    } else {
                      console.error(`[${network.name}] Failed to decode ${actionName} after ${MAX_ABI_RETRIES} attempts, skipping`)
                      data = null
                    }
                  }
                }

                if (data !== null) {
                  // Normalize to Greymass format for callback compatibility
                  const normalizedAction = {
                    act: {
                      account: action.account,
                      name: actionName,
                      data,
                    },
                    receipt: {
                      global_sequence: action.global_sequence,
                      receiver: action.receiver,
                    },
                    trx_id: transaction.id,
                    block_num: block.number,
                    block_time: block.timestamp,
                  }

                  await callback(normalizedAction, network)
                }
              }
            }
          }
        }
      }

      // Update block time for dynamic delay
      let timestamp = block.timestamp
      if (!timestamp.includes('Z')) {
        timestamp += 'Z'
      }

      const blockTime = new Date(timestamp).getTime()

      if (lastBlockTime) {
        const timeBetweenBlocks = blockTime - lastBlockTime
        averageBlockTime = averageBlockTime * (1 - smoothingFactor) + timeBetweenBlocks * smoothingFactor
      }

      lastBlockTime = blockTime
      currentBlock++

      // Save progress
      const $set: any = {}
      $set[`last_block_num.${getAccountAsKey(account)}`] = currentBlock

      await Settings.updateOne({ chain: network.name }, { $set })

      // Calculate dynamic delay
      const now = Date.now()
      const expectedNextBlockTime = blockTime + averageBlockTime
      const dynamicDelay = Math.max(0, expectedNextBlockTime - now)

      if (dynamicDelay > 0) {
        await sleep(dynamicDelay)
      }
    } catch (error: any) {
      const currentUrl = failoverManager.getCurrentNodeUrl()
      const passErrors = ['Could not find block', 'block trace missing', 'block not found']
      const errorMessage = error.message || ''

      // Check if block not found
      if (passErrors.some((err) => errorMessage.includes(err))) {
        // Check if we're ahead of head (block doesn't exist yet) or behind (node doesn't have old blocks)
        try {
          const info = await rpc.get_info()
          const headBlock = info.head_block_num

          if (currentBlock > headBlock) {
            // We're ahead - block doesn't exist yet, wait
            averageBlockTime = averageBlockTime * 1.1
            await sleep(100)
            continue
          } else {
            // We're behind - node doesn't have this old block, switch
            console.log(`[${network.name}] ${currentUrl} missing block ${currentBlock}`)
            failoverManager.markFailed()
            await sleep(100)
            continue
          }
        } catch (infoError: any) {
          console.log(`[${network.name}] ${currentUrl} error: ${infoError.message}`)
          failoverManager.markFailed()
          await sleep(1000)
          continue
        }
      }

      // RPC error - mark failed and switch
      console.log(`[${network.name}] ${currentUrl} error: ${errorMessage}`)
      failoverManager.markFailed()
      await sleep(1000)
    }
  }
}
