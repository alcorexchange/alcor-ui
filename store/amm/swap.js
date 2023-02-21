import { Route, Trade } from '~/assets/libs/swap-sdk'

import { tryParseCurrencyAmount } from '~/utils/amm'

export const state = () => ({
  tokenA: null,
  tokenB: null

  //independentField: null,
  //typedValue: null,
  //[Field.INPUT]: { currencyId: inputCurrencyId },
  //[Field.OUTPUT]: { currencyId: outputCurrencyId },
  //recipient,

  //feeAmount: 3000
})

export const mutations = {
  setTokenA: (state, token) => state.tokenA = token,
  setTokenB: (state, token) => state.tokenB = token,

  //setFeeAmount: (state, value) => state.feeAmount = value
}

export const actions = {
  async init({ dispatch }) {
    // TODO Set Default tokens
  },

  async test({ rootGetters }) {

  },

  bestTradeExactIn({ rootGetters }, { currencyAmountIn, currencyOut, options }) {
    return Trade.bestTradeExactIn(
      rootGetters['amm/pools'],
      currencyAmountIn,
      currencyOut,
      { maxNumResults: 5, maxHops: 5, ...options }
    )
  },

  bestTradeExactOut({ rootGetters }, { currencyIn, currencyAmountOut, options }) {
    return Trade.bestTradeExactOut(
      rootGetters['amm/pools'],
      currencyIn,
      currencyAmountOut,
      { maxNumResults: 5, maxHops: 5, ...options }
    )
  },

  updateRoutePath({ state, getters, rootState }) {
    // TODO Redo for swap
    const { tokenA, tokenB } = getters.routes

    let path = '/add-liquidity/'

    if (state.tokenA && state.tokenA.name !== tokenA) {
      path += state.tokenA
    }

    if (!state.tokenA && state.tokenB && state.tokenB !== tokenB) {
      path += state.tokenB
    }

    if (state.tokenB && state.tokenB !== tokenB) {
      path += `/${state.tokenB}`
    }

    if (state.tokenA && state.tokenB && state.feeAmount) {
      path += `/${state.feeAmount}`
    }

    const currentRout = rootState.route.fullPath
    console.log({ currentRout, path })
    if (currentRout !== path) this.$router.push({ path })
  },

  setTokenA({ dispatch, commit }, token) {
    commit('setTokenA', token)
    console.log('setTokenA', token)
    //dispatch('updateRoutePath')
  },

  setTokenB({ dispatch, commit }, token) {
    commit('setTokenB', token)
    //dispatch('updateRoutePath')
  }
}

export const getters = {
  tokenA: (state, getters) => getters.tokensA.find(t => t.name == state.tokenA),
  tokenB: (state, getters) => getters.tokensA.find(t => t.name == state.tokenB),

  tokensA(state, getters, rootState, rootGetters) {
    const tokens = []

    rootGetters['amm/pools'].map(p => {
      const { tokenA, tokenB } = p

      if (tokens.filter(t => t.name == tokenA.name).length == 0) tokens.push(tokenA)
      if (tokens.filter(t => t.name == tokenB.name).length == 0) tokens.push(tokenB)
    })

    return tokens
  },

  tokensB(state, getters, rootState, rootGetters) {
    if (!state.tokenA) return getters.tokensA

    const tokens = []

    rootGetters['amm/pools'].map(p => {
      const { tokenA, tokenB } = p

      if (tokenA.name == state.tokenA) tokens.push(tokenB)
      if (tokenB.name == state.tokenA) tokens.push(tokenA)
    })

    return tokens
  },

  pool(state, getters, rootState, rootGetters) {
    // TODO Add fee filter
    if (!state.tokenA || !state.tokenB) return null

    return rootGetters['amm/pools'].find(p => {
      return p.tokenA.name == state.tokenA && p.tokenB.name == state.tokenB
    })
  },

  routes(state, getters, rootState) {
    const [tokenA, tokenB, feeAmountFromUrl] = rootState
      .route.fullPath.replace('/add-liquidity/', '').split('/')

    return { tokenA, tokenB, feeAmountFromUrl }
  }
}
