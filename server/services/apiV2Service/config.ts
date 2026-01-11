import { Router, Request, Response } from 'express'
import { getRedis } from '../redis'

export const configRouter = Router()

// Публичный endpoint - возвращает merged scam списки (static + dynamic)
configRouter.get('/scam-lists', async (req: Request, res: Response) => {
  const network: Network = req.app.get('network')

  // Статические списки из config.js (доступны через network)
  const staticContracts = network.SCAM_CONTRACTS || []
  const staticTokens = network.SCAM_TOKENS || []

  try {
    const redis = getRedis()

    // Получаем динамические списки из Redis
    const [dynamicContracts, dynamicTokens] = await Promise.all([
      redis.sMembers(`scam_contracts_${network.name}`).catch(() => []),
      redis.sMembers(`scam_tokens_${network.name}`).catch(() => [])
    ])

    // Merge и deduplicate
    const scam_contracts = [...new Set([...staticContracts, ...dynamicContracts])]
    const scam_tokens = [...new Set([...staticTokens, ...dynamicTokens])]

    res.json({ scam_contracts, scam_tokens })
  } catch (e) {
    // Fallback - если Redis недоступен, возвращаем только статические
    console.error('Redis error, returning static lists only:', e)
    res.json({
      scam_contracts: staticContracts,
      scam_tokens: staticTokens
    })
  }
})
