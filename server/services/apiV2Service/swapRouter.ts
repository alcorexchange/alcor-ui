import { performance } from 'perf_hooks'
import { Worker } from 'worker_threads'
import { createClient } from 'redis'
import { TradeType, Trade, Percent, Token, Pool, Route, TickListDataProvider } from '@alcorexchange/alcor-swap-sdk'
import { Router } from 'express'
import { tryParseCurrencyAmount } from '../../../utils/amm'
import { getPools } from '../swapV2Service/utils'
import { parseTrade } from './utils'

export const swapRouter = Router()

const redis = createClient()
const subscriber = createClient()
subscriber.connect()

const TRADE_LIMITS = { maxNumResults: 1, maxHops: 3 }

const POOLS = {}
const ROUTES_EXPIRATION_TIMES = {}
const ROUTES_CACHE_TIMEOUT = 60 * 20 // 5H
const ROUTES_UPDATING = {} // Объект для отслеживания обновлений кеша

subscriber.subscribe('swap:pool:instanceUpdated', msg => {
  const { chain, buffer } = JSON.parse(msg)
  const pool = Pool.fromBuffer(Buffer.from(buffer, 'hex'))

  if (!POOLS[chain]) return getAllPools(chain)

  if (!pool) {
    console.warn('ADDING NULL POOL TO POOLS MAP!', pool)
  }

  POOLS[chain].set(pool.id, pool)
})

async function getAllPools(chain): Promise<Map<string, Pool>> {
  if (!POOLS[chain]) {
    //const poos = await getPools(chain, true, (p) => p.active && BigInt(p.liquidity) > BigInt(0))
    const pools = await getPools(chain, true, (p) => p.active)
    POOLS[chain] = new Map(pools.map(p => [p.id, p]))
    console.log(POOLS[chain].size, 'initial', chain, 'pools fetched')
  }

  return POOLS[chain]
}

async function getCachedRoutes(chain, inputToken, outputToken, maxHops = 2) {
  if (!redis.isOpen) await redis.connect()

  const cacheKey = `${chain}-${inputToken.id}-${outputToken.id}-${maxHops}`
  const allPools = await getAllPools(chain)
  const liquidPools = Array.from(allPools.values()).filter((p: any) => p.active && p.tickDataProvider.ticks.length > 0)

  const redis_routes = await redis.get('routes_' + cacheKey)

  if (!redis_routes) {
    await updateCache(chain, liquidPools, inputToken, outputToken, maxHops, cacheKey)
    return await getCachedRoutes(chain, inputToken, outputToken, maxHops)
  }

  const routes = []
  for (const route of JSON.parse(redis_routes) || []) {
    const pools = route.pools.map(p => allPools.get(p))

    // Pools might change, so pool in cached route no more active/has liquidity
    const poolsValid = pools.every(p => p != undefined && p.active && p.tickDataProvider.ticks.length > 0)

    if (poolsValid) {
      routes.push(new Route(pools, inputToken, outputToken))
    }
  }

  if (!ROUTES_EXPIRATION_TIMES[cacheKey] || Date.now() > ROUTES_EXPIRATION_TIMES[cacheKey]) {
    if (!ROUTES_UPDATING[cacheKey]) {
      updateCacheInBackground(chain, liquidPools, inputToken, outputToken, maxHops, cacheKey)
    }
  }

  return routes
}

async function updateCache(chain, pools, inputToken, outputToken, maxHops, cacheKey) {
  const input = findToken(pools, inputToken.id)
  const output = findToken(pools, outputToken.id)

  if (!input || !output) {
    throw new Error(`${chain} ${cacheKey} getCachedPools: INVALID input/output:`)
  }

  try {
    ROUTES_UPDATING[cacheKey] = true

    const routes: any = await computeRoutesInWorker(input, output, pools, maxHops)
    const redis_routes = routes.map(({ input, output, pools }) => {
      return {
        input: Token.toJSON(input),
        output: Token.toJSON(output),
        pools: pools.map(p => p.id)
      }
    })

    await redis.set('routes_' + cacheKey, JSON.stringify(redis_routes))
    console.log('cacheUpdated:', cacheKey)

    ROUTES_EXPIRATION_TIMES[cacheKey] = Date.now() + ROUTES_CACHE_TIMEOUT * 1000
    return routes
  } catch (error) {
    console.error('Error computing routes in worker:', error)
    return []
  } finally {
    delete ROUTES_UPDATING[cacheKey]
  }
}

function updateCacheInBackground(chain, pools, inputToken, outputToken, maxHops, cacheKey) {
  setTimeout(() => {
    updateCache(chain, pools, inputToken, outputToken, maxHops, cacheKey).catch((error) =>
      console.error('Error updating cache in background:', error)
    )
  }, 0)
}

function findToken(pools, tokenID) {
  return pools.find((p) => p.tokenA.id === tokenID)?.tokenA || pools.find((p) => p.tokenB.id === tokenID)?.tokenB
}

function computeRoutesInWorker(input, output, pools, maxHops) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./server/services/apiV2Service/workers/computeAllRoutesWorker.js', {
      workerData: {
        input: Token.toJSON(input),
        output: Token.toJSON(output),
        pools: pools.map(p => Pool.toBuffer(p)),
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

  slippage = slippage ? new Percent(parseFloat(slippage) * 100, 10000) : new Percent(30, 10000)

  maxHops = !isNaN(parseInt(maxHops)) ? parseInt(maxHops) : TRADE_LIMITS.maxHops

  const exactIn = trade_type === 'EXACT_INPUT'

  const startTime = performance.now()

  const allPools = await getAllPools(network.name)
  const poolsArray = Array.from(allPools.values())

  const inputToken = findToken(poolsArray, input)
  const outputToken = findToken(poolsArray, output)

  if (!inputToken || !outputToken) {
    return res.status(403).send('Invalid input/output')
  }

  try {
    amount = tryParseCurrencyAmount(amount, exactIn ? inputToken : outputToken)
  } catch (e) {
    return res.status(403).send(e.message)
  }

  if (!amount) {
    return res.status(403).send('Invalid amount')
  }

  const cachedRoutes = await getCachedRoutes(
    network.name,
    inputToken,
    outputToken,
    Math.min(maxHops, 3)
  )

  if (cachedRoutes.length == 0) {
    return res.status(403).send('No route found')
  }

  let trade
  try {
    if (v2) {
      trade = Trade.bestTradeWithSplit(
        cachedRoutes,
        amount,
        [5, 25, 50, 75, 100],
        exactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
        { minSplits: 1, maxSplits: 8 }
      )
    } else {
      ;[trade] = exactIn
        ? Trade.bestTradeExactIn(cachedRoutes, amount)
        : Trade.bestTradeExactOut(cachedRoutes, amount)
    }
  } catch (e) {
    console.error('GET ROUTE ERROR', e)
    return res.status(403).send('Get Route error: ' + e.message)
  }

  const endTime = performance.now()

  console.log(
    network.name,
    `find route ${maxHops} hop ${Math.round(
      endTime - startTime
    )} ms ${inputToken.symbol} -> ${outputToken.symbol} v2: ${Boolean(v2)}`
  )

  if (!trade) {
    return res.status(403).send('No route found')
  }

  const parsedTrade = parseTrade(trade, slippage, receiver)

  return res.json(parsedTrade)
})

export default swapRouter
