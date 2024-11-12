import { performance } from 'perf_hooks'
import { Worker } from 'worker_threads'
import { createClient } from 'redis'
import { TradeType, Trade, Percent, Token, Pool, Route, TickListDataProvider } from '@alcorexchange/alcor-swap-sdk'
import { Router } from 'express'
import { tryParseCurrencyAmount } from '../../../utils/amm'
import { getPools } from '../swapV2Service/utils'
import { bestTradeWithSplitMultiThreaded, parseTrade } from './utils'

export const swapRouter = Router()

const redisClient = createClient()
const subscriber = createClient()

const connectRedis = async (client) => {
  if (!client.isOpen) {
    await client.connect()
  }
}

const TRADE_LIMITS = { maxNumResults: 1, maxHops: 3 }
const POOLS = {}
const ROUTES_CACHE_TIMEOUT = 60 * 60 * 24 * 3
const ROUTES_UPDATING_TIMEOUT = 60 * 60 * 1

subscriber.connect().then(() => {
  subscriber.subscribe('swap:pool:instanceUpdated', async msg => {
    const { chain, buffer } = JSON.parse(msg)
    const pool = Pool.fromBuffer(Buffer.from(buffer, 'hex'))

    if (!POOLS[chain]) return getAllPools(chain)

    if (!pool) {
      console.warn('ADDING NULL POOL TO POOLS MAP!', pool)
    }

    POOLS[chain].set(pool.id, pool)
  })
})

async function getAllPools(chain) {
  if (!POOLS[chain]) {
    const pools = await getPools(chain, true, (p) => p.active)
    POOLS[chain] = new Map(pools.map(p => [p.id, p]))
    console.log(POOLS[chain].size, 'initial', chain, 'pools fetched')
  }

  return POOLS[chain]
}

async function getCachedRoutes(chain, inputToken, outputToken, maxHops = 2) {
  await connectRedis(redisClient)

  const cacheKey = `${chain}-${inputToken.id}-${outputToken.id}-${maxHops}`
  const allPools = await getAllPools(chain)
  const liquidPools = Array.from(allPools.values()).filter((p: any) => p.active && p.tickDataProvider.ticks.length > 0)

  let redisRoutes = await redisClient.get('routes_' + cacheKey)
  const cacheExpiration = await redisClient.get('routes_expiration_' + cacheKey)

  const currentTime = Date.now()
  const isCacheExpired = !cacheExpiration || currentTime > parseInt(cacheExpiration, 10)

  if (!redisRoutes && isCacheExpired) {
    await updateCache(chain, liquidPools, inputToken, outputToken, maxHops, cacheKey)
    redisRoutes = await redisClient.get('routes_' + cacheKey)
  } else if (isCacheExpired) {
    const updatingKey = 'updating_' + cacheKey
    const isUpdating = await redisClient.get(updatingKey)

    if (!isUpdating) {
      await redisClient.set(updatingKey, 'true', {
        EX: ROUTES_UPDATING_TIMEOUT,
        NX: true // Only set the key if it does not already exist
      })
      updateCacheInBackground(chain, liquidPools, inputToken, outputToken, maxHops, cacheKey)
    }
  }

  const routes = []
  for (const route of JSON.parse(redisRoutes) || []) {
    const pools = route.pools.map(p => allPools.get(p))

    const poolsValid = pools.every(p => p != undefined && p.active && p.tickDataProvider.ticks.length > 0)

    if (poolsValid) {
      routes.push(new Route(pools, inputToken, outputToken))
    }
  }

  return routes
}

async function updateCache(chain, pools, inputToken, outputToken, maxHops, cacheKey) {
  console.log('start update cache', cacheKey)
  const startTime = performance.now()

  const input = findToken(pools, inputToken.id)
  const output = findToken(pools, outputToken.id)

  if (!input || !output) {
    throw new Error(`${chain} ${cacheKey} getCachedPools: INVALID input/output:`)
  }

  try {
    const routes: any = await computeRoutesInWorker(input, output, pools, maxHops)
    const redisRoutes = routes.map(({ input, output, pools }) => ({
      input: Token.toJSON(input),
      output: Token.toJSON(output),
      pools: pools.map(p => p.id)
    }))

    await redisClient.set('routes_' + cacheKey, JSON.stringify(redisRoutes))
    await redisClient.set('routes_expiration_' + cacheKey, (Date.now() + ROUTES_CACHE_TIMEOUT * 1000).toString())

    const endTime = performance.now()

    console.log('cacheUpdated:', `${Math.round(endTime - startTime)}ms ${cacheKey}`)

    return routes
  } catch (error) {
    console.error('Error computing routes in worker:', error)
    return []
  } finally {
    await redisClient.del('updating_' + cacheKey)
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
      }
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

  maxHops = Math.min(3, !isNaN(parseInt(maxHops)) ? parseInt(maxHops) : TRADE_LIMITS.maxHops)

  const exactIn = trade_type === 'EXACT_INPUT'

  const startTime = performance.now()

  const allPools = await getAllPools(network.name)
  const poolsArray = Array.from(allPools.values())

  const inputToken = findToken(poolsArray, input)
  const outputToken = findToken(poolsArray, output)

  if (!inputToken || !outputToken || inputToken.equals(outputToken)) {
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

  let cachedRoutes = []
  try {
    cachedRoutes = await getCachedRoutes(
      network.name,
      inputToken,
      outputToken,
      maxHops
    )
  } catch (e) {
    return res.status(403).send('No route found')
  }

  if (cachedRoutes.length == 0) {
    return res.status(403).send('No route found')
  }

  cachedRoutes.sort((a, b) => a.midPrice.greaterThan(b.midPrice) ? -1 : 1)

  let trade
  try {
    if (v2) {
      //trade = await (maxHops > 2 ? bestTradeWithSplitMultiThreaded : Trade.bestTradeWithSplit)(
      trade = Trade.bestTradeWithSplit(
        cachedRoutes,
        amount,
        maxHops > 2 ? [25, 50, 75, 100] : [5, 10, 15, 25, 50, 75, 100],
        //[5, 10, 15, 25, 50, 75, 100],
        exactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
        { minSplits: 1, maxSplits: 10 }
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
