import { cacheSeconds } from 'route-cache'
import { Router } from 'express'
import { existsSync } from 'fs'
import { join } from 'path'
import axios from 'axios'
import { getTokens } from '../../utils'
import { getRedis } from '../redis'
import { getScamLists } from './config'

export const tokens = Router()

// Eos-airdrops token logo cache
interface EosAirdropToken {
  chain: string
  account: string
  symbol: string
  logo: string
}

// Map: "chain:symbol:contract" -> logo URL
let eosAirdropLogosMap: Map<string, string> = new Map()
let lastFetchTime = 0
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

async function getEosAirdropLogo(chain: string, symbol: string, contract: string): Promise<string | null> {
  const now = Date.now()

  // Refresh cache if expired or empty
  if (eosAirdropLogosMap.size === 0 || now - lastFetchTime > CACHE_TTL) {
    try {
      const { data } = await axios.get<EosAirdropToken[]>(
        'https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/tokens.json',
        { timeout: 10000 }
      )

      if (Array.isArray(data)) {
        eosAirdropLogosMap = new Map()
        for (const token of data) {
          if (token.chain && token.symbol && token.account && token.logo) {
            const key = `${token.chain}:${token.symbol}:${token.account}`
            eosAirdropLogosMap.set(key, token.logo)
          }
        }
        lastFetchTime = now
      }
    } catch (e) {
      console.error('Failed to fetch eos-airdrops tokens:', e)
    }
  }

  const key = `${chain}:${symbol.toUpperCase()}:${contract}`
  return eosAirdropLogosMap.get(key) || null
}

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
    res.set('Cache-Control', 'public, max-age=86400')
    res.sendFile(iconPath)
    return
  }

  // Fallback to eos-airdrops
  const externalLogo = await getEosAirdropLogo(network.name, symbol, contract)
  if (externalLogo) {
    res.set('Cache-Control', 'public, max-age=86400')
    res.redirect(301, externalLogo)
    return
  }

  res.status(404).send('Icon not found')
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

  const scores = JSON.parse(await getRedis().get(`${network.name}_token_scores`) || '{}')
  const score = scores?.[token.id]?.score ?? 0

  res.json({ ...token, score })
})

tokens.get('/tokens/:id/score', cacheSeconds(2, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name + '|' + req.params.id
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const tokenId = req.params.id.toLowerCase()

  const scores = JSON.parse(await getRedis().get(`${network.name}_token_scores`) || '{}')
  const scoreInfo = scores?.[tokenId]

  if (!scoreInfo) return res.json({ score: 0 })

  res.json(scoreInfo)
})

tokens.get('/tokens', cacheSeconds(2, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const hide_scam = req.query.hide_scam === 'true'

  let tokens = await getTokens(network.name)

  if (hide_scam) {
    const { scam_contracts, scam_tokens } = await getScamLists(network)
    tokens = tokens.filter(t => !scam_contracts.has(t.contract) && !scam_tokens.has(t.id))
  }

  const scores = JSON.parse(await getRedis().get(`${network.name}_token_scores`) || '{}')
  const tokensWithScore = tokens.map(t => ({ ...t, score: scores?.[t.id]?.score ?? 0 }))

  res.json(tokensWithScore)
})
