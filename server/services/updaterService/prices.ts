import axios from 'axios'

import { createClient } from 'redis'
import { getPools } from '../swapV2Service/utils'
import { Market, Match } from '../../models'
import { getTokens } from '../../utils'

const redis = createClient()

export async function updateCMSucid() {
  if (!redis.isOpen) await redis.connect()

  try {
    const { data: { data } } = await axios.get(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?CMC_PRO_API_KEY=UNIFIED-CRYPTOASSET-INDEX'
    )

    redis.set('CMC_UCIDS', JSON.stringify(data))
    console.log('Updated CMC_UCIDS')
  } catch (e) {
    console.error('CMS ucid PRICE UPDATE FAILED!', e)
  }
}

export async function updateSystemPrice(network: Network) {
  if (!redis.isOpen) await redis.connect()

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
    redis.set(`${network.name}_price`, String(price))
    console.log(`Updated ${network.name} price: `, price)
  } catch (e) {
    console.error('SYSTEM PRICE UPDATE FAILED!', network.name, e)
  }
}

// system token and their USD prices
export async function updateTokensPrices(network: Network) {
  if (!redis.isOpen) await redis.connect()
  const tokens = await makeAllTokensWithPrices(network)

  const cmc_ucids = JSON.parse((await redis.get('CMC_UCIDS')) || '[]')

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

  await redis.set(`${network.name}_token_prices`, JSON.stringify(tokens))
  console.log(network.name, 'token prices & cmc_ucids updated!')
}

export async function makeAllTokensWithPrices(network: Network) {
  if (!redis.isOpen) await redis.connect()
  // Based on swap only, right now
  const tokens = []
  const { baseToken, USD_TOKEN } = network

  const system_token = (baseToken.symbol + '-' + baseToken.contract).toLowerCase()
  const systemPrice = parseFloat(await redis.get(`${network.name}_price`)) || 0

  const minimumUSDAmount = 1 // 1 USD
  const minimumSystemAmount = (1 / systemPrice) * minimumUSDAmount

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

  const pools = await getPools(network.name)
  const enough_liquidity_pools = await getPools(network.name, false, filterOutPoolsWithLowLiquidity)

  // Sorting by more ticks means more liquidity
  // pools.sort((a, b) => {
  //   return b.tickDataProvider.ticks.length - a.tickDataProvider.ticks.length
  // })

  const tokenIds = new Set(tokens.map(t => t.id))
  for (const p of pools) {
    const { tokenA, tokenB } = p
    if (!tokenIds.has(tokenA.id)) {
      tokens.push(tokenA)
      tokenIds.add(tokenA.id)
    }
    if (!tokenIds.has(tokenB.id)) {
      tokens.push(tokenB)
      tokenIds.add(tokenB.id)
    }
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
    const pool = enough_liquidity_pools.find(p => (
      (p.tokenA.id === t.id && (p.tokenB.id === system_token || (USD_TOKEN && p.tokenB.id === USD_TOKEN))) ||
      (p.tokenB.id === t.id && (p.tokenA.id === system_token || (USD_TOKEN && p.tokenA.id === USD_TOKEN)))
    ))

    t.usd_price = 0.0
    t.system_price = 0.0

    if (pool) {
      const isUsdtPool = (pool.tokenA.id === USD_TOKEN || pool.tokenB.id === USD_TOKEN)

      if (isUsdtPool) {
        t.usd_price = parseFloat((pool.tokenA.id == USD_TOKEN ? pool.tokenBPrice : pool.tokenAPrice).toSignificant(6))
        t.systemPrice = (1 / systemPrice) * t.usd_price
      } else {
        t.system_price = parseFloat((pool.tokenA.id == system_token ? pool.tokenBPrice : pool.tokenAPrice).toSignificant(6))
        t.usd_price = t.system_price * systemPrice
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
        t.system_price = last_deal.unit_price
        t.usd_price = t.system_price * systemPrice
      }
    }

    tokens.push(t)
  }

  return tokens
}
