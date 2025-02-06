require('dotenv').config()

import mongoose from 'mongoose'
import { createClient } from 'redis'
import { mongoConnect } from '../../utils'
import { throttledPoolUpdate } from '.'

const redis = createClient()
const subscriber = redis.duplicate()
const publisher = redis.duplicate()

export async function connectAll() {
  await mongoConnect()

  // Redis
  if (!redis.isOpen) {
    await redis.connect()
    await subscriber.connect()
    await publisher.connect()
  }
}

export async function main() {
  await connectAll()
  console.log('SwapService started!')

  subscriber.pSubscribe('chainAction:*:swap.alcor:*', action => {
    const { chain, name, data } = JSON.parse(action)

  // if (['logmint', 'logburn', 'logswap', 'logcollect'].includes(name)) {

    if (['logmint', 'logburn', 'logswap', 'logcollect', 'transferpos', 'logpool'].includes(name)) {
      console.log('subscribe pool update', { chain, name, poolId: data.poolId })
      throttledPoolUpdate(chain, Number(data.poolId))
    }

    if (['logmint', 'logburn', 'logcollect'].includes(name)) {
      const { posId, owner } = data
      const push = { chain, account: owner, positions: [posId] }
      console.log('subscribe posigions update', push)

      publisher.publish('account:update-positions', JSON.stringify(push))
    }
  })
}

// TODO Run as separate service
main()
