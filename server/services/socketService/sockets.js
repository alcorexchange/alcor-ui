import { Match, SwapBar, SwapPool } from '../../models'
import { getRedis } from '../redis'
import { getSwapBarPriceAsString } from '../../../utils/amm.js'
import { getSwapTickerV2Snapshot, makeSwapTickerV2Key } from './swapTickerV2State'

export const resolutions = {
  1: 1 * 60,
  5: 5 * 60,
  15: 15 * 60,
  30: 30 * 60,
  60: 60 * 60,
  240: 60 * 60 * 4,
  '1D': 60 * 60 * 24,
  '1W': 60 * 60 * 24 * 7,
  '1M': 60 * 60 * 24 * 30
}

function normalizeResolution(resolution) {
  if (!resolution) return resolution
  const value = String(resolution).toUpperCase()
  if (value === 'D') return '1D'
  if (value === 'W') return '1W'
  if (value === 'M') return '1M'
  return String(resolution)
}

async function emitSwapTickerV2Snapshot(socket, chain, poolId, resolution) {
  const key = makeSwapTickerV2Key(chain, poolId, resolution)
  const cached = getSwapTickerV2Snapshot(key)
  if (cached) {
    socket.emit('swap-tick-v2', cached)
    return
  }

  const frameSeconds = resolutions[resolution]
  if (!frameSeconds) return

  const poolInfo = await SwapPool.findOne({ chain, id: poolId }).lean()
  if (!poolInfo) return

  const lastBar = await SwapBar.findOne(
    { chain, pool: poolId, timeframe: resolution },
    { time: 1, open: 1, high: 1, low: 1, close: 1, volumeUSD: 1 }
  )
    .sort({ time: -1 })
    .lean()

  if (!lastBar?.close) return

  const frameMs = frameSeconds * 1000
  const nowAligned = Math.floor(Date.now() / frameMs) * frameMs
  const lastBarTime = new Date(lastBar.time).getTime()

  let barTime = nowAligned
  let openSqrt = lastBar.close
  let highSqrt = lastBar.close
  let lowSqrt = lastBar.close
  let closeSqrt = lastBar.close
  let volumeUSD = 0

  if (lastBarTime === nowAligned) {
    barTime = lastBarTime
    highSqrt = lastBar.high
    lowSqrt = lastBar.low
    closeSqrt = lastBar.close
    volumeUSD = Number(lastBar.volumeUSD) || 0

    const prevBar = await SwapBar.findOne(
      { chain, pool: poolId, timeframe: resolution, time: { $lt: lastBar.time } },
      { close: 1 }
    )
      .sort({ time: -1 })
      .lean()

    if (prevBar?.close) {
      openSqrt = prevBar.close
    } else if (lastBar.open) {
      openSqrt = lastBar.open
    }
  }

  const tokenA = poolInfo.tokenA
  const tokenB = poolInfo.tokenB
  const priceA = {
    open: getSwapBarPriceAsString(openSqrt, tokenA, tokenB, false),
    high: getSwapBarPriceAsString(highSqrt, tokenA, tokenB, false),
    low: getSwapBarPriceAsString(lowSqrt, tokenA, tokenB, false),
    close: getSwapBarPriceAsString(closeSqrt, tokenA, tokenB, false),
  }
  const priceB = {
    open: getSwapBarPriceAsString(openSqrt, tokenA, tokenB, true),
    high: getSwapBarPriceAsString(highSqrt, tokenA, tokenB, true),
    low: getSwapBarPriceAsString(lowSqrt, tokenA, tokenB, true),
    close: getSwapBarPriceAsString(closeSqrt, tokenA, tokenB, true),
  }
  const reversedHigh = priceB.low
  const reversedLow = priceB.high
  priceB.high = reversedHigh
  priceB.low = reversedLow

  socket.emit('swap-tick-v2', {
    v: 2,
    chain,
    poolId,
    resolution,
    time: barTime,
    bar: {
      volumeUSD,
      sqrtPriceX64: { open: String(openSqrt), high: String(highSqrt), low: String(lowSqrt), close: String(closeSqrt) },
      price: { aPerB: priceA, bPerA: priceB }
    },
    pair: {
      tokenA: {
        id: tokenA.id,
        contract: tokenA.contract,
        symbol: tokenA.symbol,
        decimals: tokenA.decimals,
      },
      tokenB: {
        id: tokenB.id,
        contract: tokenB.contract,
        symbol: tokenB.symbol,
        decimals: tokenB.decimals,
      },
    },
    serverTime: Date.now(),
    source: 'chain'
  })
}

