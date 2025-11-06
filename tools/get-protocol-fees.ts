require('dotenv').config()
import { networks } from '../config'
import { parseAsset } from '../utils'
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

async function getPools(chain: string) {
  const network = networks[chain]
  const rpc = getFailOverAlcorOnlyRpc(network)

  console.log('📡 Запрашиваем пулы из блокчейна...')

  const rows = await fetchAllRows(rpc, {
    code: 'swap.alcor',
    scope: 'swap.alcor',
    table: 'pools',
  })

  console.log(`✅ Получено ${rows.length} пулов из блокчейна\n`)

  return rows
}

function parsePool(raw) {
  return {
    id: raw.id,
    tokenA: {
      contract: raw.tokenA.contract,
      symbol: raw.tokenA.quantity ? parseAsset(raw.tokenA.quantity).symbol.symbol : 'N/A',
      quantity: raw.tokenA.quantity ? parseAsset(raw.tokenA.quantity) : null
    },
    tokenB: {
      contract: raw.tokenB.contract,
      symbol: raw.tokenB.quantity ? parseAsset(raw.tokenB.quantity).symbol.symbol : 'N/A',
      quantity: raw.tokenB.quantity ? parseAsset(raw.tokenB.quantity) : null
    },
    protocolFeeA: parseAsset(raw.protocolFeeA),
    protocolFeeB: parseAsset(raw.protocolFeeB)
  }
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 1) {
    console.error('❌ Использование: npx tsx tools/get-protocol-fees.ts <chain>')
    console.error('   Пример: npx tsx tools/get-protocol-fees.ts wax')
    console.error('   Пример: npx tsx tools/get-protocol-fees.ts proton')
    process.exit(1)
  }

  const [chain] = args

  try {
    // Проверяем что сеть существует
    if (!networks[chain]) {
      console.error(`❌ Сеть "${chain}" не найдена в config`)
      console.error(`   Доступные сети: ${Object.keys(networks).join(', ')}`)
      process.exit(1)
    }

    const network = networks[chain]
    const rpcUrl = `${network.protocol}://${network.host}:${network.port}`

    // Получаем все пулы из блокчейна
    const rawPools = await getPools(chain)

    // Парсим пулы
    const pools = rawPools.map(parsePool)

    // Фильтруем пулы где есть протокольные комиссии
    const poolsWithFees = pools.filter(pool =>
      pool.protocolFeeA.amount > 0 || pool.protocolFeeB.amount > 0
    )

    if (poolsWithFees.length === 0) {
      console.log(`\n✅ Нет пулов с накопленными протокольными комиссиями на ${chain}`)
      return
    }

    console.log(`\n📊 Найдено ${poolsWithFees.length} пулов с протокольными комиссиями:\n`)
    console.log('='.repeat(80))

    let totalPools = 0
    const feesSummary = {}
    const claimCommands = []

    for (const pool of poolsWithFees) {
      totalPools++

      console.log(`\n🏊 Пул ID: ${pool.id}`)
      console.log(`   Token A: ${pool.tokenA.symbol} (${pool.tokenA.contract})`)
      console.log(`   Token B: ${pool.tokenB.symbol} (${pool.tokenB.contract})`)

      if (pool.protocolFeeA.amount > 0) {
        const feeA = pool.protocolFeeA
        const formattedA = (feeA.amount / Math.pow(10, feeA.symbol.precision)).toLocaleString('en-US', {
          maximumFractionDigits: feeA.symbol.precision
        })
        console.log(`   💰 Protocol Fee A: ${formattedA} ${feeA.symbol.symbol}`)

        // Суммируем по токенам
        const key = `${feeA.symbol.symbol}-${pool.tokenA.contract}`
        if (!feesSummary[key]) {
          feesSummary[key] = {
            symbol: feeA.symbol.symbol,
            contract: pool.tokenA.contract,
            amount: 0,
            precision: feeA.symbol.precision
          }
        }
        feesSummary[key].amount += feeA.amount
      }

      if (pool.protocolFeeB.amount > 0) {
        const feeB = pool.protocolFeeB
        const formattedB = (feeB.amount / Math.pow(10, feeB.symbol.precision)).toLocaleString('en-US', {
          maximumFractionDigits: feeB.symbol.precision
        })
        console.log(`   💰 Protocol Fee B: ${formattedB} ${feeB.symbol.symbol}`)

        // Суммируем по токенам
        const key = `${feeB.symbol.symbol}-${pool.tokenB.contract}`
        if (!feesSummary[key]) {
          feesSummary[key] = {
            symbol: feeB.symbol.symbol,
            contract: pool.tokenB.contract,
            amount: 0,
            precision: feeB.symbol.precision
          }
        }
        feesSummary[key].amount += feeB.amount
      }

      // Генерируем команду для клейма
      if (pool.protocolFeeA.amount > 0 || pool.protocolFeeB.amount > 0) {
        // Передаем нули чтобы контракт клеймил максимум
        const feeAStr = `0.${'0'.repeat(pool.protocolFeeA.symbol.precision)} ${pool.protocolFeeA.symbol.symbol}`
        const feeBStr = `0.${'0'.repeat(pool.protocolFeeB.symbol.precision)} ${pool.protocolFeeB.symbol.symbol}`

        const command = `cleos -u ${rpcUrl} push action swap.alcor getfees '[${pool.id}, "fees.alcor", "${feeAStr}", "${feeBStr}"]' -p swap.alcor`
        claimCommands.push(command)

        console.log(`\n   📋 Команда для клейма:`)
        console.log(`   ${command}`)
      }
    }

    // Выводим сводку
    console.log('\n' + '='.repeat(80))
    console.log(`\n📈 СВОДКА ПРОТОКОЛЬНЫХ КОМИССИЙ (${chain.toUpperCase()}):\n`)
    console.log('='.repeat(80))
    console.log(`Всего пулов с комиссиями: ${totalPools}`)
    console.log('\nСумма комиссий по токенам:')
    console.log('-'.repeat(40))

    // Сортируем по символу токена
    const sortedFees = Object.values(feesSummary).sort((a: any, b: any) =>
      a.symbol.localeCompare(b.symbol)
    )

    for (const fee of sortedFees as any[]) {
      const formatted = (fee.amount / Math.pow(10, fee.precision)).toLocaleString('en-US', {
        maximumFractionDigits: fee.precision
      })
      console.log(`${fee.symbol.padEnd(10)} ${formatted.padStart(20)} (${fee.contract})`)
    }

    console.log('='.repeat(80))

    // Выводим все команды для удобного копирования
    if (claimCommands.length > 0) {
      console.log('\n' + '='.repeat(80))
      console.log(`\n🚀 ВСЕ КОМАНДЫ ДЛЯ КЛЕЙМА КОМИССИЙ (${claimCommands.length} пулов):\n`)
      console.log('='.repeat(80))
      console.log('\n# Скопируйте и выполните эти команды:\n')

      claimCommands.forEach((cmd, index) => {
        console.log(`# Пул ${poolsWithFees[index].id}`)
        console.log(cmd)
        console.log()
      })

      console.log('='.repeat(80))
    }

  } catch (error) {
    console.error('❌ Ошибка:', error)
    process.exit(1)
  }
}

main()