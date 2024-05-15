import { createClient } from 'redis'

import config from '../../../config'
import { getFailOverAlcorOnlyRpc } from '../../utils'
import { decodeActionData } from './utils'

// HOTFIX SOMETHING WITH CONNECTION
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const publisher = createClient()

const ACCOUNTS = ['swap.alcor', 'alcordexmain', 'alcor']
const ACTIONS = ['*']

async function handleAction(chain: string, action) {
  if (!publisher.isOpen) await publisher.connect()

  const { account, name } = action

  publisher.publish(`chainAction:${chain}:${account}:${name}`, JSON.stringify({ chain, ...action }))
  //console.log('new action: ', `chainAction:${chain}.${account}.${name}`, action)
  console.log('new action: ', `chainAction:${chain}.${account}.${name}`)
}

export function start() {
  if (process.env.NETWORK) {
    console.log('NETWORK=', process.env.NETWORK)
    eventStreamer(process.env.NETWORK, handleAction)
  } else {
    eventStreamer('eos', handleAction)
    eventStreamer('wax', handleAction)
    eventStreamer('proton', handleAction)
    eventStreamer('telos', handleAction)
  }
}

const ABIs = {}
async function getCachedAbi(chain, rpc, account) {
  const key = `${chain}:${account}}`

  if (!(key in ABIs)) {
    console.log('call for abi', account)
    ABIs[key] = await rpc.getRawAbi(account)
  }

  return ABIs[key]
}

async function eventStreamer(chain: string, callback?) {
  console.log('run eventStreamer for', chain)
  const network = config.networks[chain]
  const rpc = getFailOverAlcorOnlyRpc(network)

  async function getCurrentBlockNumber() {
    const info = await rpc.get_info()
    return info.head_block_num
  }

  let currentBlock = await getCurrentBlockNumber()
  //let currentBlock = 308286482
  //let currentBlock = 256069154

  while (true) {
    try {
      const block = await rpc.get_trace_block(currentBlock)
      if (currentBlock % 10 == 0) console.log('ok:', currentBlock)

      if (block && block.transactions) {
        for (const transaction of block.transactions) {
          if (transaction.status === 'executed') {
            for (const action of transaction.actions) {
              if (ACCOUNTS.includes(action.account) && (ACTIONS.includes(action.name) || ACTIONS.includes('*'))) {
                const data = await decodeActionData(action.data, await getCachedAbi(chain, rpc, action.account), action.action)

                action.name = action.action
                //action.hex_data = action.data
                action.trx_id = transaction.id
                action.block_num = block.number
                action.block_time = block.timestamp
                action.data = data

                delete action.action

                if (callback) callback(chain, action)
              }
            }
          }
        }
      }
      currentBlock++

      const block_time = new Date(block.timestamp).getTime()
      const next_block_time = block_time + 500
      const now = Date.now()

      const delay = next_block_time - now

      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    } catch (error) {
      if (error.message.includes('Could not find block') || error.message.includes('block trace missing')) {
        console.log('too fast', currentBlock)
        await new Promise((resolve) => setTimeout(resolve, 100))
        continue
      }

      console.error('Error fetching block:', currentBlock, error)
      // Optionally implement a retry mechanism or a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}
