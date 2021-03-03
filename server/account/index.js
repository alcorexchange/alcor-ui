import { Router } from 'express'
import { Match, Liquidity } from '../models'

export const account = Router()

account.get('/:account/deals', async (req, res) => {
  const network = req.app.get('network')
  const { account } = req.params

  const history = await Match.aggregate([
    { $match: { chain: network.name, $or: [{ asker: account }, { bidder: account }] } },
    {
      $project: {
        time: 1,
        bid: 1,
        ask: 1,
        unit_price: 1,
        trx_id: 1,
        market: 1,
        type: { $cond: { if: { $eq: ['$bidder', account] }, then: 'buymatch', else: 'sellmatch' } }
      }
    },
    { $sort: { time: -1 } }
  ])

  res.json(history)
})

account.get('/:account/liquidity_positions', async (req, res) => {
  const network = req.app.get('network')
  const { account } = req.params

  const positions = await Liquidity.aggregate([
    { $match: { owner: account, chain: network.name } },
    {
      $group: {
        _id: '$pair_id',
        liquidity1: { $sum: '$liquidity1' },
        liquidity2: { $sum: '$liquidity2' }
      }
    }, { $project: { _id: 0, pair_id: '$_id', liquidity1: 1, liquidity2: 1 } }
  ]).allowDiskUse(true)

  res.json(positions)
})
