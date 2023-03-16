import axios from 'axios'

import { createClient } from 'redis'
import { getPools } from '../swapV2Service/utils'


const redis = createClient()

export async function updateSystemPrice(network: Network) {
  if (!redis.isOpen) await redis.connect()

  const { data } = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price',
    {
      params: {
        ids: network.name,
        vs_currencies: 'usd',
      },
    }
  )

  const price = data[network.name].usd
  redis.set(`${network.name}_price`, String(price))
  console.log(`Updated ${network.name} price: `, price)
}

// system token and their USD prices
export async function updateTokensPrices(network: Network) {
  if (!redis.isOpen) await redis.connect()
  const tokens = await getAllTokensWithPrices(network)
  await redis.set(`${network.name}_token_prices`, JSON.stringify(tokens))
  console.log(network.name, 'token prices updated!')
}

export async function getAllTokensWithPrices(network: Network) {
  if (!redis.isOpen) await redis.connect()
  // Based on swap only, right now
  const tokens = []
  const { baseToken } = network

  const system_token = (baseToken.symbol + '-' + baseToken.contract).toLowerCase()
  const systemPrice = parseFloat(await redis.get(`${network.name}_price`)) || 0

  const pools = await getPools(network.name)

  pools.map(p => {
    const { tokenA, tokenB } = p
    if (tokens.filter(t => t.name == tokenA.name).length == 0) tokens.push(tokenA)
    if (tokens.filter(t => t.name == tokenB.name).length == 0) tokens.push(tokenB)
  })

  for (const t of tokens) {
    if (t.name == system_token) {
      t.system_price = 1
      t.usd_price = systemPrice
      continue
    }

    const pool = pools.find(p => (
      p.tokenA.name == (t.symbol + '-' + t.contract).toLowerCase() &&
      p.tokenB.name == system_token
    ) || (
      p.tokenB.name == (t.symbol + '-' + t.contract).toLowerCase() &&
      p.tokenA.name == system_token
    ))

    if (!pool) {
      t.usd_price = 0.0
      t.system_price = 0.0
    } else {
      t.system_price = parseFloat((pool.tokenA.name == system_token? pool.tokenBPrice : pool.tokenAPrice)
        .toSignificant(6)
      )

      t.usd_price = t.system_price * systemPrice
    }

    t.usd_price = parseFloat(t.usd_price.toFixed(6))
  }

  return tokens
}