export function subscribe(io, socket) {
  socket.on('subscribe', async ({ room, params }) => {
    if (room == 'deals') {
      socket.join(`deals:${params.chain}.${params.market}`)

      const deals = await Match.find({ chain: params.chain, market: params.market })
        .select('time bid ask unit_price type trx_id')
        .sort({ time: -1 })
        .limit(200)

      socket.emit('new_deals', deals)
    }

    if (room == 'ticker') {
      const resolution = normalizeResolution(params.resolution)
      socket.join(`ticker:${params.chain}.${params.market}.${resolution}`)
    }

    if (room == 'swap-ticker') {
      const resolution = normalizeResolution(params.resolution)
      socket.join(`swap-ticker:${params.chain}.${params.pool}.${resolution}`)
    }
    if (room == 'swap-ticker-v2') {
      const resolution = normalizeResolution(params.resolution)
      socket.join(`swap-ticker-v2:${params.chain}.${params.pool}.${resolution}`)
      try {
        await emitSwapTickerV2Snapshot(socket, params.chain, Number(params.pool), resolution)
      } catch (e) {
        console.error('swap-ticker-v2 snapshot failed', e)
      }
    }

    if (room == 'orders') {
      socket.join(`orders:${params.chain}.${params.market}`)
    }

    if (room == 'swap') {
      if (params.allPools) {
        socket.join(`swap:${params.chain}`)
      } else {
        socket.join(`swap:${params.chain}.${params.poolId}`)
      }
    }

    if (room == 'pools') {
      socket.join(`pools:${params.chain}`)
    }

    if (room == 'account') {
      socket.join(`account:${params.chain}.${params.name}`)
    }

    if (room == 'orderbook') {
      const { chain, side, market } = params

      const data = await getRedis().get(`orderbook_${chain}_${side}_${market}`)

      let entries

      if (!data) {
        entries = []
        console.log('Empty orderbook: ', { chain, side, market })
      } else {
        try {
          entries = JSON.parse(data)
        } catch (e) {
          console.log('Error in orderbook data: ', { chain, side, market }, data)
          throw e
        }
      }

      // TODO Implement with http query (with limit by user)
      const orderbook = Object.values(Object.fromEntries(entries)).slice(0, 1000) // Limit for now

      socket.emit(`orderbook_${side}`, orderbook)
      socket.join(`orderbook:${chain}.${side}.${market}`)
    }

    // TODO Swap WS
    // if (room == 'swap') {
    //   socket.join(`account:${params.chain}.${params.name}`)
    // }
  })
}

export function unsubscribe(io, socket) {
  socket.on('unsubscribe', ({ room, params }) => {
    if (room == 'deals') {
      socket.leave(`deals:${params.chain}.${params.market}`)
    }

    if (room == 'ticker') {
      if (params?.resolution) {
        const resolution = normalizeResolution(params.resolution)
        socket.leave(`ticker:${params.chain}.${params.market}.${resolution}`)
      } else {
        Object.keys(resolutions).map(resolution => {
          socket.leave(`ticker:${params.chain}.${params.market}.${resolution}`)
        })
      }
    }

    if (room == 'swap-ticker') {
      if (params?.resolution) {
        const resolution = normalizeResolution(params.resolution)
        socket.leave(`swap-ticker:${params.chain}.${params.pool}.${resolution}`)
      } else {
        Object.keys(resolutions).map(resolution => {
          socket.leave(`swap-ticker:${params.chain}.${params.pool}.${resolution}`)
        })
      }
    }
    if (room == 'swap-ticker-v2') {
      if (params?.resolution) {
        const resolution = normalizeResolution(params.resolution)
        socket.leave(`swap-ticker-v2:${params.chain}.${params.pool}.${resolution}`)
      } else {
        Object.keys(resolutions).map(resolution => {
          socket.leave(`swap-ticker-v2:${params.chain}.${params.pool}.${resolution}`)
        })
      }
    }

    if (room == 'orders') {
      socket.leave(`orders:${params.chain}.${params.market}`)
    }

    if (room == 'pools') {
      socket.leave(`pools:${params.chain}`)
    }

    if (room == 'account') {
      socket.leave(`account:${params.chain}.${params.name}`)
    }

    if (room == 'orderbook') {
      const { chain, market } = params

      socket.leave(`orderbook:${chain}.buy.${market}`)
      socket.leave(`orderbook:${chain}.sell.${market}`)
    }

    if (room == 'swap') {
      if (params.allPools) {
        socket.leave(`swap:${params.chain}`)
      } else {
        socket.leave(`swap:${params.chain}.${params.poolId}`)
      }
    }
  })
}
