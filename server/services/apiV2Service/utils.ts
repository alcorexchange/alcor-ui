import { Percent, Trade, TradeType } from '@alcorexchange/alcor-swap-sdk'

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

    const input = inputAmount.toFixed()
    const output = outputAmount.toFixed()

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
