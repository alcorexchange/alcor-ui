// TODO TS Support
import JSBI from 'jsbi'
import { parseUnits } from '@ethersproject/units'

import { Pool, Token, Price, TickMath, encodeSqrtRatioX64, priceToClosestTick, nearestUsableTick, TICK_SPACINGS, CurrencyAmount, tickToPrice } from '@alcorexchange/alcor-swap-sdk'

const PRICE_FIXED_DIGITS = 8

export function parseToken(token) {
  const [amount, symbol] = token.quantity.split(' ')

  const decimal = amount.split('.')
  const precision = decimal[1] ? decimal[1].length : 0

  return new Token(
    token.contract,
    precision,
    symbol,
    (symbol + '-' + token.contract).toLowerCase()
  )
}

export function getTickToPrice(baseToken, quoteToken, tick) {
  if (!baseToken || !quoteToken || typeof tick !== 'number') {
    return undefined
  }
  return tickToPrice(baseToken, quoteToken, tick)
}

export function getPoolBounds(feeAmount) {
  return {
    LOWER: feeAmount ? nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]) : undefined,
    UPPER: feeAmount ? nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]) : undefined
  }
}

export function tryParseCurrencyAmount(value, currency) {
  if (!value || !currency) {
    return undefined
  }

  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString()
    if (typedValueParsed !== '0') {
      return CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(typedValueParsed))
    }
  } catch (error) {
    // fails if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error)
  }
  return undefined
}

export function tryParsePrice(baseToken, quoteToken, value) {
  if (!baseToken || !quoteToken || !value) {
    return undefined
  }

  if (!value.match(/^\d*\.?\d+$/)) {
    return undefined
  }

  const [whole, fraction] = value.split('.')

  const decimals = fraction?.length ?? 0
  const withoutDecimals = JSBI.BigInt((whole ?? '') + (fraction ?? ''))

  return new Price(
    baseToken,
    quoteToken,
    JSBI.multiply(JSBI.BigInt(10 ** decimals), JSBI.BigInt(10 ** baseToken.decimals)),
    JSBI.multiply(withoutDecimals, JSBI.BigInt(10 ** quoteToken.decimals))
  )
}

export function tryParseTick(
  baseToken,
  quoteToken,
  feeAmount,
  value
) {
  if (!baseToken || !quoteToken || !feeAmount || !value) {
    return undefined
  }

  // console.log('tryParseTick', { baseToken, quoteToken, value })

  const price = tryParsePrice(baseToken, quoteToken, value)

  if (!price) {
    return undefined
  }

  let tick

  // check price is within min/max bounds, if outside return min/max
  const sqrtRatioX64 = encodeSqrtRatioX64(price.numerator, price.denominator)

  if (JSBI.greaterThanOrEqual(sqrtRatioX64, TickMath.MAX_SQRT_RATIO)) {
    tick = TickMath.MAX_TICK
  } else if (JSBI.lessThanOrEqual(sqrtRatioX64, TickMath.MIN_SQRT_RATIO)) {
    tick = TickMath.MIN_TICK
  } else {
    // this function is agnostic to the base, will always return the correct tick
    tick = priceToClosestTick(price)
  }

  return nearestUsableTick(tick, TICK_SPACINGS[feeAmount])
}

export function isTicksAtLimit(
  feeAmount,
  tickLower,
  tickUpper
) {
  return {
    LOWER:
      feeAmount && tickLower
        ? tickLower ===
          nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount])
        : undefined,

    UPPER:
      feeAmount && tickUpper
        ? tickUpper ===
          nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount])
        : undefined
  }
}

export function isPriceInvalid(price) {
  if (!price) return undefined

  const sqrtRatioX96 = price ? encodeSqrtRatioX64(price.numerator, price.denominator) : undefined

  return (
    price &&
    sqrtRatioX96 &&
    !(
      JSBI.greaterThanOrEqual(sqrtRatioX96, TickMath.MIN_SQRT_RATIO) &&
      JSBI.lessThan(sqrtRatioX96, TickMath.MAX_SQRT_RATIO)
    )
  )
}

