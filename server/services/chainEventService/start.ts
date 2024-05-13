import { createClient } from 'redis'

import config from '../../../config'
import { getFailOverAlcorOnlyRpc } from '../../utils'

// HOTFIX SOMETHING WITH CONNECTION
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const publisher = createClient()

const ACCOUNTS = ['swap.alcor', 'alcordexmain']
const ACTIONS = ['*']

async function handleAction(chain: string, action) {
  if (!publisher.isOpen) await publisher.connect()

  const { account, name } = action

  publisher.publish(`chainAction:${chain}:${account}:${name}`, JSON.stringify({ chain, ...action }))
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

async function eventStreamer(chain: string, callback?) {
  console.log('run eventStreamer for', chain)
  const network = config.networks[chain]
  const rpc = getFailOverAlcorOnlyRpc(network)

  async function getCurrentBlockNumber() {
    const info = await rpc.get_info()
    return info.head_block_num
  }

  //let currentBlock = await getCurrentBlockNumber()
  let currentBlock = 308286482

  while (true) {
    try {
      const block = await rpc.get_block(currentBlock)

      if (block && block.transactions) {
        for (const transaction of block.transactions) {
          if (typeof transaction.trx === 'object' && transaction.status === 'executed') {
            if (typeof transaction.trx === 'object') {
              for (const action of transaction.trx.transaction.actions) {
                if (ACCOUNTS.includes(action.account) && (ACTIONS.includes(action.name) || ACTIONS.includes('*'))) {
                  if (callback) callback(chain, {
                    ...action,

                    trx_id: transaction.trx.id,
                    block_num: block.block_num,
                    block_time: block.timestamp
                  })
                }
              }
            }
          }
        }
      }
      currentBlock++
      //process.stdout.write(`${currentBlock}\r`)

      const block_time = new Date(block.timestamp + 'Z').getTime()
      const next_block_time = block_time + 500
      const now = Date.now()

      const delay = next_block_time - now

      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    } catch (error) {
      if (error.message.includes('Could not find block')) {
        console.log('too fast')
        await new Promise((resolve) => setTimeout(resolve, 500))
        continue
      }

      console.error('Error fetching block:', error)
      // Optionally implement a retry mechanism or a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}
