require('dotenv').config()

import { mongoConnect, initRedis } from '../../utils'
import { getSubscriber, getPublisher } from '../redis'
import { throttledPoolUpdate } from '.'

export async function connectAll() {
  await mongoConnect()
  await initRedis()
}

export async function main() {
  await connectAll()
  console.log('SwapService started!')

  getSubscriber().pSubscribe('chainAction:*:swap.alcor:*', action => {
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

      getPublisher().publish('account:update-positions', JSON.stringify(push))
    }
  })
}

// TODO Run as separate service
main()
