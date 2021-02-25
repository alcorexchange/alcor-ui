import { Router } from 'express'
import { Match, Liquidity } from '../models'

export const account = Router()

account.get('/:account/deals', async (req, res) => {
  const network = req.app.get('network')
  const { account } = req.params

  const history = await Match.find({
    chain: network.name,
    $or: [{ asker: account }, { bidder: account }]
  }).select('time bid ask unit_price type trx_id market')

  res.json(history)
})

account.get('/:account/liquidity_positions', async (req, res) => {
  const network = req.app.get('network')
  const { account } = req.params

  const positions = await Liquidity.aggregate([
    { $match: { pair_id: 0, owner: account, chain: network.name } },
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
