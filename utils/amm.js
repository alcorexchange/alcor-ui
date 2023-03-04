// TODO TS Support
import JSBI from 'jsbi'
import { parseUnits } from '@ethersproject/units'
import { asset } from 'eos-common'

import { Token, Price, TickMath, encodeSqrtRatioX64, priceToClosestTick, nearestUsableTick, TICK_SPACINGS, CurrencyAmount, tickToPrice } from '~/assets/libs/swap-sdk'

export function parseToken(token) {
  return new Token(
    token.contract,
    asset(token.quantity).symbol.precision(),
    asset(token.quantity).symbol.code().to_string(),
    (asset(token.quantity).symbol.code().to_string() + '-' + token.contract).toLowerCase()
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
