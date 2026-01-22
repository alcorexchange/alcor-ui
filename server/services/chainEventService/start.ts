import config from '../../../config'
import { getFailOverAlcorOnlyRpc } from '../../utils'
import { getPublisher } from '../redis'
import { decodeActionData } from './utils'

// HOTFIX SOMETHING WITH CONNECTION
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const ACCOUNTS = ['swap.alcor', 'alcordexmain', 'alcor', 'book.alcor']
const ACTIONS = ['*']

async function handleAction(chain: string, action) {
  const { account, name } = action

  getPublisher().publish(`chainAction:${chain}:${account}:${name}`, JSON.stringify({ chain, ...action }))
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
    eventStreamer('ultra', handleAction)
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
  // currentBlock = 220772794

  // Переменные для расчёта динамической задержки
  let lastBlockTime = null
  let averageBlockTime = 500 // Начальное предположение: 500 мс на блок
  const smoothingFactor = 0.03 // Фактор сглаживания для скользящего среднего

  while (true) {
    try {
      const block = await rpc.get_trace_block(currentBlock)
      if (currentBlock % 10 == 0) console.log(chain, ' ok:', currentBlock)

      if (block && block.transactions) {
        for (const transaction of block.transactions) {
          if (transaction.status === 'executed' || chain === 'ultra') {
            for (const action of transaction.actions) {
              if (ACCOUNTS.includes(action.account) && (ACTIONS.includes(action.name) || ACTIONS.includes('*'))) {
                const isHex = typeof action.data === 'string' && /^[0-9a-fA-F]+$/.test(action.data)
                console.log(`[${chain}] decoding action: ${action.account}::${action.action}, isHex: ${isHex}`)

                const data = await decodeActionData(
                  action.data,
                  await getCachedAbi(chain, rpc, action.account),
                  action.action
                )

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

      // Обновляем текущее время блока

      if (!block.timestamp.includes('Z')) {
        block.timestamp += 'Z'
      }

      const blockTime = new Date(block.timestamp).getTime()

      if (lastBlockTime) {
        // Вычисляем время между блоками
        const timeBetweenBlocks = blockTime - lastBlockTime

        // Обновляем скользящее среднее времени блока
        averageBlockTime = averageBlockTime * (1 - smoothingFactor) + timeBetweenBlocks * smoothingFactor
      }

      lastBlockTime = blockTime

      currentBlock++

      // Рассчитываем задержку
      const now = Date.now()
      const expectedNextBlockTime = blockTime + averageBlockTime
      const delay = Math.max(0, expectedNextBlockTime - now)

      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    } catch (error) {
      const passErrors = ['Could not find block', 'block trace missing', 'block not found']
      const errorMessage = error.message

      // Проверка на наличие одной из ошибок
      if (passErrors.some((err) => errorMessage.includes(err))) {
        console.log(chain, ': too fast', currentBlock, `(${averageBlockTime})`)

        averageBlockTime = averageBlockTime * 1.1 // Увеличиваем время на 10%

        await new Promise((resolve) => setTimeout(resolve, 100))
        continue
      }

      console.error(`Error fetching block(${chain}):`, currentBlock, error)
      // Optionally implement a retry mechanism or a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}
