const workerpool = require('workerpool')
const { CurrencyAmount, Route, Trade, TradeType } = require('@alcorexchange/alcor-swap-sdk')

function processRoute(routeBuffer, amount, tradeType, percent) {
  const _route = Route.fromBuffer(routeBuffer)

  try {
    const { inputAmount, outputAmount } = Trade.fromRoute(
      _route,
      CurrencyAmount.fromRawAmount(_route.input, amount),
      TradeType.EXACT_INPUT,
      percent
    )

    return {
      inputAmount: inputAmount.quotient.toString(),
      outputAmount: outputAmount.quotient.toString(),
      routeBuffer,
      percent,
    }
  } catch (error) {
    if (error.isInsufficientReservesError || error.isInsufficientInputAmountError) {
      return null // Return null if trade is not possible
    }
    throw error
  }
}

// создаем пул воркеров
workerpool.worker({
  processRoute,
})
