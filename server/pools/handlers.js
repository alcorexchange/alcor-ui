import fetch from 'node-fetch'
import { JsonRpc } from 'eosjs'

import { Liquidity, Exchange } from '../models'

export async function newExchange(network, action) {
  const {
    trx_id,
    block_time,
    block_num,
    act: {
      data: {
        record: { pair_id, maker, quantity_in, quantity_out, pool1, pool2 }
      }
    }
  } = action

  await Exchange.create({
    chain: network.name,
    pair_id: parseInt(pair_id),
    trx_id,

    maker,
    quantity_in: parseFloat(quantity_in),
    quantity_out: parseFloat(quantity_out),

    pool1: parseFloat(pool1),
    pool2: parseFloat(pool2),

    time: block_time,
    block_num
  })
}

export async function newLiuqudity(network, action) {
  const {
    trx_id,
    block_time,
    block_num,
    act: {
      data: {
        record: { pair_id, lp_token, owner, liquidity1, liquidity2, pool1, pool2, supply }
      }
    }
  } = action

  await Liquidity.create({
    chain: network.name,
    pair_id: parseInt(pair_id),
    trx_id,

    owner,
    lp_token: parseFloat(lp_token),
    supply: parseFloat(supply),

    liquidity1: parseFloat(liquidity1),
    liquidity2: parseFloat(liquidity2),

    pool1: parseFloat(pool1),
    pool2: parseFloat(pool2),

    time: block_time,
    block_num
  })
}
