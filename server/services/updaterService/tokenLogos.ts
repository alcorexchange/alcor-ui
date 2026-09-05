import axios from 'axios'
import { getRedis } from '../redis'

interface EosAirdropToken {
  chain: string
  account: string
  symbol: string
  logo: string
}

const LOGO_CACHE_TTL_MS = 1000 * 60 * 60
let lastFetchTime = 0

export async function updateEosAirdropLogos() {
  const now = Date.now()
  if (now - lastFetchTime < LOGO_CACHE_TTL_MS) return

  try {
    const { data } = await axios.get<EosAirdropToken[]>(
      'https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/tokens.json',
      { timeout: 10000 }
    )

    if (!Array.isArray(data) || data.length === 0) return

    const flat: string[] = []
    for (const token of data) {
      if (token.chain && token.symbol && token.account && token.logo) {
        const key = `${token.chain}:${token.symbol}:${token.account}`
        flat.push(key, token.logo)
      }
    }

    if (flat.length > 0) {
      const redis = getRedis()
      await redis.hSet('eos_airdrops_logos', flat as any)
      lastFetchTime = now
    }
  } catch (e) {
    console.error('Failed to fetch eos-airdrops tokens:', e)
  }
}

export function startTokenLogosUpdater() {
  updateEosAirdropLogos()
  setInterval(() => updateEosAirdropLogos(), LOGO_CACHE_TTL_MS)
}