const getActiveTick = (tickCurrent, feeAmount) =>
  tickCurrent && feeAmount ? Math.floor(tickCurrent / TICK_SPACINGS[feeAmount]) * TICK_SPACINGS[feeAmount] : undefined


export function getLiquidityRangeChart(pool, tokenA, tokenB) {
  // Find nearest valid tick for pool in case tick is not initialized.
  const activeTick = getActiveTick(pool.tickCurrent, pool.fee)

  const ticks = pool.tickDataProvider.ticks

  if (
    !tokenA ||
    !tokenB ||
    activeTick === undefined ||
    !pool ||
    !ticks ||
    ticks.length === 0
  ) {
    return undefined
  }

  // find where the active tick would be to partition the array
  // if the active tick is initialized, the pivot will be an element
  // if not, take the previous tick as pivot
  const pivot = ticks.findIndex(({ id }) => id > activeTick) - 1

  if (pivot < 0) {
    // consider setting a local error
    console.error('TickData pivot not found')
    return undefined
  }

  const activeTickProcessed = {
    liquidityActive: JSBI.BigInt(pool.liquidity ?? 0),
    tick: activeTick,
    liquidityNet: Number(ticks[pivot].id) === activeTick ? JSBI.BigInt(ticks[pivot].liquidityNet) : JSBI.BigInt(0),
    price0: tickToPrice(tokenA, tokenB, activeTick).toFixed(PRICE_FIXED_DIGITS),
  }

  const subsequentTicks = computeSurroundingTicks(tokenA, tokenB, activeTickProcessed, ticks, pivot, true)
  const previousTicks = computeSurroundingTicks(tokenA, tokenB, activeTickProcessed, ticks, pivot, false)
  const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks)

  return ticksProcessed
}

// Computes the numSurroundingTicks above or below the active tick.
export default function computeSurroundingTicks(
  tokenA,
  tokenB,
  activeTickProcessed,
  sortedTickData,
  pivot,
  ascending
) {
  let previousTickProcessed = {
    ...activeTickProcessed,
  }
  // Iterate outwards (either up or down depending on direction) from the active tick,
  // building active liquidity for every tick.
  let processedTicks = []
  for (let i = pivot + (ascending ? 1 : -1); ascending ? i < sortedTickData.length : i >= 0; ascending ? i++ : i--) {
    const tick = Number(sortedTickData[i].id)
    const currentTickProcessed = {
      liquidityActive: previousTickProcessed.liquidityActive,
      tick,
      liquidityNet: JSBI.BigInt(sortedTickData[i].liquidityNet),
      price0: tickToPrice(tokenA, tokenB, tick).toFixed(PRICE_FIXED_DIGITS),
    }

    // Update the active liquidity.
    // If we are iterating ascending and we found an initialized tick we immediately apply
    // it to the current processed tick we are building.
    // If we are iterating descending, we don't want to apply the net liquidity until the following tick.
    if (ascending) {
      currentTickProcessed.liquidityActive = JSBI.add(
        previousTickProcessed.liquidityActive,
        JSBI.BigInt(sortedTickData[i].liquidityNet)
      )
    } else if (!ascending && JSBI.notEqual(previousTickProcessed.liquidityNet, JSBI.BigInt(0))) {
      // We are iterating descending, so look at the previous tick and apply any net liquidity.
      currentTickProcessed.liquidityActive = JSBI.subtract(
        previousTickProcessed.liquidityActive,
        previousTickProcessed.liquidityNet
      )
    }

    processedTicks.push(currentTickProcessed)
    previousTickProcessed = currentTickProcessed
  }

  if (!ascending) {
    processedTicks = processedTicks.reverse()
  }

  return processedTicks
}

// Awoid braking BigInt because of getters
export function constructPoolInstance(row) {
  const { tokenA, tokenB, currSlot: { sqrtPriceX64, tick } } = row

  return new Pool({
    ...row,

    tokenA: parseToken(tokenA),
    tokenB: parseToken(tokenB),
    sqrtPriceX64,
    tickCurrent: tick,
  })
}
