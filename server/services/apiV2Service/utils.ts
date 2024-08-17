import path from 'path'

import _ from 'lodash'
import workerpool from 'workerpool'
import invariant from 'tiny-invariant'

import { getBestSwapRoute, CurrencyAmount, Route, Currency, Percent, Trade, TradeType } from '@alcorexchange/alcor-swap-sdk'

const WorkerPool = workerpool.pool(path.resolve(__dirname, 'workers/computeTradeFromRoute.js'), { maxWorkers: 6 })

export async function bestTradeWithSplitMultiThreaded(
  _routes: Route<Currency, Currency>[],
  amount: CurrencyAmount<Currency>,
  percents: number[],
  tradeType: TradeType,
  swapConfig = { minSplits: 1, maxSplits: 10 }
): Promise<Trade<Currency, Currency, TradeType>> | null {
  invariant(_routes.length > 0, 'ROUTES')
  invariant(percents.length > 0, 'PERCENTS')

  // Compute routes for all percents for all routes
  const route_promises: Promise<any>[] = []

  _routes.forEach(route => {
    for (const percent of percents) {
      const params = [
        Route.toBuffer(route),
        amount.quotient.toString(),
        tradeType,
        percent
      ]

      route_promises.push(WorkerPool.exec('processRoute', params) as any)
    }
  })

  const trades = await Promise.all(route_promises)

  const percentToTrades: { [percent: number]: Trade<Currency, Currency, TradeType>[] } = {}
  for (let { inputAmount, outputAmount, routeBuffer, percent } of trades.filter(t => !!t)) {
    const route = Route.fromBuffer(routeBuffer)

    inputAmount = CurrencyAmount.fromRawAmount(_routes[0].input, inputAmount)
    outputAmount = CurrencyAmount.fromRawAmount(_routes[0].output, outputAmount)

    if (!inputAmount.greaterThan(0)) continue

    if (!percentToTrades[percent]) {
      percentToTrades[percent] = []
    }

    percentToTrades[percent].push(Trade.createUncheckedTrade({ percent, route, inputAmount, outputAmount, tradeType }))
  }

  const bestTrades = getBestSwapRoute(tradeType, percentToTrades, percents, swapConfig)
  if (!bestTrades) return null

  const routes = bestTrades.map(({ inputAmount, outputAmount, route, swaps }) => {
    return { inputAmount, outputAmount, route, percent: swaps[0].percent }
  })

  // Check missing input after splitting
  // TODO Do we need it for exact out?
  if (tradeType === TradeType.EXACT_INPUT) {
    const totalAmount = _.reduce(
      routes,
      (total, route) => total.add(route.inputAmount),
      CurrencyAmount.fromRawAmount(routes[0].route.input, 0)
    )

    const missingAmount = amount.subtract(totalAmount)

    if (missingAmount.greaterThan(0)) {
      console.log("MISSING AMOUNT!!!", missingAmount.toFixed())
      routes[0].inputAmount = routes[0].inputAmount.add(missingAmount)
    }
  }

  return Trade.createUncheckedTradeWithMultipleRoutes({ routes, tradeType })
}

export function parseTrade(trade, slippage, receiver) {
  // Parse Trade into api format object
  const exactIn = trade.tradeType === TradeType.EXACT_INPUT

  const maxSent = exactIn ? trade.inputAmount : trade.maximumAmountIn(slippage)
  const minReceived = exactIn ? trade.minimumAmountOut(slippage) : trade.outputAmount

  const tradeType = trade.tradeType == TradeType.EXACT_INPUT ? 'swapexactin' : 'swapexactout'

  const swaps = trade.swaps.map(({ route, percent, inputAmount, outputAmount }) => {
    route = route.pools.map(p => p.id)

    const maxSent = exactIn ? inputAmount : trade.maximumAmountIn(slippage, inputAmount)
    const minReceived = exactIn ? trade.minimumAmountOut(slippage, outputAmount) : outputAmount

    const input = inputAmount.toAsset()
    const output = outputAmount.toAsset()

    const memo = `${tradeType}#${route.join(',')}#${receiver}#${minReceived.toExtendedAsset()}#0`
    return { input, route, output, percent, memo, maxSent: maxSent.toFixed(), minReceived: minReceived.toFixed() }
  })

  const result = {
    route: null,
    memo: null,
    swaps,
    input: trade.inputAmount.toFixed(),
    output: trade.outputAmount.toFixed(),
    minReceived: minReceived.toFixed(),
    maxSent: maxSent.toFixed(),
    priceImpact: trade.priceImpact.toSignificant(2),

    executionPrice: {
      numerator: trade.executionPrice.numerator.toString(),
      denominator: trade.executionPrice.denominator.toString()
    }
  }

  // FIXME DEPRECATED Hotfix for legacy v1
  result!.route = trade.swaps[0].route.pools.map((p) => p.id)
  result!.memo = `${tradeType}#${result.route.join(',')}#${receiver}#${minReceived.toExtendedAsset()}#0`

  return result
}
