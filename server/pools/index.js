import { Router } from 'express'
import { Exchange } from '../models'

import { newExchange, newLiuqudity, newPair } from './handlers'

export const pools = Router()
pools.get('/:pair_id/line_chart', async (req, res) => {
  const network = req.app.get('network')
  const { pair_id } = req.params

  const $divide = req.query.reverse == 'true' ? ['$pool1', '$pool2'] : ['$pool2', '$pool1']

  const prices = await Exchange.aggregate([
    { $match: { chain: network.name, pair_id: parseInt(pair_id) } },
    { $project: { _id: 0, time: 1, price: { $divide } } },
    { $project: { x: { $toLong: '$time' }, y: { $round: ['$price', 4] } } },
    { $sort: { time: 1 } }
  ])

  res.json(prices)
})


export async function newPoolsAction(action, network, app) {
  console.log('newPoolsAction', action.act.name)
  const { act: { name, data } } = action

  const io = app.get('io')
  const chain = network.name

  if (name == 'inittoken') {
    await newPair(network, action)
  }

  if (name == 'liquiditylog') {
    await newLiuqudity(network, action)
  }

  if (name == 'exchangelog') {
    await newExchange(network, action)
  }
}
