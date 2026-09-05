require('dotenv').config()
import { networks } from '../config'
import { littleEndianToDesimal, parseAsset } from '../utils'
import { fetchAllRows } from '../utils/eosjs'
import { JsonRpc } from '../assets/libs/eosjs-jsonrpc'
import fetch from 'cross-fetch'

function getFailOverAlcorOnlyRpc(network) {
  const nodes = [network.protocol + '://' + network.host + ':' + network.port]
    .concat(Object.keys(network.client_nodes))
    .filter(n => n.includes('alcor'))

  const rpc = new JsonRpc(nodes.length > 0 ? nodes : [network.protocol + '://' + network.host + ':' + network.port], { fetch })
  return rpc
}

async function getMarkets(chain) {
  const network = networks[chain]
  const rpc = getFailOverAlcorOnlyRpc(network)

  console.log('📡 Запрашиваем маркеты из блокчейна...')

  const rows = await fetchAllRows(rpc, {
    code: network.contract,
    scope: network.contract,
    table: 'markets',
  })

  console.log(`✅ Получено ${rows.length} маркетов из блокчейна\n`)

  return rows
}

async function getOrders({ chain, market_id, side }) {
  const network = networks[chain]
  const rpc = getFailOverAlcorOnlyRpc(network)

  const rows = await fetchAllRows(rpc, {
    code: network.contract,
    scope: market_id,
    table: `${side}order`
  })

  return rows.map((b) => {
    b.ask = parseAsset(b.ask)
    b.bid = parseAsset(b.bid)
    b.unit_price = littleEndianToDesimal(b.unit_price)

    return b
  })
}

// Формируем token ID из контракта и символа в формате "symbol-contract"
function getTokenId(contract, symbolName) {
  return `${symbolName.toLowerCase()}-${contract}`
}

// Парсим sym формата "precision,SYMBOL" -> { symbol: "SYMBOL", precision: number }
function parseSym(sym) {
  const [precisionStr, symbol] = sym.split(',')
  return {
    symbol,
    precision: parseInt(precisionStr)
  }
}

function parseMarket(raw) {
  // Парсим base токен из sym
  const baseSymbol = parseSym(raw.base_token.sym)
  const baseTokenId = getTokenId(raw.base_token.contract, baseSymbol.symbol)

  // Парсим quote токен из sym
  const quoteSymbol = parseSym(raw.quote_token.sym)
  const quoteTokenId = getTokenId(raw.quote_token.contract, quoteSymbol.symbol)

  return {
    id: raw.id,
    base_token: {
      id: baseTokenId,
      contract: raw.base_token.contract,
      symbol: {
        name: baseSymbol.symbol,
        precision: baseSymbol.precision
      }
    },
    quote_token: {
      id: quoteTokenId,
      contract: raw.quote_token.contract,
      symbol: {
        name: quoteSymbol.symbol,
        precision: quoteSymbol.precision
      }
    }
  }
}

