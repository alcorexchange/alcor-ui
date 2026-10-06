import { cacheSeconds } from 'route-cache'
import { Router } from 'express'
import { getRedis } from '../redis'

export const ibc = Router()


ibc.get('/wrap-lock-contracts', cacheSeconds(60 * 60, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const data = JSON.parse(await getRedis().get('IBC_WRAP_LOCK_CONTRACTS'))

  if (!data) return res.status(403).send('404 Not Found')

  res.json(data)
})
