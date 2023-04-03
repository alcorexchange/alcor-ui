import { Router } from 'express'
import { SwapPool, SwapChartPoint, Position } from '../../models'

import { tryParseCurrencyAmount } from '../../../utils/amm'
import { getAllTokensWithPrices } from '../updaterService/prices'

import { CurrencyAmount } from '../../../assets/libs/swap-sdk/entities/fractions/currencyAmount'
import { Pool } from '../../../assets/libs/swap-sdk/entities/pool'
import { Token } from '../../../assets/libs/swap-sdk/entities/token'
import { Trade } from '../../../assets/libs/swap-sdk/entities/trade'
import { Percent } from '../../../assets/libs/swap-sdk/entities/fractions/percent'

import { getRedisTicks, getPools } from '../swapV2Service/utils'

export const swapRouter = Router()

const TRADE_OPTIONS = { maxNumResults: 1, maxHops: 6 }


// const [trade] = exactIn
//   ? await this.bestTradeExactIn({ currencyAmountIn, currencyOut: tokenB })
//   : await this.bestTradeExactOut({ currencyIn: tokenA, currencyAmountOut })


swapRouter.get('/getRoute', async (req, res) => {
  const network: Network = req.app.get('network')

  const mongoPools = await SwapPool.find({ chain: network.name }).lean()
  const tokens = await getAllTokensWithPrices(network)

  const exactIn = true
  const receiver = 'avral.pro'

  const pools = await getPools(network.name)

  const input = tryParseCurrencyAmount('0.01', new Token('eosio.token', 8, 'WAX', 'wax-eosio.token'))
  const output = tryParseCurrencyAmount('1', new Token('alien.worlds', 4, 'TLM', 'tlm-alien.worlds'))

  const [trade] = await Trade.bestTradeExactIn(
    pools.filter(p => p.tickDataProvider.ticks.length > 0),
    input,
    output.currency,
    TRADE_OPTIONS
  )

  const slippage = new Percent(0.3 * 100, 10000)


  const method = exactIn ? 'swapexactin' : 'swapexactout'
  const route = trade.route.pools.map(p => p.id)

  const maxSent = exactIn ? trade.inputAmount : trade.maximumAmountIn(slippage)
  const minReceived = exactIn ? trade.minimumAmountOut(slippage) : trade.outputAmount

  // Memo Format <Service Name>#<Pool ID's>#<Recipient>#<Output Token>#<Deadline>
  const memo = `${method}#${route.join(',')}#${receiver}#${minReceived.toExtendedAsset()}#0`

  console.log(route)
  const result = {
    input: trade.inputAmount.toFixed(),
    output: trade.outputAmount.toFixed(),
    minReceived: minReceived.toFixed(),
    maxSent: maxSent.toFixed(),
    priceImpact: trade.priceImpact.toSignificant(),
    memo,
    route,
    executionPrice: trade.executionPrice
  }

  //trade

  // const [trade] = exactIn
  //   ? await this.bestTradeExactIn({ currencyAmountIn, currencyOut: tokenB })
  //   : await this.bestTradeExactOut({ currencyIn: tokenA, currencyAmountOut })




  //const input = tryParseCurrencyAmount('123.321', new Token('eosio.token', 8, 'WAX', 'wax-eosio.token'))
  //console.log(input)
  //const trade =



  res.json(result)
})