async function calculateMarketLockedToken(market, tokenId, tokenSymbol, chain, holdersMap) {
  const isTokenBase = market.base_token.id === tokenId

  // Выбираем правильную сторону в зависимости от позиции токена
  // Token = BASE → buyorder (в BID будет этот токен)
  // Token = QUOTE → sellorder (в BID будет этот токен)
  const side = isTokenBase ? 'buy' : 'sell'

  console.log(`  Токен позиция: ${isTokenBase ? 'BASE' : 'QUOTE'}`)
  console.log(`  Запрашиваем таблицу: ${side}order`)

  const orders = await getOrders({ chain, market_id: market.id, side })

  console.log(`  Найдено ${orders.length} ${side} ордеров`)

  // Проверяем первый ордер что в BID действительно наш токен
  if (orders.length > 0) {
    const firstOrder = orders[0]
    if (firstOrder.bid.symbol.symbol !== tokenSymbol) {
      console.log(`  ⚠️  ОШИБКА: В BID не ${tokenSymbol}, а ${firstOrder.bid.symbol.symbol}!`)
      return { amount: 0, precision: 0 }
    }

    // Получаем precision из первого ордера
    const precision = firstOrder.bid.symbol.precision

    // Суммируем токен из BID и собираем данные по держателям
    let totalAmount = 0
    orders.forEach(order => {
      totalAmount += order.bid.amount

      // Собираем данные по держателям
      if (!holdersMap[order.account]) {
        holdersMap[order.account] = 0
      }
      holdersMap[order.account] += order.bid.amount
    })

    const divisor = Math.pow(10, precision)
    const formatted = (totalAmount / divisor).toLocaleString('en-US', { maximumFractionDigits: precision })
    console.log(`  💰 Залочено ${tokenSymbol} (ID: ${market.id}): ${formatted} ${tokenSymbol} (raw: ${totalAmount})`)

    return { amount: totalAmount, precision }
  }

  return { amount: 0, precision: 0 }
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('❌ Использование: npx tsx tools/calculate-token-locked.ts <chain> <token_id>')
    console.error('   Пример: npx tsx tools/calculate-token-locked.ts proton xpr-eosio.token')
    process.exit(1)
  }

  const [chain, tokenIdInput] = args

  // Нормализуем token ID в lowercase
  const tokenId = tokenIdInput.toLowerCase()

  try {
    // Проверяем что сеть существует
    if (!networks[chain]) {
      console.error(`❌ Сеть "${chain}" не найдена в config`)
      process.exit(1)
    }

    // Получаем все маркеты из блокчейна
    const rawMarkets = await getMarkets(chain)

    // Парсим и фильтруем маркеты по токену
    const markets = rawMarkets
      .map(parseMarket)
      .filter(m => m.base_token.id === tokenId || m.quote_token.id === tokenId)

    if (markets.length === 0) {
      console.log(`\n❌ Маркеты с токеном ${tokenId} на блокчейне ${chain} не найдены`)
      return
    }

    console.log(`✅ Найдено ${markets.length} маркетов с токеном ${tokenId}\n`)

    // Получаем символ токена из первого маркета
    const firstMarket = markets[0]
    const isTokenBase = firstMarket.base_token.id === tokenId
    const tokenSymbol = isTokenBase
      ? firstMarket.base_token.symbol.name
      : firstMarket.quote_token.symbol.name
    const tokenPrecision = isTokenBase
      ? firstMarket.base_token.symbol.precision
      : firstMarket.quote_token.symbol.precision

    console.log(`Токен: ${tokenSymbol}`)
    console.log(`Token ID: ${tokenId}`)
    console.log(`Precision: ${tokenPrecision}\n`)

    let grandTotal = 0
    let processedCount = 0
    const holdersMap = {}

    for (const market of markets) {
      console.log(`\n${'='.repeat(80)}`)
      console.log(`Маркет ID: ${market.id}`)
      console.log(`Base: ${market.base_token.symbol.name} (${market.base_token.id})`)
      console.log(`Quote: ${market.quote_token.symbol.name} (${market.quote_token.id})`)
      console.log('='.repeat(80))

      const result = await calculateMarketLockedToken(market, tokenId, tokenSymbol, chain, holdersMap)
      grandTotal += result.amount
      processedCount++

      const divisor = Math.pow(10, tokenPrecision)
      console.log(`\n📊 Обработано маркетов: ${processedCount}/${markets.length}`)
      console.log(`💰 Текущая сумма ${tokenSymbol}: ${(grandTotal / divisor).toLocaleString('en-US', { maximumFractionDigits: tokenPrecision })} ${tokenSymbol}`)
    }

    const divisor = Math.pow(10, tokenPrecision)
    console.log(`\n\n${'='.repeat(80)}`)
    console.log(`📊 ИТОГО ЗАЛОЧЕНО ${tokenSymbol} (${processedCount} маркетов):`)
    console.log(`💰 ${(grandTotal / divisor).toLocaleString('en-US', { maximumFractionDigits: tokenPrecision })} ${tokenSymbol}`)
    console.log(`📝 Raw: ${grandTotal}`)
    console.log('='.repeat(80))

    // Топ 5 держателей
    const holders = Object.entries(holdersMap)
      .map(([account, amount]) => ({ account, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    if (holders.length > 0) {
      console.log(`\n\n${'='.repeat(80)}`)
      console.log(`👑 ТОП 5 ДЕРЖАТЕЛЕЙ ${tokenSymbol} (по всем парам в сумме):`)
      console.log('='.repeat(80))

      holders.forEach((holder, index) => {
        const formatted = (holder.amount / divisor).toLocaleString('en-US', { maximumFractionDigits: tokenPrecision })
        const percentage = ((holder.amount / grandTotal) * 100).toFixed(2)
        console.log(`${index + 1}. ${holder.account}`)
        console.log(`   💰 ${formatted} ${tokenSymbol} (${percentage}%)`)
        console.log(`   📝 Raw: ${holder.amount}`)
      })
      console.log('='.repeat(80))
    }
  } catch (error) {
    console.error('❌ Ошибка:', error)
    process.exit(1)
  }
}

main()
