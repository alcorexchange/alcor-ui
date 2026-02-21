import axios from 'axios'

import { Market, Match, SwapPool } from '../../models'
import { getTokens } from '../../utils'
import { getRedis } from '../redis'

const MAX_SANE_PRICE = 100000
const DEFAULT_MIN_POOL_BASE_LIQUIDITY_USD = 100
const DEFAULT_MARKET_PRICE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const DEFAULT_MIN_MARKET_DEAL_NOTIONAL_USD = 10

function positiveNumber(value: any, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
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

  const system_token = (baseToken.symbol + '-' + baseToken.contract).toLowerCase()
  const systemPrice = parseFloat(await getRedis().get(`${network.name}_price`)) || 0

  // Price from pool is accepted only when reference side (system/USD) has enough liquidity.
  const minimumUSDAmount = positiveNumber(process.env.MIN_POOL_BASE_LIQUIDITY_USD, DEFAULT_MIN_POOL_BASE_LIQUIDITY_USD)
  const minimumSystemAmount = systemPrice > 0 ? (1 / systemPrice) * minimumUSDAmount : Number.POSITIVE_INFINITY
  const marketPriceMaxAgeMs = positiveNumber(process.env.MARKET_PRICE_MAX_AGE_MS, DEFAULT_MARKET_PRICE_MAX_AGE_MS)
  const minimumMarketDealNotionalUsd = positiveNumber(
    process.env.MIN_MARKET_DEAL_NOTIONAL_USD,
    DEFAULT_MIN_MARKET_DEAL_NOTIONAL_USD
  )

  const isSystemOrUsdPool = (p) =>
    p.tokenA.id === system_token ||
    p.tokenB.id === system_token ||
    (USD_TOKEN && (p.tokenA.id === USD_TOKEN || p.tokenB.id === USD_TOKEN))

  const filterOutPoolsWithLowLiquidity = (p) => {
    if (p.tokenA.id === system_token) {
      return p.tokenA.quantity >= minimumSystemAmount
    }

    if (p.tokenB.id === system_token) {
      return p.tokenB.quantity >= minimumSystemAmount
    }

    if (p.tokenA.id === USD_TOKEN) {
      return p.tokenA.quantity >= minimumUSDAmount
    }

    if (p.tokenB.id === USD_TOKEN) {
      return p.tokenB.quantity >= minimumUSDAmount
    }

    return false
  }

  const pools = await SwapPool.find({ chain: network.name }).lean()
  const enough_liquidity_pools = pools.filter(filterOutPoolsWithLowLiquidity)

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

  const poolBaseLiquidityUSD = (p) => {
    if (p.tokenA.id === system_token) return p.tokenA.quantity * systemPrice
    if (p.tokenB.id === system_token) return p.tokenB.quantity * systemPrice
    if (USD_TOKEN && p.tokenA.id === USD_TOKEN) return p.tokenA.quantity
    if (USD_TOKEN && p.tokenB.id === USD_TOKEN) return p.tokenB.quantity
    return 0
  }

  const poolsByToken = new Map<string, any[]>()
  for (const p of enough_liquidity_pools) {
    if (!isSystemOrUsdPool(p)) continue

    if (!poolsByToken.has(p.tokenA.id)) poolsByToken.set(p.tokenA.id, [])
    poolsByToken.get(p.tokenA.id)?.push(p)

    if (!poolsByToken.has(p.tokenB.id)) poolsByToken.set(p.tokenB.id, [])
    poolsByToken.get(p.tokenB.id)?.push(p)
  }

  for (const t of tokens) {
    if (t.id == system_token) {
      t.system_price = 1
      t.usd_price = systemPrice
      continue
    }

    if (t.id == USD_TOKEN) {
      t.system_price = (1 / systemPrice)
      t.usd_price = 1
      continue
    }

    // Get pool with best TVL
    const candidates = poolsByToken.get(t.id) || []
    let pool = null
    let bestLiquidity = 0
    for (const candidate of candidates) {
      const liquidityUSD = poolBaseLiquidityUSD(candidate)
      if (liquidityUSD > bestLiquidity) {
        bestLiquidity = liquidityUSD
        pool = candidate
      }
    }

    t.usd_price = 0.0
    t.system_price = 0.0

    if (pool) {
      const rawPriceA = Number(pool.priceA)
      const rawPriceB = Number(pool.priceB)
      const priceA = Number.isFinite(rawPriceA) ? rawPriceA : 0
      const priceB = Number.isFinite(rawPriceB) ? rawPriceB : 0
      const isUsdtPool = (pool.tokenA.id === USD_TOKEN || pool.tokenB.id === USD_TOKEN)

      if (isUsdtPool) {
        t.usd_price = pool.tokenA.id == USD_TOKEN ? priceB : priceA
        t.system_price = (1 / systemPrice) * t.usd_price
      } else {
        t.system_price = pool.tokenA.id == system_token ? priceB : priceA
        t.usd_price = t.system_price * systemPrice
      }

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

  return tokens
}
