import axios from 'axios'

import { Market, Match, SwapPool } from '../../models'
import { getTokens } from '../../utils'
import { getRedis } from '../redis'
import { getScamLists } from '../apiV2Service/config'

const MAX_SANE_PRICE = 100000
const DEFAULT_MIN_POOL_BASE_LIQUIDITY_USD = 150
const DEFAULT_MARKET_PRICE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const DEFAULT_MIN_MARKET_DEAL_NOTIONAL_USD = 10

function positiveNumber(value: any, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

// USD liquidity on the reference (system/stable) side of a pool — used to weight price candidates.
function getReferenceLiquidityUSD(p: any, referenceId: string, system_token: string, systemPrice: number) {
  if (referenceId === system_token) {
    if (p.tokenA.id === system_token) return Number(p.tokenA.quantity || 0) * systemPrice
    if (p.tokenB.id === system_token) return Number(p.tokenB.quantity || 0) * systemPrice
    return 0
  }

  if (p.tokenA.id === referenceId) return Number(p.tokenA.quantity || 0)
  if (p.tokenB.id === referenceId) return Number(p.tokenB.quantity || 0)
  return 0
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
  if (network_name === 'xprtest') network_name = 'proton'

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

  const pools = await SwapPool.find({ chain: network.name }).lean()

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

  const rawPriceCandidatesByToken = new Map<string, Array<{
    usdPrice: number
    liquidityUSD: number
  }>>()
  const safePriceCandidatesByToken = new Map<string, Array<{
    usdPrice: number
    liquidityUSD: number
  }>>()
  const safePriceByToken = new Map<string, { usdPrice: number, systemPrice: number }>()

  for (const p of pools) {
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
      if (!Number.isFinite(usdPrice) || usdPrice <= 0) continue

      const liquidityUSD = getReferenceLiquidityUSD(p, referenceId, system_token, systemPrice)
      if (!Number.isFinite(liquidityUSD) || liquidityUSD <= 0) continue

      if (!rawPriceCandidatesByToken.has(tokenId)) rawPriceCandidatesByToken.set(tokenId, [])
      rawPriceCandidatesByToken.get(tokenId)?.push({ usdPrice, liquidityUSD })

      if (liquidityUSD >= minimumUSDAmount) {
        if (!safePriceCandidatesByToken.has(tokenId)) safePriceCandidatesByToken.set(tokenId, [])
        safePriceCandidatesByToken.get(tokenId)?.push({ usdPrice, liquidityUSD })
      }
    }
  }

  for (const t of tokens) {
    if (t.id == system_token) {
      t.system_price = 1
      t.usd_price = systemPrice
      safePriceByToken.set(t.id, { usdPrice: systemPrice, systemPrice: 1 })
      continue
    }

    if (stableTokenSet.has(t.id)) {
      t.system_price = systemPrice > 0 ? (1 / systemPrice) : 0
      t.usd_price = 1
      safePriceByToken.set(t.id, { usdPrice: 1, systemPrice: t.system_price })
      continue
    }

    if (isScam(t.id, t.contract)) {
      t.system_price = 0
      t.usd_price = 0
      continue
    }

    t.usd_price = 0.0
    t.system_price = 0.0

    const rawCandidates = rawPriceCandidatesByToken.get(t.id) || []
    if (rawCandidates.length > 0) {
      const usdPrice = weightedMedianUsdPrice(rawCandidates)
      t.usd_price = usdPrice
      t.system_price = systemPrice > 0 ? usdPrice / systemPrice : 0
    }

    const safeCandidates = safePriceCandidatesByToken.get(t.id) || []
    if (safeCandidates.length > 0) {
      const safeUsdPrice = weightedMedianUsdPrice(safeCandidates)
      if (Number.isFinite(safeUsdPrice) && safeUsdPrice > 0) {
        safePriceByToken.set(t.id, {
          usdPrice: safeUsdPrice,
          systemPrice: systemPrice > 0 ? safeUsdPrice / systemPrice : 0
        })
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
          safePriceByToken.set(t.id, { usdPrice: t.usd_price, systemPrice: t.system_price })
        }
      }
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
    const safeCandidate = safePriceByToken.get(t.id)
    const safeUsdCandidate = Number.isFinite(Number(safeCandidate?.usdPrice)) ? Number(safeCandidate?.usdPrice) : 0
    const safeSystemCandidate = Number.isFinite(Number(safeCandidate?.systemPrice)) ? Number(safeCandidate?.systemPrice) : 0
    const isSaneUsdPrice = safeUsdCandidate > 0 && safeUsdCandidate <= MAX_SANE_PRICE

    t.score = score
    t.is_scam = scam
    t.is_trusted = trusted
    t.safe_usd_price = trusted && isSaneUsdPrice ? safeUsdCandidate : 0
    t.safe_system_price = trusted && isSaneUsdPrice ? safeSystemCandidate : 0
  }

  return tokens
}

