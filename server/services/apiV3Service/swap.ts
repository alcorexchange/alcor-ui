import { Router } from 'express'
import { tickToPrice } from '@alcorexchange/alcor-swap-sdk'

import { getPoolInstance } from '../swapV2Service/utils'
import { getLiquidityRangeChart } from '../../../utils/amm.js'

export const swap = Router()

const DEFAULT_BIN_COUNT = 120
const MAX_BIN_COUNT = 300
const DEFAULT_PRICE_MODE = 'quotePerBase'

const MIN_ABS_PRICE = 1e-12
const MAX_ABS_PRICE = 1e12

const FOCUS_MAX_RATIO = 10
const EMPTY_MIN_RATIO = 0.5
const EMPTY_MAX_RATIO = 2
const RANGE_EPSILON = 1e-6

type PriceMode = 'quotePerBase' | 'basePerQuote'
type Segment = {
  priceLower: number
  priceUpper: number
  liquidity: number
}

type Bin = {
  priceLower: number
  priceUpper: number
  liquidity: number
}

function parsePriceMode(value): PriceMode | null {
  if (value === undefined || value === null || value === '') return DEFAULT_PRICE_MODE
  const mode = String(value).trim()
  if (mode === 'quotePerBase' || mode === 'basePerQuote') return mode
  return null
}

function parseBinCount(value): number {
  if (value === undefined || value === null || value === '') return DEFAULT_BIN_COUNT

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_BIN_COUNT

  return Math.min(Math.floor(parsed), MAX_BIN_COUNT)
}

function clampPrice(value): number | null {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.min(Math.max(n, MIN_ABS_PRICE), MAX_ABS_PRICE)
}

function safeInverse(value): number | null {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= MIN_ABS_PRICE) return null
  return clampPrice(1 / n)
}

function fallbackPriceRange(currentPrice: number) {
  const minPrice = clampPrice(currentPrice * EMPTY_MIN_RATIO) ?? MIN_ABS_PRICE
  const maxPrice = clampPrice(currentPrice * EMPTY_MAX_RATIO) ?? MAX_ABS_PRICE

  if (maxPrice > minPrice) {
    return { minPrice, maxPrice }
  }

  const safeMin = Math.max(MIN_ABS_PRICE, minPrice)
  const safeMax = Math.min(MAX_ABS_PRICE, safeMin * 2)
  return safeMax > safeMin
    ? { minPrice: safeMin, maxPrice: safeMax }
    : { minPrice: MIN_ABS_PRICE, maxPrice: Math.min(MAX_ABS_PRICE, MIN_ABS_PRICE * 2) }
}

function readCurrentPriceQuotePerBase(pool): number {
  const direct = clampPrice(pool?.priceA)
  if (direct) return direct

  const inverseSource = clampPrice(pool?.priceB)
  if (inverseSource) {
    const inverted = safeInverse(inverseSource)
    if (inverted) return inverted
  }

  try {
    const fromTick = clampPrice(
      Number(tickToPrice(pool.tokenA, pool.tokenB, Number(pool.tickCurrent)).toSignificant(18))
    )
    if (fromTick) return fromTick
  } catch (e) {}

  return 1
}

function buildSegmentsQuotePerBase(pool): Segment[] {
  const chart = getLiquidityRangeChart(pool, pool.tokenA, pool.tokenB) || []
  if (!Array.isArray(chart) || chart.length < 2) return []

  const points: Array<{ price: number, liquidity: number }> = []

  for (const point of chart) {
    const tick = Number(point?.tick)
    if (!Number.isFinite(tick)) continue

    let price = null
    try {
      price = clampPrice(Number(tickToPrice(pool.tokenA, pool.tokenB, tick).toSignificant(18)))
    } catch (e) {}
    if (!price) {
      price = clampPrice(point?.price0)
    }
    if (!price) continue

    let liquidity = Number(point?.liquidityActive ?? 0)
    if (!Number.isFinite(liquidity) || liquidity < 0) liquidity = 0

    points.push({ price, liquidity })
  }

  if (points.length < 2) return []

  points.sort((a, b) => a.price - b.price)

  const deduped: Array<{ price: number, liquidity: number }> = []
  for (const point of points) {
    const prev = deduped[deduped.length - 1]
    if (prev && point.price === prev.price) {
      prev.liquidity = point.liquidity
      continue
    }
    deduped.push(point)
  }

  if (deduped.length < 2) return []

  const segments: Segment[] = []

  for (let i = 0; i < deduped.length - 1; i++) {
    const current = deduped[i]
    const next = deduped[i + 1]

    if (!Number.isFinite(current.price) || !Number.isFinite(next.price)) continue
    if (next.price <= current.price) continue

    const lower = current.price
    const upper = next.price
    if (upper <= lower) continue

    const liquidity = Number.isFinite(current.liquidity) && current.liquidity >= 0 ? current.liquidity : 0

    segments.push({
      priceLower: lower,
      priceUpper: upper,
      liquidity,
    })
  }

  return segments
}

