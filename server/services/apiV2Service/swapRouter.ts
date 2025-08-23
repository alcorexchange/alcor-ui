import { performance } from 'perf_hooks'
import workerpool from 'workerpool'

import { createClient } from 'redis'
import { TradeType, Trade, Percent, Token, Pool, Route } from '@alcorexchange/alcor-swap-sdk'
import { Router } from 'express'
import { tryParseCurrencyAmount } from '../../../utils/amm'
import { getPools } from '../swapV2Service/utils'
import { parseTrade } from './utils'

export const swapRouter = Router()

const redisClient = createClient()
const subscriber = createClient()

const connectRedis = async (client) => {
  if (!client.isOpen) {
    await client.connect()
  }
}

const TRADE_LIMITS = { maxNumResults: 1, maxHops: 3 }
const ROUTES_CACHE_TIMEOUT = 60 * 60 * 24 * 3
const ROUTES_UPDATING_TIMEOUT = 60 * 15

// const ROUTES_CACHE_TIMEOUT = 10
// const ROUTES_UPDATING_TIMEOUT = 15

const POOLS = {}
const POOLS_LOADING_PROMISES = {}


const pool = workerpool.pool('./server/services/apiV2Service/workers/computeAllRoutesWorker.js', {
  //minWorkers: 1,
  maxWorkers: 1, // HOTFIX 1 main thread + 1 worker. so 2 thread consumed by one instance
  workerType: 'thread'
})

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
    // Если промис загрузки еще не существует, создаем его
    POOLS_LOADING_PROMISES[chain] =
      POOLS_LOADING_PROMISES[chain] ||
      (async () => {
        const pools = await getPools(chain, true, (p) => p.active)
        POOLS[chain] = new Map(pools.map((p) => [p.id, p]))
        console.log(POOLS[chain].size, 'initial', chain, 'pools fetched')
        delete POOLS_LOADING_PROMISES[chain] // Очищаем промис после завершения
        return POOLS[chain]
      })()
    // Ждем завершения загрузки
    POOLS[chain] = await POOLS_LOADING_PROMISES[chain]
  }
  return POOLS[chain]
}

async function getCachedRoutes(chain, inputToken, outputToken, maxHops = 2) {
  await connectRedis(redisClient)

  const cacheKey = `${chain}-${inputToken.id}-${outputToken.id}-${maxHops}`
  let redisRoutes = await redisClient.get('routes_' + cacheKey)
  
  if (!redisRoutes) {
    // Создаем пустой кеш с истекшим временем, чтобы updater подхватил его
    console.log(`[CACHE] Creating empty cache entry for: ${cacheKey}`)
    await redisClient.set('routes_' + cacheKey, JSON.stringify([]))
    // Устанавливаем время истечения в прошлое (1 час назад)
    await redisClient.set('routes_expiration_' + cacheKey, (Date.now() - 60 * 60 * 1000).toString())
    return [] // Возвращаем пустой массив вместо ошибки
  }

  const allPools = await getAllPools(chain)
  const routes = []
  const parsedRoutes = JSON.parse(redisRoutes)
  
  // Если кеш пустой, возвращаем сразу
  if (!parsedRoutes || parsedRoutes.length === 0) {
    return routes
  }
  
  for (const route of parsedRoutes) {
    const pools = route.pools.map(p => allPools.get(p))
    const poolsValid = pools.every(p => p != undefined && p.active && p.tickDataProvider.ticks.length > 0)

    if (poolsValid) {
      routes.push(new Route(pools, inputToken, outputToken))
    }
  }

  return routes
}

async function computeRoutesInWorker(input, output, pools, maxHops) {
  const workerData = [
    Token.toJSON(input),
    Token.toJSON(output),
    pools.map(p => Pool.toBuffer(p)),
    maxHops
  ]

  try {
    const routes = await pool.exec('computeRoutes', workerData, {
      on(payload) {
        //console.log({ payload })
      }
    })
    return routes.map((r) => Route.fromBuffer(r))
  } catch (error) {
    console.error('Worker pool error:', error)
    throw error
  }
}

async function updateCache(chain, pools, input, output, maxHops, cacheKey) {
  const startTime = performance.now()
  const updatingKey = 'updating_' + cacheKey

  try {
    const setResult = await redisClient.set(updatingKey, 'true', { EX: ROUTES_UPDATING_TIMEOUT, NX: true })
    if (setResult !== 'OK') {
      console.log('ALREADY UPDATING:', cacheKey)
      return
    }

    const routes: any = await computeRoutesInWorker(input, output, pools, maxHops)

    // if (!routes || routes?.length == 0) {
    //   console.warn('NO ROUTES FOUND FOR', cacheKey)
    //   return []
    // }

    const redisRoutes = routes.map(({ input, output, pools }) => ({
      input: Token.toJSON(input),
      output: Token.toJSON(output),
      pools: pools.map((p) => p.id),
    }))

    await redisClient.set('routes_' + cacheKey, JSON.stringify(redisRoutes))
    await redisClient.set('routes_expiration_' + cacheKey, (Date.now() + ROUTES_CACHE_TIMEOUT * 1000).toString())

    const endTime = performance.now()
    console.log('cacheUpdated:', `${Math.round(endTime - startTime)}ms ${cacheKey}`)
    return routes
  } catch (error) {
    console.error('Error computing routes:', error)
    return []
  } finally {
    await redisClient.del(updatingKey)
  }
}

// Кешируем токены для быстрого поиска
const tokenCache = new Map()

function findToken(pools, tokenID) {
  // Проверяем кеш
  if (tokenCache.has(tokenID)) {
    return tokenCache.get(tokenID)
  }
  
  // Ищем токен
  const token = pools.find((p) => p.tokenA.id === tokenID)?.tokenA || pools.find((p) => p.tokenB.id === tokenID)?.tokenB
  
  // Сохраняем в кеш
  if (token) {
    tokenCache.set(tokenID, token)
  }
  
  return token
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
    console.error('Error getting cached routes:', e.message)
    return res.status(500).send('Service temporarily unavailable')
  }

  if (cachedRoutes.length == 0) {
    // Более информативная ошибка
    console.log(`No routes available: ${network.name} ${inputToken.symbol}(${inputToken.id}) -> ${outputToken.symbol}(${outputToken.id}) maxHops:${maxHops}`)
    return res.status(404).send('No trading route available. Try again in a few moments.')
  }

  //cachedRoutes.sort((a, b) => a.midPrice.greaterThan(b.midPrice) ? -1 : 1)

  let trade
  try {
    if (v2) {
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
