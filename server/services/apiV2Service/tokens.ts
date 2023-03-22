import { Router } from 'express'
import { getAllTokensWithPrices } from '../updaterService/prices'

export const tokens = Router()

tokens.get('/tokens', async (req, res) => {
  const network: Network = req.app.get('network')

  const tokens = await getAllTokensWithPrices(network)

  res.json(tokens)
})