function sanitizeSegments(segments: Segment[]): Segment[] {
  return segments
    .map((segment) => {
      const priceLower = clampPrice(segment.priceLower)
      const priceUpper = clampPrice(segment.priceUpper)
      if (!priceLower || !priceUpper || priceUpper <= priceLower) return null

      let liquidity = Number(segment.liquidity)
      if (!Number.isFinite(liquidity) || liquidity < 0) liquidity = 0

      return { priceLower, priceUpper, liquidity }
    })
    .filter(Boolean)
    .sort((a, b) => a.priceLower - b.priceLower) as Segment[]
}

function ensureRangeContainsPrice(
  range: { minPrice: number, maxPrice: number },
  currentPrice: number
) {
  let minPrice = clampPrice(range.minPrice) ?? MIN_ABS_PRICE
  let maxPrice = clampPrice(range.maxPrice) ?? MAX_ABS_PRICE

  if (!(maxPrice > minPrice)) {
    return fallbackPriceRange(currentPrice)
  }

  if (currentPrice <= minPrice) {
    minPrice = clampPrice(currentPrice * (1 - RANGE_EPSILON)) ?? minPrice
  }
  if (currentPrice >= maxPrice) {
    maxPrice = clampPrice(currentPrice * (1 + RANGE_EPSILON)) ?? maxPrice
  }

  if (!(maxPrice > minPrice) || currentPrice <= minPrice || currentPrice >= maxPrice) {
    return fallbackPriceRange(currentPrice)
  }

  return { minPrice, maxPrice }
}

function chooseFocusedRange(segments: Segment[], currentPrice: number) {
  const hardMin = clampPrice(currentPrice / FOCUS_MAX_RATIO) ?? MIN_ABS_PRICE
  const hardMax = clampPrice(currentPrice * FOCUS_MAX_RATIO) ?? MAX_ABS_PRICE

  if (hardMax <= hardMin) {
    return fallbackPriceRange(currentPrice)
  }

  if (!segments.length) {
    return ensureRangeContainsPrice({ minPrice: hardMin, maxPrice: hardMax }, currentPrice)
  }

  const aroundCurrent = segments.filter((segment) => (
    segment.priceUpper > hardMin && segment.priceLower < hardMax
  ))

  if (!aroundCurrent.length) {
    return ensureRangeContainsPrice({ minPrice: hardMin, maxPrice: hardMax }, currentPrice)
  }

  const minPrice = Math.max(aroundCurrent[0].priceLower, hardMin)
  const maxPrice = Math.min(aroundCurrent[aroundCurrent.length - 1].priceUpper, hardMax)

  return ensureRangeContainsPrice({ minPrice, maxPrice }, currentPrice)
}

function invertSegments(segments: Segment[]): Segment[] {
  return sanitizeSegments(
    segments
      .map((segment) => {
        const priceLower = safeInverse(segment.priceUpper)
        const priceUpper = safeInverse(segment.priceLower)
        if (!priceLower || !priceUpper || priceUpper <= priceLower) return null
        return {
          priceLower,
          priceUpper,
          liquidity: segment.liquidity,
        }
      })
      .filter(Boolean) as Segment[]
  )
}

function buildBinsFromSegments(
  segments: Segment[],
  binCount: number,
  range: { minPrice: number, maxPrice: number }
): Bin[] {
  if (!segments.length || binCount <= 0) return []

  const minPrice = range.minPrice
  const maxPrice = range.maxPrice
  if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || maxPrice <= minPrice) return []

  const binWidth = (maxPrice - minPrice) / binCount
  if (!Number.isFinite(binWidth) || binWidth <= 0) return []

  const bins: Bin[] = []

  for (let i = 0; i < binCount; i++) {
    const priceLower = minPrice + (i * binWidth)
    const priceUpper = i === binCount - 1 ? maxPrice : minPrice + ((i + 1) * binWidth)
    const width = priceUpper - priceLower
    if (!Number.isFinite(width) || width <= 0) continue

    let weightedLiquidity = 0

    for (const segment of segments) {
      if (segment.priceUpper <= priceLower || segment.priceLower >= priceUpper) continue

      const overlapLower = Math.max(priceLower, segment.priceLower)
      const overlapUpper = Math.min(priceUpper, segment.priceUpper)
      const overlap = overlapUpper - overlapLower
      if (overlap <= 0) continue

      weightedLiquidity += segment.liquidity * overlap
    }

    let liquidity = weightedLiquidity / width
    if (!Number.isFinite(liquidity) || liquidity < 0) liquidity = 0

    bins.push({ priceLower, priceUpper, liquidity })
  }

  return bins
}

