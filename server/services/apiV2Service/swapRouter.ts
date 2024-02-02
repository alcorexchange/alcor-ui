import { performance } from 'perf_hooks'

import { Trade, Percent, computeAllRoutes, callReadOnlySwapCalculation } from '@alcorexchange/alcor-swap-sdk'
import { Router } from 'express'

import { tryParseCurrencyAmount } from '../../../utils/amm'

import { getPools } from '../swapV2Service/utils'

export const swapRouter = Router()

const ROUTES_CACHE_TIMEOUT = 60 * 60 * 1 // In seconds
const TRADE_LIMITS = { maxNumResults: 1, maxHops: 3 }

// storing pools globally for access by getRoute(for cache)
let POOLS = []

const ROUTES = {}
function getCachedRoutes(chain, inputTokenID, outputTokenID, maxHops = 2) {
  const cache_key = `${chain}-${inputTokenID}-${outputTokenID}-${maxHops}`

  if (ROUTES[cache_key]) {
    return ROUTES[cache_key]
  }

  // We pass chain to keep cache for different chains
  const input = POOLS.find(p => p.tokenA.id == inputTokenID)?.tokenA || POOLS.find(p => p.tokenB.id == inputTokenID)?.tokenB
  const output = POOLS.find(p => p.tokenA.id == outputTokenID)?.tokenA || POOLS.find(p => p.tokenB.id == outputTokenID)?.tokenB

  if (!input || !output) {
    console.log('ROUTE NOT FOUND: ', chain, { cache_key })
  }

  const routes = computeAllRoutes(input, output, POOLS, maxHops)

  // Caching
  ROUTES[cache_key] = routes
  setTimeout(() => delete ROUTES[cache_key], ROUTES_CACHE_TIMEOUT * 1000)

  return routes
}

swapRouter.get('/getRoute', async (req, res) => {
  const network: Network = req.app.get('network')

  let { v2, trade_type, input, output, amount, slippage, receiver = '<receiver>', maxHops } = <any>req.query

  if (!trade_type || !input || !output || !amount)
    return res.status(403).send('Invalid request')

  if (!slippage) slippage = 0.3
  slippage = new Percent(slippage * 100, 10000)

  // Max hoop can be only 3 due to perfomance
  maxHops = (!isNaN(parseInt(maxHops))) ? parseInt(maxHops) : TRADE_LIMITS.maxHops

  const exactIn = trade_type == 'EXACT_INPUT'

  // Updating global pools
  const allPools = await getPools(network.name)

  const inputToken = allPools.find(p => p.tokenA.id == input)?.tokenA || allPools.find(p => p.tokenB.id == input)?.tokenB
  const outputToken = allPools.find(p => p.tokenA.id == output)?.tokenA || allPools.find(p => p.tokenB.id == output)?.tokenB

  if (!inputToken || !outputToken) return res.status(403).send('Invalid input/output')

  POOLS = allPools.filter(p => p.tickDataProvider.ticks.length > 0)

  amount = tryParseCurrencyAmount(amount, exactIn ? inputToken : outputToken)
  if (!amount) return res.status(403).send('Invalid amount')

  const startTime = performance.now()

  let trade: any

  const routes = getCachedRoutes(network.name, input, output, Math.min(maxHops, 3))

  try {
    if (v2) {
      const nodes = Object.keys(network.client_nodes)

      ;[trade] = exactIn
        ? await Trade.bestTradeExactInReadOnly(nodes, routes, amount)
        : await Trade.bestTradeExactOutReadOnly(nodes, routes, amount)
    } else {
      [trade] = exactIn
        ? await Trade.bestTradeExactIn2(routes, POOLS, amount)
        : await Trade.bestTradeExactOut2(routes, POOLS, amount)
    }
  } catch (e) {
    console.error('GET ROUTE ERROR', e)
  }

  const endTime = performance.now()

  console.log(network.name, `find route took maxHops('${maxHops}') ${endTime - startTime} milliseconds v2: ${Boolean(v2)}`)

  if (!trade) return res.status(403).send('No route found')

  const method = exactIn ? 'swapexactin' : 'swapexactout'
  const route = trade.route.pools.map(p => p.id)

  const maxSent = exactIn ? trade.inputAmount : trade.maximumAmountIn(slippage)
  const minReceived = exactIn ? trade.minimumAmountOut(slippage) : trade.outputAmount

  // Memo Format <Service Name>#<Pool ID's>#<Recipient>#<Output Token>#<Deadline>
  const memo = `${method}#${route.join(',')}#${receiver}#${minReceived.toExtendedAsset()}#0`

  const result = {
    input: trade.inputAmount.toFixed(),
    output: trade.outputAmount.toFixed(),
    minReceived: minReceived.toFixed(),
    maxSent: maxSent.toFixed(),
    priceImpact: trade.priceImpact.toSignificant(2),
    memo,
    route,
    executionPrice: {
      numerator: trade.executionPrice.numerator.toString(),
      denominator: trade.executionPrice.denominator.toString()
    }
  }

  return res.json(result)
})
