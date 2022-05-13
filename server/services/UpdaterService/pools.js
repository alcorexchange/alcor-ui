import fetch from 'node-fetch'
import { JsonRpc } from 'eosjs'

import { Liquidity, Exchange, PoolPair, PoolChartPoint } from '../../models'

export async function newPoolsAction(action, network) {
  if (action.act.data == null) {
    console.log('Invalid action in pools', action)
    return
  }

  const { act: { name, data: { record } } } = action

  if (['exchangelog', 'liquiditylog'].includes(name)) {
    const last_point = await PoolChartPoint.findOne({ chain: network.name, pool: record.pair_id }, {}, { sort: { time: -1 } })

    // Sptit by one hour
    const resolution = 60 * 60 // One hour
    if (last_point && Math.floor(last_point.time / 1000 / resolution) == Math.floor(new Date(action.block_time) / 1000 / resolution)) {
      if (name == 'exchangelog') {
        const { pool1, pool2, quantity_in, quantity_out } = record

        const zeroForOne = pool1.split(' ')[1] == quantity_in.split(' ')[1]

        last_point.price = parseFloat(pool2) / parseFloat(pool1)
        last_point.price_r = parseFloat(pool1) / parseFloat(pool2)

        last_point.volume1 += zeroForOne ? parseFloat(quantity_in) : parseFloat(quantity_out)
        last_point.volume2 += zeroForOne ? parseFloat(quantity_out) : parseFloat(quantity_in)

        last_point.liquidity1 = parseFloat(pool1)
        last_point.liquidity2 = parseFloat(pool2)
      } else {
        const { pool1, pool2 } = record

        last_point.liquidity1 = parseFloat(pool1)
        last_point.liquidity2 = parseFloat(pool2)
      }

      last_point.save()
    } else {
      const { pool1, pool2, quantity_in, quantity_out } = record

      if (name == 'exchangelog') {
        const zeroForOne = pool1.split(' ')[1] == quantity_in.split(' ')[1]

        await PoolChartPoint.create({
          chain: network.name,
          pool: record.pair_id,
          time: action.block_time,

          price: parseFloat(pool2) / parseFloat(pool1),
          price_r: parseFloat(pool1) / parseFloat(pool2),

          volume1: zeroForOne ? parseFloat(quantity_in) : parseFloat(quantity_out),
          volume2: zeroForOne ? parseFloat(quantity_out) : parseFloat(quantity_in),

          liquidity1: parseFloat(pool1),
          liquidity2: parseFloat(pool2)
        })
      }
    }
  }

  if (name == 'liquiditylog') {
    await newLiuqudity(network, action)
  }

  if (name == 'exchangelog') {
    await newExchange(network, action)
  }

  if (name == 'transfer') {
    //  && account == network.pools.contract
    //return

    // TODO Тут создаем две записи на ликвидность, одна отнимает у того кто отправил, другая прибавляет тому кому
    // отправили
    // как понять сколько ликвидности пользователь потерял ?
    //
    //

    //console.log('.........................transfer...', action)
  }

  //io.to(`pools:${network.name}`).emit('update_pair', record)
}

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
