import { createClient } from 'redis'
import fetch from 'node-fetch'
import { JsonRpc } from '../../../assets/libs/eosjs-jsonrpc'
import { parseExtendedAsset, littleEndianToDesimal, parseAsset } from '../../../utils'
//import { Match, Market } from '../../models'
import config from '../../../config'

type LogBurn = {
  poolId: number,
  posId: number,
  owner: string,

  tickLower: number
  tickUpper: number
  liquidity: number

  tokenA: string,
  tokenB: string
}

type LogSwap = {
  poolId: number
  sender: string
  recipient: string
  tokenA: number
  tokenB: number
  sqrtPriceX64: number
  liquidity: number
  tick: number
}

type LogMint = {
  poolId: number,
  owner: string,
}

interface Action {
  trx_id: string,
  block_num: number,
  act: {
    name: string,
    data: LogMint | LogBurn
  }
}

const redisClient = createClient()
// const ONEDAY = 60 * 60 * 24 * 1000
// const WEEK = ONEDAY * 7

export async function newSwapAction(action: Action, network: { [key: string]: any }) {
  if (!redisClient.isOpen) redisClient.connect()

  // TODO Get timestamp
  const { trx_id, block_num, act: { name, data } } = action
  redisClient.publish('swap_action', JSON.stringify({ chain: network.name, name, trx_id, block_num, data }))
}
