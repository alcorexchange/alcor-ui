import { Token, Trade } from '@alcorexchange/alcor-swap-sdk'

export const state = () => ({
  tokenA: null,
  tokenB: null,

  // Parsed from url
  input: null,
  output: null,

  liquidity: 30,
  showChart: false
})

export const mutations = {
  setTokenA: (state, token) => state.tokenA = token,
  setTokenB: (state, token) => state.tokenB = token,

  setInput: (state, token) => state.input = token,
  setOutput: (state, token) => state.output = token,
  setShowChart: (state, data) => state.showChart = data
}

export const actions = {
  async init({ state, commit, dispatch, getters, rootGetters, rootState }) {
    if (rootGetters['amm/pools'].length == 0) await dispatch('amm/fetchPools', null, { root: true })
    if (rootGetters['amm/pools'].length == 0) return

    dispatch('setDefaultInputOutput')
  },

  setDefaultInputOutput({ state, commit, getters, rootState }) {
    const { input, output } = state

    if (!input && !output) {
      const { contract, symbol } = rootState.network.baseToken
      commit('setTokenB', null)
      return commit('setTokenA', getters.tokens.find(t => t.symbol.toLowerCase() == symbol.toLowerCase() && t.contract == contract))
    }

    const tokenA = getters.tokens.find(t => t.symbol.toLowerCase() == state.input?.symbol.toLowerCase() && t.contract == state.input?.contract)
    const tokenB = getters.tokens.find(t => t.symbol.toLowerCase() == state.output?.symbol.toLowerCase() && t.contract == state.output?.contract)
    if (tokenA && tokenB && tokenA.equals(tokenB)) return commit('setTokenA', tokenA)

    if (tokenA) commit('setTokenA', tokenA)
    if (tokenB) commit('setTokenB', tokenB)
  },

  async bestTradeExactIn({ rootGetters }, { currencyAmountIn, currencyOut, options }) {
    try {
      return await Trade.bestTradeExactIn(
        rootGetters['amm/pools'].filter(p => p.tickDataProvider.ticks.length > 0),
        currencyAmountIn,
        currencyOut,
        { maxNumResults: 5, maxHops: 6, ...options }
      )
    } catch (e) {
      console.error(e.message)
      return []
    }
  },

  async bestTradeExactOut({ rootGetters }, { currencyIn, currencyAmountOut, options }) {
    try {
      return await Trade.bestTradeExactOut(
        rootGetters['amm/pools'].filter(p => p.tickDataProvider.ticks.length > 0),
        currencyIn,
        currencyAmountOut,
        { maxNumResults: 1, maxHops: 6, ...options }
      )
    } catch (e) {
      console.error(e.message)
      return []
    }
  },

  flipTokens({ state, commit }) {
    const [tokenA, tokenB] = [state.tokenB, state.tokenA]

    commit('setTokenA', tokenA)
    commit('setTokenB', tokenB)
  },

  setTokenA({ state, dispatch, commit }, token) {
    if (token == state.tokenB) return dispatch('flipTokens')

    commit('setTokenA', token)
  },

  setTokenB({ dispatch, commit }, token) {
    if (token == state.tokenA) return dispatch('flipTokens')

    commit('setTokenB', token)
  },
}

export const getters = {
  // TODO Getters perfomance test
  tokenA: (state, getters) => getters.tokens.find(t => t.id == state.tokenA?.id),
  tokenB: (state, getters) => getters.tokens.find(t => t.id == state.tokenB?.id),
  isSorted: (state, getters) => getters.tokenA && getters.tokenB && getters.tokenA.sortsBefore(getters.tokenB),
  sortedA: (state, getters) => getters.isSorted ? getters.tokenA : getters.tokenB,
  sortedB: (state, getters) => getters.isSorted ? getters.tokenB : getters.tokenA,

  tokens(state, getters, rootState, rootGetters) {
    const tokens = []

    rootGetters['amm/pools'].map(p => {
      const { tokenA, tokenB } = p

      if (tokens.filter(t => t.id == tokenA.id).length == 0) tokens.push(tokenA)
      if (tokens.filter(t => t.id == tokenB.id).length == 0) tokens.push(tokenB)
    })

    return tokens.filter(t => !rootState.network.SCAM_CONTRACTS.includes(t.contract))
  },

  routes(state, getters, rootState) {
    const [tokenA, tokenB, feeAmountFromUrl] = rootState
      .route.fullPath.replace('/add-liquidity/', '').split('/')

    return { tokenA, tokenB, feeAmountFromUrl }
  }
}
