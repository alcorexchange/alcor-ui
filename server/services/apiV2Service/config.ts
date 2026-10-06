import { Router, Request, Response } from 'express'
import { getRedis } from '../redis'

export const configRouter = Router()

export async function getScamLists(network: Network): Promise<{ scam_contracts: Set<string>, scam_tokens: Set<string> }> {
  const staticContracts = network.SCAM_CONTRACTS || []
  const staticTokens = network.SCAM_TOKENS || []

  try {
    const redis = getRedis()

    const [dynamicContracts, dynamicTokens] = await Promise.all([
      redis.sMembers(`scam_contracts_${network.name}`).catch(() => []),
      redis.sMembers(`scam_tokens_${network.name}`).catch(() => [])
    ])

    return {
      scam_contracts: new Set([...staticContracts, ...dynamicContracts]),
      scam_tokens: new Set([...staticTokens, ...dynamicTokens])
    }
  } catch (e) {
    console.error('Redis error, returning static lists only:', e)
    return {
      scam_contracts: new Set(staticContracts),
      scam_tokens: new Set(staticTokens)
    }
  }
}

configRouter.get('/scam-lists', async (req: Request, res: Response) => {
  const network: Network = req.app.get('network')
  const { scam_contracts, scam_tokens } = await getScamLists(network)

  res.json({
    scam_contracts: [...scam_contracts],
    scam_tokens: [...scam_tokens]
  })
})
