import { Router } from 'express'
import { Match } from '../models'

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
