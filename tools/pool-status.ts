import fetch from 'cross-fetch'

// Alcor AMM positions of an account: amounts, range status, pool price vs Binance, pool TVL and volume.
// Usage: npx tsx tools/pool-status.ts [chain] [account]

const BINANCE_SYMBOLS: Record<string, string> = {
  WAX: 'WAXPUSDT',
  BNB: 'BNBUSDT',
  ETH: 'ETHUSDT',
  WAXETH: 'ETHUSDT',
  WETH: 'ETHUSDT',
  BTC: 'BTCUSDT',
  WBTC: 'BTCUSDT',
  WAXWBTC: 'BTCUSDT',
  POL: 'POLUSDT',
  USDC: 'USDCUSDT',
  WAXUSDC: 'USDCUSDT',
}

const PEGGED_TO_USDT = new Set(['USDT', 'WAXUSDT'])

async function getJson(url: string) {
  const res = await fetch(url, { headers: { 'User-Agent': 'alcor-tools' } })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return res.json()
}

async function getBinancePrices(): Promise<Record<string, number>> {
  const tickers = await getJson('https://api.binance.com/api/v3/ticker/price')
  const prices: Record<string, number> = {}
  for (const { symbol, price } of tickers) prices[symbol] = parseFloat(price)
  return prices
}

// Market price of a token in USDT, or null when Binance has no reference for it
function marketPrice(symbol: string, binance: Record<string, number>): number | null {
  if (PEGGED_TO_USDT.has(symbol)) return 1
  const pair = BINANCE_SYMBOLS[symbol]
  return pair && binance[pair] ? binance[pair] : null
}

function formatDeviation(poolPrice: number, symbolA: string, symbolB: string, binance: Record<string, number>) {
  const a = marketPrice(symbolA, binance)
  const b = marketPrice(symbolB, binance)
  if (a === null || b === null) return 'нет цены на Binance'

  const deviation = (poolPrice / (a / b) - 1) * 100
  const flag = Math.abs(deviation) > 1 ? ' ⚠️' : ''
  return `рынок ${(a / b).toPrecision(6)} (${deviation >= 0 ? '+' : ''}${deviation.toFixed(2)}%)${flag}`
}

const usd = (value: number) => '$' + Math.round(value).toLocaleString('en-US')

async function main() {
  const [chain = 'wax', account = 'alcordexfund'] = process.argv.slice(2)
  const api = `https://${chain}.alcor.exchange/api/v2`

  console.log(`📡 Позиции ${account} на ${chain}...\n`)

  const [positions, pools, binance] = await Promise.all([
    getJson(`${api}/account/${account}/positions`),
    getJson(`${api}/swap/pools`),
    getBinancePrices(),
  ])

  const poolsById = new Map(pools.map(p => [p.id, p]))
  const byPool = new Map<number, any[]>()
  for (const position of positions) {
    if (!byPool.has(position.pool)) byPool.set(position.pool, [])
    byPool.get(position.pool).push(position)
  }

  let totalValue = 0
  const outOfRange = []

  for (const [poolId, poolPositions] of byPool) {
    const pool: any = poolsById.get(poolId)
    if (!pool) {
      console.log(`❓ Пул ${poolId} не найден в /swap/pools\n`)
      continue
    }

    const { tokenA, tokenB } = pool
    const poolValue = poolPositions.reduce((sum, p) => sum + p.totalValue, 0)
    totalValue += poolValue

    console.log(`🏊 ${poolId} ${tokenA.symbol}/${tokenB.symbol} ${pool.fee / 10000}%  ` +
      `цена ${pool.priceA.toPrecision(6)}, ${formatDeviation(pool.priceA, tokenA.symbol, tokenB.symbol, binance)}`)
    console.log(`   пул: ${tokenA.quantity} ${tokenA.symbol} / ${tokenB.quantity} ${tokenB.symbol}, ` +
      `TVL ${usd(pool.tvlUSD)}, объём 24ч ${usd(pool.volumeUSD24)}, 7д ${usd(pool.volumeUSDWeek)}`)

    for (const p of poolPositions) {
      const status = p.inRange ? '✅ в диапазоне' : '⛔ вне диапазона'
      console.log(`   #${p.id} [${p.tickLower}, ${p.tickUpper}] ${status}: ` +
        `${p.amountA} + ${p.amountB} = ${usd(p.totalValue)}, комиссии ${usd(p.totalFeesUSD)}`)
      if (!p.inRange) outOfRange.push(p.id)
    }
    console.log()
  }

  console.log(`💰 Всего в позициях: ${usd(totalValue)} (${positions.length} позиций в ${byPool.size} пулах)`)
  if (outOfRange.length) console.log(`⛔ Вне диапазона: ${outOfRange.map(id => '#' + id).join(', ')}`)
}

main().catch(e => {
  console.error('❌', e.message)
  process.exit(1)
})
