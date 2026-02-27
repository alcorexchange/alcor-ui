import axios from 'axios'

import { Market, Match, SwapPool } from '../../models'
import { getTokens } from '../../utils'
import { getRedis } from '../redis'
import { getScamLists } from '../apiV2Service/config'

const MAX_SANE_PRICE = 100000
const DEFAULT_MIN_POOL_BASE_LIQUIDITY_USD = 10
const DEFAULT_MARKET_PRICE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const DEFAULT_MIN_MARKET_DEAL_NOTIONAL_USD = 10

function positiveNumber(value: any, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function weightedMedianUsdPrice(candidates: Array<{ usdPrice: number, liquidityUSD: number }>) {
  const valid = candidates
    .filter((c) => Number.isFinite(c.usdPrice) && c.usdPrice > 0 && Number.isFinite(c.liquidityUSD) && c.liquidityUSD > 0)
    .sort((a, b) => a.usdPrice - b.usdPrice)

  if (valid.length === 0) return 0

  const totalWeight = valid.reduce((sum, c) => sum + c.liquidityUSD, 0)
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) return 0

  let cumulative = 0
  for (const c of valid) {
    cumulative += c.liquidityUSD
    if (cumulative >= totalWeight / 2) return c.usdPrice
  }

  return valid[valid.length - 1].usdPrice
}

export async function updateCMSucid() {
  try {
    const { data: { data } } = await axios.get(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?CMC_PRO_API_KEY=UNIFIED-CRYPTOASSET-INDEX'
    )

    await getRedis().set('CMC_UCIDS', JSON.stringify(data))
    console.log('Updated CMC_UCIDS')
  } catch (e: any) {
    console.error('CMS ucid PRICE UPDATE FAILED!', e.message || e)
  }
}

export async function updateSystemPrice(network: Network) {
  let network_name = network.name

  if (network_name === 'waxtest') network_name = 'wax'

  try {
    const { data } = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: network_name,
          vs_currencies: 'usd',
        },
      }
    )

    const price = data[network_name].usd
    await getRedis().set(`${network.name}_price`, String(price))
    console.log(`Updated ${network.name} price: `, price)
  } catch (e: any) {
    if (e.response?.status === 429) {
      console.log(`[${network.name}] CoinGecko rate limit (429)`)
    } else {
      console.error('SYSTEM PRICE UPDATE FAILED!', network.name, e.message || e)
    }
  }
}

// system token and their USD prices
export async function updateTokensPrices(network: Network) {
  const tokens = await makeAllTokensWithPrices(network)

  const cmc_ucids = JSON.parse((await getRedis().get('CMC_UCIDS')) || '[]')

  // Построить Map для O(1) поиска вместо O(n) find()
  const cmcBySlug = new Map()
  const cmcBySymbol = new Map()
  for (const c of cmc_ucids) {
    cmcBySlug.set(c.slug, c)
    cmcBySymbol.set(c.symbol, c)
  }

  tokens.forEach(t => {
    const cmc_id = cmcBySlug.get(t.symbol.toLowerCase()) || cmcBySymbol.get(t.symbol)

    if (cmc_id && network.GLOBAL_TOKENS.includes(t.id)) t.cmc_id = cmc_id.id
  })

  await getRedis().set(`${network.name}_token_prices`, JSON.stringify(tokens))
  console.log(network.name, 'token prices & cmc_ucids updated!')
}

