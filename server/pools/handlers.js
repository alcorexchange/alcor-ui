import fetch from 'node-fetch'
import { JsonRpc } from 'eosjs'

import { Liquidity, Exchange, PoolPair } from '../models'

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

  if (lp_token == supply) {
    const rpc = new JsonRpc(`${network.protocol}://${network.host}:${network.port}`, { fetch })

    const { rows: [pair] } = await rpc.get_table_rows({
      code: network.pools.contract,
      scope: network.pools.contract,
      table: 'pairs',
      lower_bound: pair_id,
      limit: 1
    })

    if (!pair || pair.id != pair_id) {
      console.log('ERR: Wrong pair_id, while add new PoolPair')
      return
    }

    // New pool are created
    PoolPair.create({
      pair_id,

      pool1: {
        contract: pair.pool1.contract,
        symbol: pair.pool1.quantity.split(' ')[1]
      },

      pool2: {
        contract: pair.pool2.contract,
        symbol: pair.pool2.quantity.split(' ')[1]
      }
    })
  }

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
