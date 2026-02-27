function toFiniteNumber(value: any, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function getTokenUsdPrice(token: any) {
  const safe = toFiniteNumber(token?.safe_usd_price, NaN)
  if (Number.isFinite(safe)) return safe
  return toFiniteNumber(token?.usd_price, 0)
}

function isTrustedToken(
  token: any,
  tokenId: string,
  baseTokenId: string,
  usdTokenId: string | null,
  minScore: number
) {
  if (tokenId === baseTokenId) return true
  if (usdTokenId && tokenId === usdTokenId) return true
  if (token?.is_scam === true) return false
  if (token?.is_trusted === true) return true

  const score = toFiniteNumber(token?.score, 0)
  return score > minScore
}

function getBaseLiquidityUsd(pool: any, baseTokenId: string, usdTokenId: string | null, baseTokenUsdPrice: number) {
  const tokenAId = String(pool?.tokenA?.id || '')
  const tokenBId = String(pool?.tokenB?.id || '')
  const tokenAQty = toFiniteNumber(pool?.tokenA?.quantity, 0)
  const tokenBQty = toFiniteNumber(pool?.tokenB?.quantity, 0)

  if (tokenAId === baseTokenId) return tokenAQty * baseTokenUsdPrice
  if (tokenBId === baseTokenId) return tokenBQty * baseTokenUsdPrice
  if (usdTokenId && tokenAId === usdTokenId) return tokenAQty
  if (usdTokenId && tokenBId === usdTokenId) return tokenBQty

  return 0
}

export function computeSafePoolTvlUSD(pool: any, tokenMap: Map<string, any>, network: any) {
  const trustedScoreMin = toFiniteNumber(process.env.TOKEN_TRUSTED_SCORE_MIN, 40)
  const smallPoolBaseLiquidityUsd = toFiniteNumber(process.env.POOL_SMALL_BASE_LIQUIDITY_USD, 100)

  const baseTokenId = `${network.baseToken.symbol}-${network.baseToken.contract}`.toLowerCase()
  const usdTokenId = network.USD_TOKEN || null

  const tokenAId = String(pool?.tokenA?.id || '')
  const tokenBId = String(pool?.tokenB?.id || '')
  const tokenA = tokenMap.get(tokenAId)
  const tokenB = tokenMap.get(tokenBId)

  const tokenAQty = toFiniteNumber(pool?.tokenA?.quantity, 0)
  const tokenBQty = toFiniteNumber(pool?.tokenB?.quantity, 0)
  const tokenAUsd = getTokenUsdPrice(tokenA)
  const tokenBUsd = getTokenUsdPrice(tokenB)

  const baseTokenUsdPrice = tokenAId === baseTokenId
    ? tokenAUsd
    : tokenBId === baseTokenId
      ? tokenBUsd
      : 0

  const baseLiquidityUsd = getBaseLiquidityUsd(pool, baseTokenId, usdTokenId, baseTokenUsdPrice)
  if (tokenA?.is_scam === true || tokenB?.is_scam === true) return 0
  const trustedA = isTrustedToken(tokenA, tokenAId, baseTokenId, usdTokenId, trustedScoreMin)
  const trustedB = isTrustedToken(tokenB, tokenBId, baseTokenId, usdTokenId, trustedScoreMin)

  if (!trustedA || !trustedB) {
    if (baseLiquidityUsd > 0) return Number((baseLiquidityUsd * 2).toFixed(8))
    return 0
  }

  if (baseLiquidityUsd > 0 && baseLiquidityUsd < smallPoolBaseLiquidityUsd) {
    return Number((baseLiquidityUsd * 2).toFixed(8))
  }

  const tvl = tokenAQty * tokenAUsd + tokenBQty * tokenBUsd
  if (!Number.isFinite(tvl) || tvl < 0) return 0
  return Number(tvl.toFixed(8))
}
