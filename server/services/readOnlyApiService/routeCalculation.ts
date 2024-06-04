import { performance } from 'perf_hooks'

import fetch from 'cross-fetch'

import { ABI, APIClient, Action, Transaction } from '@wharfkit/antelope'

import { Pool, TradeType, CurrencyAmount, Trade, sortedInsert, tradeComparator } from '@alcorexchange/alcor-swap-sdk'

import { fetchAllRows } from '../../../utils/eosjs'
import { parseToken } from '../../../utils/amm'
import { abi } from './interaceContractAbi'

export async function getPools(rpc) {
  // Based on swap only, right now
  const rows = await fetchAllRows(rpc, {
    scope: 'swap.alcor',
    table: 'pools',
    code: 'swap.alcor',
  })

  const pools: Pool[] = []

  // We have to get all pools with fetched ticks for them
  for (const p of rows) {
    const { tokenA, tokenB, currSlot: { sqrtPriceX64, tick } } = p
    pools.push(new Pool({
      ...p,
      tokenA: parseToken(tokenA),
      tokenB: parseToken(tokenB),
      sqrtPriceX64,
      tickCurrent: tick,
    }))
  }

  return pools
}

export async function getTradeByReadOnly(nodes, tradeType, route, quantity, header) {
  const name = tradeType == TradeType.EXACT_INPUT ? 'swapexactin' : 'swapexactout'

  // TODO add failover
  const node = nodes[0]

  let inputAmount
  let outputAmount

  const inToken = name == 'swapexactin' ? quantity : CurrencyAmount.fromRawAmount(route.input, 0)
  const outToken = name == 'swapexactin' ? CurrencyAmount.fromRawAmount(route.output, 0) : quantity

  const action = Action.from({
    authorization: [], // No authorizations
    account: 'amminterface',
    name,
    data: {
      inToken: inToken.toExtendedAssetObject(),
      outToken: outToken.toExtendedAssetObject(),
      poolIds: route.pools.map(p => p.id),
    }
  }, ABI.from(abi))

  const transaction = Transaction.from({
    ...header,
    actions: [action],
  })

  const rpc = new APIClient({ url: nodes[0], fetch })
  const { processed }: any = await rpc.v1.chain.send_read_only_transaction(transaction)

  if (processed.error_code) {
    throw new Error(processed.except.message + ' ' + processed.error_code)
  }

  const amount = processed.action_traces[0].return_value_data.quantity.split(' ')[0].replace('.', '')

  if (tradeType == TradeType.EXACT_INPUT) {
    inputAmount = inToken
    outputAmount = CurrencyAmount.fromRawAmount(route.output, amount)
  } else {
    inputAmount = CurrencyAmount.fromRawAmount(route.input, amount)
    outputAmount = outToken
  }

  return { route, inputAmount, outputAmount }
}

export async function getBestTradeByReadOnly(amount, routes, tradeType, nodes, maxNumResults = 1) {
  const requests: any[] = []

  console.log('getBestTradeByReadOnly, first node: ', nodes[0])

  // TODO Retry logic
  const rpc = new APIClient({ url: nodes[0], fetch })
  const info = await rpc.v1.chain.get_info()
  const header = info.getTransactionHeader()

  const startTime = performance.now()
  for (const route of routes) {
    requests.push(
      getTradeByReadOnly(
        nodes,
        tradeType,
        route,
        amount,
        header
      )
    )
  }

  await Promise.allSettled(requests)
  const endTime = performance.now()

  console.log(`REQUEST READ ONLY ROUTES COMPUTATIONS, routes: ${routes.length} -> ${endTime - startTime} milliseconds`)

  const trades: any[] = []

  for (const r of requests) {
    try {
      const { route, inputAmount, outputAmount } = await r

      sortedInsert(
        trades,
        Trade.createUncheckedTrade({ route, inputAmount, outputAmount, tradeType, percent: 100 }),
        maxNumResults,
        tradeComparator
      )
    } catch (e) {
      if (e.message.includes('10000000000000000000')) continue
      console.log('err in call get route', e.message)
    }
  }

  return trades
}