function sanitizeBins(bins: Bin[]): Bin[] {
  const sanitized: Bin[] = []

  for (const bin of bins) {
    const priceLower = clampPrice(bin.priceLower)
    const priceUpper = clampPrice(bin.priceUpper)
    if (!priceLower || !priceUpper || priceUpper <= priceLower) continue

    let liquidity = Number(bin.liquidity)
    if (!Number.isFinite(liquidity) || liquidity < 0) liquidity = 0

    sanitized.push({ priceLower, priceUpper, liquidity })
  }

  if (!sanitized.length) return []

  sanitized.sort((a, b) => a.priceLower - b.priceLower)

  const normalized: Bin[] = [
    {
      priceLower: sanitized[0].priceLower,
      priceUpper: sanitized[0].priceUpper,
      liquidity: sanitized[0].liquidity,
    },
  ]

  for (let i = 1; i < sanitized.length; i++) {
    const prev = normalized[normalized.length - 1]
    const curr = sanitized[i]
    const priceLower = prev.priceUpper
    const priceUpper = curr.priceUpper
    if (priceUpper <= priceLower) continue

    normalized.push({
      priceLower,
      priceUpper,
      liquidity: curr.liquidity,
    })
  }

  return normalized
}

function getRangeFromSegments(segments: Segment[] | Bin[]) {
  if (!segments.length) return null

  const minPrice = clampPrice(segments[0].priceLower)
  const maxPrice = clampPrice(segments[segments.length - 1].priceUpper)

  if (!minPrice || !maxPrice || maxPrice <= minPrice) return null
  return { minPrice, maxPrice }
}

swap.get('/pools/:poolId/liquidity-distribution', async (req, res) => {
  const network = req.app.get('network')
  const rawPoolId = String(req.params.poolId ?? '')
  const poolId = Number.parseInt(rawPoolId, 10)

  if (!/^\d+$/.test(rawPoolId) || !Number.isFinite(poolId)) {
    res.status(400).json({ error: 'Invalid pool id' })
    return
  }

  const priceMode = parsePriceMode(req.query.priceMode)
  if (!priceMode) {
    res.status(400).json({ error: 'Invalid priceMode. Allowed: quotePerBase, basePerQuote' })
    return
  }

  const requestedBinCount = parseBinCount(req.query.bins)

  try {
    const pool: any = await getPoolInstance(network.name, poolId)
    if (!pool) {
      res.status(404).json({ error: 'Pool not found' })
      return
    }

    const currentQuotePerBase = readCurrentPriceQuotePerBase(pool)
    const quoteSegments = sanitizeSegments(buildSegmentsQuotePerBase(pool))

    let currentPrice = priceMode === 'basePerQuote'
      ? (safeInverse(currentQuotePerBase) ?? 1)
      : currentQuotePerBase
    currentPrice = clampPrice(currentPrice) ?? 1

    const modeSegments = priceMode === 'basePerQuote'
      ? invertSegments(quoteSegments)
      : quoteSegments

    const nonZeroSegments = modeSegments.filter((segment) => segment.liquidity > 0)
    const hasPositiveLiquidity = nonZeroSegments.length > 0

    let focusedRange = chooseFocusedRange(hasPositiveLiquidity ? nonZeroSegments : modeSegments, currentPrice)
    focusedRange = ensureRangeContainsPrice(focusedRange, currentPrice)

    const responseBins = hasPositiveLiquidity
      ? sanitizeBins(buildBinsFromSegments(modeSegments, requestedBinCount, focusedRange))
      : []

    let minPrice = focusedRange.minPrice
    let maxPrice = focusedRange.maxPrice

    if (responseBins.length) {
      minPrice = responseBins[0].priceLower
      maxPrice = responseBins[responseBins.length - 1].priceUpper
    } else {
      const fallbackRange = getRangeFromSegments(modeSegments) || focusedRange
      minPrice = fallbackRange.minPrice
      maxPrice = fallbackRange.maxPrice
    }

    const safeFinalRange = ensureRangeContainsPrice({ minPrice, maxPrice }, currentPrice)
    minPrice = safeFinalRange.minPrice
    maxPrice = safeFinalRange.maxPrice

    const updatedAt = new Date().toISOString()

    res.json({
      poolId,
      chain: network.name,
      priceMode,
      currentPrice,
      minPrice,
      maxPrice,
      bins: responseBins,
      meta: {
        updatedAt,
        binCount: responseBins.length,
      },
    })
  } catch (err) {
    console.error('Error in v3 liquidity distribution:', err)
    res.status(500).json({ error: 'Failed to load liquidity distribution' })
  }
})
