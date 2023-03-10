import { Route, Trade } from '~/assets/libs/swap-sdk'

import { tryParseCurrencyAmount } from '~/utils/amm'

export const state = () => ({
  tokenA: null,
  tokenB: null,

  liquidity: 30
})

export const mutations = {
  setTokenA: (state, token) => state.tokenA = token,
  setTokenB: (state, token) => state.tokenB = token

  //setFeeAmount: (state, value) => state.feeAmount = value
}

export const actions = {
  async init({ dispatch }) {
    // TODO Set Default tokens
  },

  bestTradeExactIn({ rootGetters }, { currencyAmountIn, currencyOut, options }) {
    return Trade.bestTradeExactIn(
      rootGetters['amm/pools'],
      currencyAmountIn,
      currencyOut,
      { maxNumResults: 2, maxHops: 10, ...options }
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

  flipTokens({ state, commit }) {
    const [tokenA, tokenB] = [state.tokenB, state.tokenA]

    commit('setTokenA', tokenA)
    commit('setTokenB', tokenB)
  },

  setTokenA({ state, dispatch, commit }, token) {
    if (token == state.tokenB) return dispatch('flipTokens')

    commit('setTokenA', token)
    //dispatch('updateRoutePath')
  },

  setTokenB({ dispatch, commit }, token) {
    if (token == state.tokenA) return dispatch('flipTokens')

    commit('setTokenB', token)
    //dispatch('updateRoutePath')
  },
}

export const getters = {
  tokenA: (state, getters) => getters.tokens.find(t => t.name == state.tokenA?.name),
  tokenB: (state, getters) => getters.tokens.find(t => t.name == state.tokenB?.name),
  isSorted: (state, getters) => getters.tokenA && getters.tokenB && getters.tokenA.sortsBefore(getters.tokenB),
  sortedA: (state, getters) => getters.isSorted ? getters.tokenA : getters.tokenB,
  sortedB: (state, getters) => getters.isSorted ? getters.tokenB : getters.tokenA,

  tokens(state, getters, rootState, rootGetters) {
    const tokens = []

    rootGetters['amm/pools'].map(p => {
      const { tokenA, tokenB } = p

      if (tokens.filter(t => t.name == tokenA.name).length == 0) tokens.push(tokenA)
      if (tokens.filter(t => t.name == tokenB.name).length == 0) tokens.push(tokenB)
    })

    return tokens
  },

  routes(state, getters, rootState) {
    const [tokenA, tokenB, feeAmountFromUrl] = rootState
      .route.fullPath.replace('/add-liquidity/', '').split('/')

    return { tokenA, tokenB, feeAmountFromUrl }
  }
}
