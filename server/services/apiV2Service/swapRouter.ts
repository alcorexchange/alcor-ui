import JSBI from 'jsbi'
import { performance } from 'perf_hooks'
import { Worker } from 'worker_threads'
import { Trade, Percent, Token, Pool, Route } from '@alcorexchange/alcor-swap-sdk'
import { Router } from 'express'
import { tryParseCurrencyAmount } from '../../../utils/amm'
import { getPools } from '../swapV2Service/utils'

export const swapRouter = Router()

const TRADE_LIMITS = { maxNumResults: 1, maxHops: 3 }
const ROUTES = {}
const ROUTES_EXPIRATION_TIMES = {}
const ROUTES_CACHE_TIMEOUT = 60 * 60 * 2 // 1H
const ROUTES_UPDATING = {} // Объект для отслеживания обновлений кеша

function getCachedRoutes(chain, POOLS, inputTokenID, outputTokenID, maxHops = 2) {
  const cacheKey = `${chain}-${inputTokenID}-${outputTokenID}-${maxHops}`

  if (ROUTES[cacheKey]) {
    if (Date.now() > ROUTES_EXPIRATION_TIMES[cacheKey]) {
      if (!ROUTES_UPDATING[cacheKey]) {
        updateCacheInBackground(chain, POOLS, inputTokenID, outputTokenID, maxHops, cacheKey)
      }
    }
    return ROUTES[cacheKey]
  }

  return updateCache(chain, POOLS, inputTokenID, outputTokenID, maxHops, cacheKey)
}

async function updateCache(chain, POOLS, inputTokenID, outputTokenID, maxHops, cacheKey) {
  const input = findToken(POOLS, inputTokenID)
  const output = findToken(POOLS, outputTokenID)

  if (!input || !output) {
    console.error('getCachedPools: INVALID input/output:', chain, { cacheKey })
    return []
  }

  try {
    ROUTES_UPDATING[cacheKey] = true
    const routes = await computeRoutesInWorker(input, output, POOLS, maxHops)
    ROUTES[cacheKey] = routes
    ROUTES_EXPIRATION_TIMES[cacheKey] = Date.now() + ROUTES_CACHE_TIMEOUT * 1000
    return routes
  } catch (error) {
    console.error('Error computing routes in worker:', error)
    return []
  } finally {
    delete ROUTES_UPDATING[cacheKey]
  }
}

function updateCacheInBackground(chain, POOLS, inputTokenID, outputTokenID, maxHops, cacheKey) {
  setTimeout(() => {
    console.log('update background cache for', cacheKey)
    updateCache(chain, POOLS, inputTokenID, outputTokenID, maxHops, cacheKey).catch((error) =>
      console.error('Error updating cache in background:', error)
    ).then(() => console.log('cache updated in background', cacheKey))
  }, 0)
}

function findToken(POOLS, tokenID) {
  return POOLS.find((p) => p.tokenA.id === tokenID)?.tokenA || POOLS.find((p) => p.tokenB.id === tokenID)?.tokenB
}

function computeRoutesInWorker(input, output, POOLS, maxHops) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./server/services/apiV2Service/workers/computeAllRoutesWorker.js', {
      workerData: {
        input: Token.toJSON(input),
        output: Token.toJSON(output),
        POOLS: POOLS.map(p => Pool.toBuffer(p)),
        maxHops
      },
    })

    worker.on('message', routes => {
      resolve(routes.map(r => Route.fromBuffer(r)))
      worker.terminate()
    })

    worker.on('error', reject)

    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`))
    })
  })
}

swapRouter.get('/getRoute', async (req, res) => {
  const network = req.app.get('network')
  let { v2, trade_type, input, output, amount, slippage, receiver = '<receiver>', maxHops } = <any>req.query

  if (!trade_type || !input || !output) {
    return res.status(403).send('Invalid request')
  }

  if (isNaN(amount)) {
    return res.status(403).send('Invalid amount')
  }

  slippage = slippage ? new Percent(slippage * 100, 10000) : new Percent(30, 10000)

  maxHops = !isNaN(parseInt(maxHops)) ? parseInt(maxHops) : TRADE_LIMITS.maxHops

  const exactIn = trade_type === 'EXACT_INPUT'

  const allPools = await getPools(network.name, true, (p) => p.active && BigInt(p.liquidity) > BigInt(0))
  const POOLS = allPools.filter((p) => p.tickDataProvider.ticks.length > 0)

  const inputToken = findToken(allPools, input)
  const outputToken = findToken(allPools, output)

  if (!inputToken || !outputToken) {
    return res.status(403).send('Invalid input/output')
  }

  amount = tryParseCurrencyAmount(amount, exactIn ? inputToken : outputToken)
  if (!amount) {
    return res.status(403).send('Invalid amount')
  }

  const startTime = performance.now()

  let trade
  let routes = await getCachedRoutes(network.name, POOLS, input, output, Math.min(maxHops, 3))

  if (routes.length > 1000) {
    // cut top 1000 pools by liquidity
    routes.sort((a, b) => {
      const aLiquidity = a.pools.reduce((acc, p) => JSBI.add(acc, p.liquidity), JSBI.BigInt(0))
      const bLiquidity = b.pools.reduce((acc, p) => JSBI.add(acc, p.liquidity), JSBI.BigInt(0))

      return JSBI.greaterThan(aLiquidity, bLiquidity) ? -1 : 1
    })

    routes = routes.slice(0, 1000)
  }

  for (const r of routes) {
    const aLiquidity = r.pools.reduce((acc, p) => JSBI.add(acc, p.liquidity), JSBI.BigInt(0))
    console.log('aLiquidity', aLiquidity.toString())
    //console.log(r.pools.reduce((acc, p) => acc += p.id + ',', ''), r.midPrice.toSignificant())
  }

  try {
    if (v2) {
      return res.status(403).send('')
      // const nodes = Object.keys(network.client_nodes);
      // [trade] = exactIn
      //   ? await Trade.bestTradeExactInReadOnly(nodes, routes, amount)
      //   : await Trade.bestTradeExactOutReadOnly(nodes, routes, amount);
    } else {
      ;[trade] = exactIn
        ? Trade.bestTradeExactIn(routes, POOLS, amount)
        : Trade.bestTradeExactOut(routes, POOLS, amount)
    }
  } catch (e) {
    console.error('GET ROUTE ERROR', e)
    return res.status(403).send('Get Route error: ' + e.message)
  }

  const endTime = performance.now()
  console.log('trade', trade.executionPrice.toSignificant())

  console.log(
    network.name,
    `find route ${maxHops} hop ${Math.round(
      endTime - startTime
    )} ms ${inputToken.symbol} -> ${outputToken.symbol} v2: ${Boolean(v2)}`
  )

  if (!trade) {
    return res.status(403).send('No route found')
  }

  const method = exactIn ? 'swapexactin' : 'swapexactout'
  const route = trade.route.pools.map((p) => p.id)

  const maxSent = exactIn ? trade.inputAmount : trade.maximumAmountIn(slippage)
  const minReceived = exactIn ? trade.minimumAmountOut(slippage) : trade.outputAmount

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
      denominator: trade.executionPrice.denominator.toString(),
    },
  }

  return res.json(result)
})

export default swapRouter
