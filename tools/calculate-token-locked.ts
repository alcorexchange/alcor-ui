require('dotenv').config()
import mongoose from 'mongoose'
import { Market } from './models'
import { networks } from '../config'
import { littleEndianToDesimal, parseAsset } from '../utils'
import { fetchAllRows } from '../utils/eosjs'
import { mongoConnect } from './utils'
import { JsonRpc } from '../assets/libs/eosjs-jsonrpc'
import fetch from 'cross-fetch'

function getFailOverAlcorOnlyRpc(network) {
  const nodes = [network.protocol + '://' + network.host + ':' + network.port]
    .concat(Object.keys(network.client_nodes))
    .filter(n => n.includes('alcor'))

  const rpc = new JsonRpc(nodes.length > 0 ? nodes : [network.protocol + '://' + network.host + ':' + network.port], { fetch })
  return rpc
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

async function calculateMarketLockedToken(market, tokenId, tokenSymbol) {
  const isTokenBase = market.base_token.id === tokenId

  // Выбираем правильную сторону в зависимости от позиции токена
  // Token = BASE → buyorder (в BID будет этот токен)
  // Token = QUOTE → sellorder (в BID будет этот токен)
  const side = isTokenBase ? 'buy' : 'sell'

  console.log(`  Токен позиция: ${isTokenBase ? 'BASE' : 'QUOTE'}`)
  console.log(`  Запрашиваем таблицу: ${side}order`)

  const orders = await getOrders({ chain: market.chain, market_id: market.id, side })

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

    // Суммируем токен из BID
    let totalAmount = 0
    orders.forEach(order => {
      totalAmount += order.bid.amount
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
    console.error('❌ Использование: npx tsx server/calculate-token-locked.ts <chain> <token_id>')
    console.error('   Пример: npx tsx server/calculate-token-locked.ts proton xpr-eosio.token')
    process.exit(1)
  }

  const [chain, tokenId] = args

  try {
    await mongoConnect()
    console.log('✅ Connected to MongoDB')

    // Получаем все маркеты с этим токеном
    const markets = await Market.find({
      chain,
      $or: [
        { 'base_token.id': tokenId },
        { 'quote_token.id': tokenId }
      ]
    })

    if (markets.length === 0) {
      console.log(`\n❌ Маркеты с токеном ${tokenId} на блокчейне ${chain} не найдены`)
      await mongoose.disconnect()
      return
    }

    console.log(`\n✅ Найдено ${markets.length} маркетов с токеном ${tokenId}\n`)

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

    for (const market of markets) {
      console.log(`\n${'='.repeat(80)}`)
      console.log(`Маркет ID: ${market.id}`)
      console.log(`Ticker: ${market.ticker_id}`)
      console.log(`Base: ${market.base_token.symbol.name} (${market.base_token.id})`)
      console.log(`Quote: ${market.quote_token.symbol.name} (${market.quote_token.id})`)
      console.log('='.repeat(80))

      const result = await calculateMarketLockedToken(market, tokenId, tokenSymbol)
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

    await mongoose.disconnect()
  } catch (error) {
    console.error('❌ Ошибка:', error)
    await mongoose.disconnect()
    process.exit(1)
  }
}

main()
