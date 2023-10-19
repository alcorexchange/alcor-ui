import { cacheSeconds } from 'route-cache'
import { Router } from 'express'
import { getTokens } from '../../utils'

export const tokens = Router()

tokens.get('/tokens/:id', cacheSeconds(2, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name + '|' + req.params.id
}), async (req, res) => {
  const network: Network = req.app.get('network')

  const tokens = await getTokens(network.name)
  res.json(tokens.find(t => t.id == req.params.id))
})

tokens.get('/tokens', cacheSeconds(2, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')

  const tokens = await getTokens(network.name)
  res.json(tokens)
})
