import { performance } from 'perf_hooks'
import fetch from 'cross-fetch'
import { JsonRpc } from '../../../assets/libs/eosjs-jsonrpc'
const { Api } = require('enf-eosjs')

import { Match, Swap, Settings } from '../../models'
import { getSettings, sleep } from '../../utils'

const ABI_TIMEOUT_MS = Number(process.env.ABI_FETCH_TIMEOUT_MS) || 8000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

function getAccountAsKey(account: string) {
  return account.replace('.', '-')
}

// Get nodes for ABI fetch (direct node first, then main + client nodes)
function getAbiNodes(network: any): string[] {
  const nodes: string[] = []

  const directNode = process.env[network.name.toUpperCase() + '_DIRECT_NODE']
  if (directNode) nodes.push(directNode)

  nodes.push(`${network.protocol}://${network.host}:${network.port}`)
  nodes.push(...Object.keys(network.client_nodes))

  return nodes
}

// Try an async operation across all nodes until one succeeds
async function tryAllNodes<T>(
  network: any,
  operation: (rpc: any, nodeUrl: string) => Promise<T>,
  operationName: string,
  nodesOverride?: string[],
  timeoutMs?: number
): Promise<T> {
  const nodes = nodesOverride || getAbiNodes(network)

  for (const nodeUrl of nodes) {
    try {
      const rpc = new JsonRpc(nodeUrl, { fetch })
      const op = operation(rpc, nodeUrl)
      return await (timeoutMs ? withTimeout(op, timeoutMs, operationName) : op)
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
  }, `ABI fetch for ${account}`, getAbiNodes(network), ABI_TIMEOUT_MS)

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
  try {
    const data = await api.deserializeActions([
      {
        account: '',
        name: actionName,
        authorization: [],
        data: buffer,
      },
    ])

    return data[0].data
  } catch (e: any) {
    const msg = String(e?.message || '')
    if (msg.includes('Unknown action') || msg.includes('unknown action')) {
      return null
    }
    throw e
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

      const actionBlockNum = a.block_num || a.block_num?.block_num
      if (actionBlockNum) {
        const $set: any = {}
        $set[`last_block_num.${getAccountAsKey(account)}`] = actionBlockNum
        await Settings.updateOne({ chain: network.name }, { $set })
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

  const directNode = process.env[network.name.toUpperCase() + '_DIRECT_NODE']
  const fallbackNodes = [
    `${network.protocol}://${network.host}:${network.port}`,
    ...Object.keys(network.client_nodes || {})
  ]
  const allFallbacks = [...new Set(fallbackNodes)]
  let fallbackIndex = 0
  let currentNode = directNode || allFallbacks[0]
  let rpc = new JsonRpc(currentNode, { fetch })
  let lastDirectRetry = Date.now()
  const DIRECT_RETRY_INTERVAL = 60 * 1000

  let currentBlock = await getStartingBlock(network, account, rpc)

  const MAX_ABI_RETRIES = 3
  const PREFETCH_SIZE = 10

  // Optimistic fetch state
  const BACKOFF_STEPS = [50, 100, 200, 500]
  let notFoundRetries = 0
  let consecutiveSuccess = 0 // Track successful fetches to detect catch-up mode

  // Process a single block
  async function processBlock(block: any): Promise<void> {
    if (!block || !block.transactions) return

    for (const transaction of block.transactions) {
      if (!transaction.status || transaction.status === 'executed') {
        const actionsList = Array.isArray(transaction.actions) ? transaction.actions : []
        for (const action of actionsList) {
          if (action.account === account && (actions.includes(action.action) || actions.includes(action.name) || actions.includes('*'))) {
            const actionName = action.action || action.name

            let data = action.data
            let abiRetries = 0

            while (abiRetries < MAX_ABI_RETRIES) {
              try {
                const abi = await getCachedAbi(network, action.account)
                data = await decodeActionData(action.data, abi, actionName)
                if (data === null) {
                  abiRetries = MAX_ABI_RETRIES
                }
                break
              } catch (e: any) {
                abiRetries++
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
              const normalizedAction = {
                act: { account: action.account, name: actionName, data },
                receipt: { global_sequence: action.global_sequence, receiver: action.receiver },
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

  while (true) {
    try {
      // === OPTIMISTIC FETCH: try to get block directly ===
      try {
        const block = await rpc.get_trace_block(currentBlock)

        // Success - reset backoff, track consecutive successes
        notFoundRetries = 0
        consecutiveSuccess++

        // If we're getting blocks fast (no "not found"), try prefetch
        if (consecutiveSuccess >= PREFETCH_SIZE) {
          // === CATCH-UP MODE: prefetch blocks in parallel ===
          await processBlock(block)
          currentBlock++

          const blockNumbers = Array.from({ length: PREFETCH_SIZE }, (_, i) => currentBlock + i)
          const blockPromises = blockNumbers.map(num =>
            rpc.get_trace_block(num).catch((e: any) => ({ error: e, blockNum: num }))
          )
          const blocks = await Promise.all(blockPromises)

          // Process successful blocks until first error
          let processed = 0
          for (const b of blocks) {
            if ((b as any).error) {
              const errMsg = String((b as any).error?.message || '').toLowerCase()
              const isNotFound = ['could not find block', 'block trace missing', 'block not found']
                .some(s => errMsg.includes(s))
              consecutiveSuccess = 0
              if (!isNotFound) {
                // Network/node error - trigger failover
                throw (b as any).error
              }
              // Hit the head - switch to realtime
              break
            }
            await processBlock(b)
            currentBlock++
            processed++
          }

          // Save progress after batch
          const $set: any = {}
          $set[`last_block_num.${getAccountAsKey(account)}`] = currentBlock
          await Settings.updateOne({ chain: network.name }, { $set })

          // Log progress with lag info (only every ~100 blocks to avoid spamming get_info)
          if (currentBlock % 100 < PREFETCH_SIZE + 1) {
            const info = await rpc.get_info()
            const head = info.head_block_num
            const remainingBlocks = head - currentBlock
            const lagSeconds = Math.round(remainingBlocks * 0.5)
            const lagFormatted = lagSeconds >= 3600
              ? `${Math.floor(lagSeconds / 3600)}h ${Math.floor((lagSeconds % 3600) / 60)}m`
              : lagSeconds >= 60
                ? `${Math.floor(lagSeconds / 60)}m ${lagSeconds % 60}s`
                : `${lagSeconds}s`
            console.log(`[${network.name}:${account}] #${currentBlock} | ${remainingBlocks} blocks | ${lagFormatted} behind`)
          }
          continue
        }

        // === REALTIME MODE ===
        if (currentBlock % 100 === 0) {
          console.log(`[${network.name}:${account}] #${currentBlock} realtime via ${currentNode}`)
        }

        await processBlock(block)
        currentBlock++

        // Save progress
        const $set: any = {}
        $set[`last_block_num.${getAccountAsKey(account)}`] = currentBlock
        await Settings.updateOne({ chain: network.name }, { $set })

      } catch (blockError: any) {
        const errorMessage = blockError.message || ''
        const isNotFound = ['Could not find block', 'block trace missing', 'block not found']
          .some(err => errorMessage.toLowerCase().includes(err.toLowerCase()))

        if (isNotFound) {
          // Block not found - reset catch-up mode, use progressive backoff
          consecutiveSuccess = 0
          const backoffIndex = Math.min(notFoundRetries, BACKOFF_STEPS.length - 1)
          const backoffTime = BACKOFF_STEPS[backoffIndex]
          notFoundRetries++

          // After several retries, check position relative to head
          if (notFoundRetries >= 5) {
            const info = await rpc.get_info()
            const head = info.head_block_num
            if (currentBlock > head) {
              // We're ahead of chain - wait for new blocks
              await sleep(Math.max(100, (currentBlock - head) * 500))
              notFoundRetries = 0
            } else if (head - currentBlock > 100) {
              // Block should exist but trace is missing - likely pruned, skip it
              console.log(`[${network.name}:${account}] Block ${currentBlock} trace missing (head: ${head}), skipping`)
              currentBlock++
              notFoundRetries = 0
              // Save progress immediately to avoid restart loop
              const $set: any = {}
              $set[`last_block_num.${getAccountAsKey(account)}`] = currentBlock
              await Settings.updateOne({ chain: network.name }, { $set })
            }
          } else {
            await sleep(backoffTime)
          }
          continue
        }
        throw blockError
      }

    } catch (error: any) {
      const now = Date.now()
      if (directNode && now - lastDirectRetry >= DIRECT_RETRY_INTERVAL) {
        lastDirectRetry = now
        currentNode = directNode
      } else {
        if (allFallbacks.length > 0) {
          fallbackIndex = (fallbackIndex + 1) % allFallbacks.length
          currentNode = allFallbacks[fallbackIndex]
        }
      }
      console.log(`[${network.name}] ${currentNode} error: ${error.message}`)
      rpc = new JsonRpc(currentNode, { fetch })
      await sleep(5000)
    }
  }
}
