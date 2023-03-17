import { createClient } from 'redis'
import { onSwapAction } from '../swapV2Service'
import { updateTokensPrices } from './prices'

const redisClient = createClient()
// const ONEDAY = 60 * 60 * 24 * 1000
// const WEEK = ONEDAY * 7

export async function newSwapAction(action, network: Network) {
  if (!redisClient.isOpen) redisClient.connect()

  const { trx_id, block_time, block_num, act: { name, data } } = action

  const message = JSON.stringify({ chain: network.name, name, trx_id, block_num, block_time, data })

  onSwapAction(message)

  // TODO Make it async after tests
  //redisClient.publish('swap_action', message)
}