// Build a single token (metadata + prices) on the fly directly from its Mongo pools/markets.
// Used to serve analytics for a freshly created token that hasn't landed in the 5-minute
// `{chain}_token_prices` cache yet. `pools`/`markets` must already be filtered to those
// containing `tokenId`. Returns a token object shaped like makeAllTokensWithPrices entries,
// or null when no pool/market references the token.
export async function buildOnDemandToken(network: Network, tokenId: string, pools: any[], markets: any[]) {
  let meta: { contract: string, decimals: number, symbol: string, id: string } | null = null

  for (const p of pools) {
    if (p.tokenA?.id === tokenId) { meta = { contract: p.tokenA.contract, decimals: p.tokenA.decimals, symbol: p.tokenA.symbol, id: p.tokenA.id }; break }
    if (p.tokenB?.id === tokenId) { meta = { contract: p.tokenB.contract, decimals: p.tokenB.decimals, symbol: p.tokenB.symbol, id: p.tokenB.id }; break }
  }

  if (!meta) {
    for (const m of markets) {
      if (m.base_token?.id === tokenId) { meta = { contract: m.base_token.contract, decimals: m.base_token.symbol.precision, symbol: m.base_token.symbol.name, id: m.base_token.id }; break }
      if (m.quote_token?.id === tokenId) { meta = { contract: m.quote_token.contract, decimals: m.quote_token.symbol.precision, symbol: m.quote_token.symbol.name, id: m.quote_token.id }; break }
    }
  }

  if (!meta) return null

  const { baseToken, USD_TOKEN } = network
  const USDT_TOKEN = (network as any).USDT_TOKEN || null

  const system_token = (baseToken.symbol + '-' + baseToken.contract).toLowerCase()
  const systemPrice = parseFloat(await getRedis().get(`${network.name}_price`)) || 0
  const trustedScoreMin = positiveNumber(process.env.TOKEN_TRUSTED_SCORE_MIN, 40)
  const scores = JSON.parse(await getRedis().get(`${network.name}_token_scores`) || '{}')
  const { scam_contracts, scam_tokens } = await getScamLists(network)
  const isScam = (id: string, contract: string) => scam_tokens.has(id) || scam_contracts.has(contract)
  const stableTokenSet = new Set([USD_TOKEN, USDT_TOKEN].filter(Boolean))
  const referenceTokenSet = new Set([system_token, ...stableTokenSet])
  const minimumUSDAmount = positiveNumber(process.env.MIN_POOL_BASE_LIQUIDITY_USD, DEFAULT_MIN_POOL_BASE_LIQUIDITY_USD)
  const marketPriceMaxAgeMs = positiveNumber(process.env.MARKET_PRICE_MAX_AGE_MS, DEFAULT_MARKET_PRICE_MAX_AGE_MS)
  const minimumMarketDealNotionalUsd = positiveNumber(process.env.MIN_MARKET_DEAL_NOTIONAL_USD, DEFAULT_MIN_MARKET_DEAL_NOTIONAL_USD)

  const token: any = { ...meta, usd_price: 0.0, system_price: 0.0 }
  let safePrice: { usdPrice: number, systemPrice: number } | null = null

  if (meta.id === system_token) {
    token.usd_price = systemPrice
    token.system_price = 1
    safePrice = { usdPrice: systemPrice, systemPrice: 1 }
  } else if (stableTokenSet.has(meta.id)) {
    token.usd_price = 1
    token.system_price = systemPrice > 0 ? 1 / systemPrice : 0
    safePrice = { usdPrice: 1, systemPrice: token.system_price }
  } else if (!isScam(meta.id, meta.contract)) {
    const rawCandidates: Array<{ usdPrice: number, liquidityUSD: number }> = []
    const safeCandidates: Array<{ usdPrice: number, liquidityUSD: number }> = []

    for (const p of pools) {
      if (isScam(p.tokenA.id, p.tokenA.contract) || isScam(p.tokenB.id, p.tokenB.contract)) continue

      const referenceOnA = referenceTokenSet.has(p.tokenA.id)
      const referenceOnB = referenceTokenSet.has(p.tokenB.id)
      if (!referenceOnA && !referenceOnB) continue

      const referenceId = referenceOnA ? p.tokenA.id : p.tokenB.id
      const pricedTokenId = referenceOnA ? p.tokenB.id : p.tokenA.id
      if (pricedTokenId !== meta.id) continue

      const rawPrice = Number(referenceOnA ? p.priceB : p.priceA)
      if (!Number.isFinite(rawPrice) || rawPrice <= 0) continue

      const referenceUsdPrice = referenceId === system_token ? systemPrice : 1
      if (!Number.isFinite(referenceUsdPrice) || referenceUsdPrice <= 0) continue

      const usdPrice = rawPrice * referenceUsdPrice
      if (!Number.isFinite(usdPrice) || usdPrice <= 0) continue

      const liquidityUSD = getReferenceLiquidityUSD(p, referenceId, system_token, systemPrice)
      if (!Number.isFinite(liquidityUSD) || liquidityUSD <= 0) continue

      rawCandidates.push({ usdPrice, liquidityUSD })
      if (liquidityUSD >= minimumUSDAmount) safeCandidates.push({ usdPrice, liquidityUSD })
    }

    if (rawCandidates.length > 0) {
      const usdPrice = weightedMedianUsdPrice(rawCandidates)
      token.usd_price = usdPrice
      token.system_price = systemPrice > 0 ? usdPrice / systemPrice : 0
    }

    if (safeCandidates.length > 0) {
      const safeUsdPrice = weightedMedianUsdPrice(safeCandidates)
      if (Number.isFinite(safeUsdPrice) && safeUsdPrice > 0) {
        safePrice = { usdPrice: safeUsdPrice, systemPrice: systemPrice > 0 ? safeUsdPrice / systemPrice : 0 }
      }
    }

    // Spot-market fallback when pools gave no price: use the last deal vs the system token.
    if (token.usd_price === 0) {
      const systemMarket = markets.find((m) => m.base_token?.id === system_token)
      if (systemMarket) {
        const last_deal = await Match.findOne({ chain: network.name, market: systemMarket.id }, {}, { sort: { time: -1 } })
        if (last_deal) {
          const unitPrice = Number(last_deal.unit_price)
          const ageMs = Date.now() - new Date(last_deal.time).getTime()
          const dealNotionalUsd = Number(last_deal.ask || 0) * systemPrice
          if (
            Number.isFinite(unitPrice) && unitPrice > 0 &&
            ageMs >= 0 && ageMs <= marketPriceMaxAgeMs &&
            dealNotionalUsd >= minimumMarketDealNotionalUsd
          ) {
            token.system_price = unitPrice
            token.usd_price = unitPrice * systemPrice
            safePrice = { usdPrice: token.usd_price, systemPrice: token.system_price }
          }
        }
      }
    }
  }

  const score = Number(scores?.[meta.id]?.score || 0)
  const scam = isScam(meta.id, meta.contract)
  const isBaseOrUsd = meta.id === system_token || stableTokenSet.has(meta.id)
  const trusted = !scam && (isBaseOrUsd || score > trustedScoreMin)

  if (scam) {
    token.usd_price = 0
    token.system_price = 0
  }

  const safeUsd = Number.isFinite(Number(safePrice?.usdPrice)) ? Number(safePrice?.usdPrice) : 0
  const safeSystem = Number.isFinite(Number(safePrice?.systemPrice)) ? Number(safePrice?.systemPrice) : 0
  const isSaneUsdPrice = safeUsd > 0 && safeUsd <= MAX_SANE_PRICE

  token.score = score
  token.is_scam = scam
  token.is_trusted = trusted
  token.safe_usd_price = trusted && isSaneUsdPrice ? safeUsd : 0
  token.safe_system_price = trusted && isSaneUsdPrice ? safeSystem : 0

  return token
}