export async function makeAllTokensWithPrices(network: Network) {
  // Based on swap only, right now
  const tokens = []
  const { baseToken, USD_TOKEN } = network
  const USDT_TOKEN = (network as any).USDT_TOKEN || null

  const system_token = (baseToken.symbol + '-' + baseToken.contract).toLowerCase()
  const systemPrice = parseFloat(await getRedis().get(`${network.name}_price`)) || 0
  const trustedScoreMin = positiveNumber(process.env.TOKEN_TRUSTED_SCORE_MIN, 40)
  const scores = JSON.parse(await getRedis().get(`${network.name}_token_scores`) || '{}')
  const { scam_contracts, scam_tokens } = await getScamLists(network)
  const isScam = (id: string, contract: string) => scam_tokens.has(id) || scam_contracts.has(contract)
  const stableTokenIds = Array.from(new Set([USD_TOKEN, USDT_TOKEN].filter(Boolean)))
  const stableTokenSet = new Set(stableTokenIds)
  const referenceTokenIds = [system_token, ...stableTokenIds]
  const referenceTokenSet = new Set(referenceTokenIds)

  // Price from pool is accepted only when reference side (system/stable) has enough liquidity.
  const minimumUSDAmount = positiveNumber(process.env.MIN_POOL_BASE_LIQUIDITY_USD, DEFAULT_MIN_POOL_BASE_LIQUIDITY_USD)
  const marketPriceMaxAgeMs = positiveNumber(process.env.MARKET_PRICE_MAX_AGE_MS, DEFAULT_MARKET_PRICE_MAX_AGE_MS)
  const minimumMarketDealNotionalUsd = positiveNumber(
    process.env.MIN_MARKET_DEAL_NOTIONAL_USD,
    DEFAULT_MIN_MARKET_DEAL_NOTIONAL_USD
  )

  const getReferenceLiquidityUSD = (p, referenceId: string) => {
    if (referenceId === system_token) {
      if (p.tokenA.id === system_token) return Number(p.tokenA.quantity || 0) * systemPrice
      if (p.tokenB.id === system_token) return Number(p.tokenB.quantity || 0) * systemPrice
      return 0
    }

    if (p.tokenA.id === referenceId) return Number(p.tokenA.quantity || 0)
    if (p.tokenB.id === referenceId) return Number(p.tokenB.quantity || 0)
    return 0
  }

  const poolHasEnoughReferenceLiquidity = (p) => {
    for (const referenceId of referenceTokenIds) {
      const liquidityUSD = getReferenceLiquidityUSD(p, referenceId)
      if (liquidityUSD >= minimumUSDAmount) return true
    }
    return false
  }

  const pools = await SwapPool.find({ chain: network.name }).lean()
  const enough_liquidity_pools = pools.filter(poolHasEnoughReferenceLiquidity)

  // Sorting by more ticks means more liquidity
  // pools.sort((a, b) => {
  //   return b.tickDataProvider.ticks.length - a.tickDataProvider.ticks.length
  // })

  const tokenIds = new Set(tokens.map(t => t.id))
  for (const p of pools) {
    const tokenA = { contract: p.tokenA.contract, decimals: p.tokenA.decimals, symbol: p.tokenA.symbol, id: p.tokenA.id }
    const tokenB = { contract: p.tokenB.contract, decimals: p.tokenB.decimals, symbol: p.tokenB.symbol, id: p.tokenB.id }
    if (!tokenIds.has(tokenA.id)) {
      tokens.push(tokenA)
      tokenIds.add(tokenA.id)
    }
    if (!tokenIds.has(tokenB.id)) {
      tokens.push(tokenB)
      tokenIds.add(tokenB.id)
    }
  }

  const priceCandidatesByToken = new Map<string, Array<{
    usdPrice: number
    liquidityUSD: number
  }>>()

  for (const p of enough_liquidity_pools) {
    if (isScam(p.tokenA.id, p.tokenA.contract) || isScam(p.tokenB.id, p.tokenB.contract)) continue
    if (!referenceTokenSet.has(p.tokenA.id) && !referenceTokenSet.has(p.tokenB.id)) continue

    const tokenAId = p.tokenA.id
    const tokenBId = p.tokenB.id
    const refsInPool = []
    if (referenceTokenSet.has(tokenAId)) refsInPool.push(tokenAId)
    if (referenceTokenSet.has(tokenBId)) refsInPool.push(tokenBId)

    for (const referenceId of refsInPool) {
      const referenceOnA = tokenAId === referenceId
      const tokenId = referenceOnA ? tokenBId : tokenAId
      if (referenceTokenSet.has(tokenId)) continue

      const rawPrice = Number(referenceOnA ? p.priceB : p.priceA)
      if (!Number.isFinite(rawPrice) || rawPrice <= 0) continue

      const referenceUsdPrice = referenceId === system_token ? systemPrice : 1
      if (!Number.isFinite(referenceUsdPrice) || referenceUsdPrice <= 0) continue

      const usdPrice = rawPrice * referenceUsdPrice
      if (!Number.isFinite(usdPrice) || usdPrice <= 0 || usdPrice > MAX_SANE_PRICE) continue

      const liquidityUSD = getReferenceLiquidityUSD(p, referenceId)
      if (!Number.isFinite(liquidityUSD) || liquidityUSD < minimumUSDAmount) continue

      if (!priceCandidatesByToken.has(tokenId)) priceCandidatesByToken.set(tokenId, [])
      priceCandidatesByToken.get(tokenId)?.push({ usdPrice, liquidityUSD })
    }
  }

  for (const t of tokens) {
    if (t.id == system_token) {
      t.system_price = 1
      t.usd_price = systemPrice
      continue
    }

    if (stableTokenSet.has(t.id)) {
      t.system_price = systemPrice > 0 ? (1 / systemPrice) : 0
      t.usd_price = 1
      continue
    }

    if (isScam(t.id, t.contract)) {
      t.system_price = 0
      t.usd_price = 0
      continue
    }

    t.usd_price = 0.0
    t.system_price = 0.0

    const candidates = priceCandidatesByToken.get(t.id) || []
    if (candidates.length > 0) {
      const usdPrice = weightedMedianUsdPrice(candidates)
      t.usd_price = usdPrice
      t.system_price = systemPrice > 0 ? usdPrice / systemPrice : 0

      // Cap unrealistic prices (likely from low liquidity pools)
      if (t.usd_price > MAX_SANE_PRICE) {
        t.usd_price = 0
        t.system_price = 0
      }
    }

    // if (t.id.includes('pasta-aquascapeart')) {
    //   console.log(t)
    //   console.log(pool)
    // }
  }

  const market_tokens = []
  const markets = await Market.find({ chain: network.name })

  const marketTokenIds = new Set()
  for (const m of markets) {
    const { base_token, quote_token } = m
    if (!tokenIds.has(base_token.id) && !marketTokenIds.has(base_token.id)) {
      market_tokens.push([base_token, m])
      marketTokenIds.add(base_token.id)
    }
    if (!tokenIds.has(quote_token.id) && !marketTokenIds.has(quote_token.id)) {
      market_tokens.push([quote_token, m])
      marketTokenIds.add(quote_token.id)
    }
  }

  // fetching prices
  for (const i of market_tokens) {
    const [token, market] = i

    const t = {
      contract: token.contract,
      decimals: token.symbol.precision,
      symbol: token.symbol.name,
      id: token.id,
      usd_price: 0.0,
      system_price: 0.0
    }

    if (market.base_token.id == system_token) {
      const last_deal = await Match.findOne({ chain: network.name, market: market.id }, {}, { sort: { time: -1 } })

      if (last_deal) {
        const unitPrice = Number(last_deal.unit_price)
        const dealTime = new Date(last_deal.time).getTime()
        const ageMs = Date.now() - dealTime
        const systemAmount = Number(last_deal.ask || 0)
        const dealNotionalUsd = systemAmount * systemPrice

        if (
          Number.isFinite(unitPrice) &&
          Number.isFinite(dealTime) &&
          ageMs >= 0 &&
          ageMs <= marketPriceMaxAgeMs &&
          Number.isFinite(dealNotionalUsd) &&
          dealNotionalUsd >= minimumMarketDealNotionalUsd
        ) {
          t.system_price = unitPrice
          t.usd_price = t.system_price * systemPrice
        }
      }
    }

    if (t.usd_price > MAX_SANE_PRICE) {
      t.usd_price = 0
      t.system_price = 0
    }

    tokens.push(t)
  }

  for (const t of tokens) {
    const score = Number(scores?.[t.id]?.score || 0)
    const scam = isScam(t.id, t.contract)
    const isBaseOrUsd = t.id === system_token || stableTokenSet.has(t.id)
    const trusted = !scam && (isBaseOrUsd || score > trustedScoreMin)

    if (scam) {
      t.usd_price = 0
      t.system_price = 0
    }

    const usdPrice = Number.isFinite(Number(t.usd_price)) ? Number(t.usd_price) : 0
    const systemTokenPrice = Number.isFinite(Number(t.system_price)) ? Number(t.system_price) : 0

    t.score = score
    t.is_scam = scam
    t.is_trusted = trusted
    t.safe_usd_price = trusted ? usdPrice : 0
    t.safe_system_price = trusted ? systemTokenPrice : 0
  }

  return tokens
}
