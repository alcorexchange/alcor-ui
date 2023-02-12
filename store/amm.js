import JSBI from "jsbi"
import { asset } from 'eos-common'

import { fetchAllRows } from '../utils/eosjs'
import { Token, Pool, Tick, CurrencyAmount } from '~/assets/libs/swap-sdk'

function parseToken(token) {
  return new Token(
    token.contract,
    asset(token.quantity).symbol.precision(),
    asset(token.quantity).symbol.code().to_string(),
    (asset(token.quantity).symbol.code().to_string() + '-' + token.contract).toLowerCase()
  )
}


export const state = () => ({
  pools: []
})

export const mutations = {
  setPairs: (state, pairs) => state.pairs = pairs,
  setCoins: (state, coins) => state.coins = coins
}

export const actions = {
  async init({ dispatch }) {
    await dispatch('fetchPairs')
    //await dispatch('fetchCoins')
  },

  async fetchPairs({ state, commit, rootState, dispatch }) {
    const { network } = rootState

    const rows = await fetchAllRows(this.$rpc, { code: network.amm.contract, scope: network.amm.contract, table: 'pools' })

    const row = rows[0]

    //console.log(row)
    const { id, tokenA, tokenB, fee, liquidity, currSlot: { sqrtPriceX64, tick } } = row

    const ticks = await fetchAllRows(this.$rpc, { code: network.amm.contract, scope: id, table: 'ticks' })

    const TICKS = ticks.map(t => new Tick({ index: t.id, ...t }))

    TICKS.sort((a, b) => a.index - b.index)
    //console.log(TICKS)


    const token_a = parseToken(row.tokenA)

    const pool = new Pool(
      token_a,
      parseToken(row.tokenB),
      fee,
      sqrtPriceX64,
      liquidity,
      tick,
      TICKS
    )
    global.pool = pool
    // pool.tokenAPrice.toFixed()

    const inAmountStr = asset('1.0432 B').amount.toString()
    //console.log(inAmount)

    const amountIn = new CurrencyAmount(token_a, inAmountStr)
    console.log('amountIn', amountIn.toFixed())

    const [amountOut] = await pool.getInputAmount(amountIn)

    console.log('amountOut', amountOut.toFixed())
    //console.log(pool.getOutputAmount())




    //console.log(pool.tokenAPrice())

    //console.log({ fee, liquidity, sqrtPriceX64, tick })

    //const tokenA = parseToken(row.tokenA)
    //const tokenB = parseToken(row.tokenB)

    //const pool = new Pool(


    //)

    //tokenA: Token,
    //tokenB: Token,
    //fee: FeeAmount,
    //sqrtRatioX64: BigintIsh,
    //liquidity: BigintIsh,
    //tickCurrent: number,
    //ticks:
    //  | TickDataProvider
    //  | (Tick | TickConstructorArgs)[] = NO_TICK_DATA_PROVIDER_DEFAULT

    //rows.map(r => {

    //})

    //dispatch('setPairs', rows)
  }
}

export const getters = {
  depositCoins(state, getters, rootState) {
    return state.pairs.map(p => p.depositCoin)
  }
}
