import { cacheSeconds } from 'route-cache'
import { Router } from 'express'
import { existsSync } from 'fs'
import { join } from 'path'
import { getTokens } from '../../utils'
import { getRedis } from '../redis'

export const tokens = Router()

tokens.get('/tokens/:id/logo', async (req, res) => {
  const network: Network = req.app.get('network')
  const id = req.params.id.toLowerCase()
  const [symbol, contract] = id.split('-')

  const iconPath = join(
    process.cwd(),
    'assets/tokens',
    network.name,
    `${symbol}_${contract}.png`
  )

  if (existsSync(iconPath)) {
    // Cache for 24 hours (browser + CDN)
    res.set('Cache-Control', 'public, max-age=86400')
    res.sendFile(iconPath)
  } else {
    res.status(404).send('Icon not found')
  }
})

tokens.get('/tokens/:id', cacheSeconds(2, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name + '|' + req.params.id
}), async (req, res) => {
  const network: Network = req.app.get('network')

  const tokens = await getTokens(network.name)
  const token = tokens.find(t => t.id == req.params.id.toLowerCase())

  // Add CMC_UCID
  const cmc_ucids = await getRedis().get('CMC_UCIDS')

  if (!token) return res.status(403).send('Token with this ID is not found')

  res.json(token)
})

tokens.get('/tokens', cacheSeconds(2, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')

  const tokens = await getTokens(network.name)
  res.json(tokens)
})
