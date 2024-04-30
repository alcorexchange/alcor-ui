import { Token, Trade } from '@alcorexchange/alcor-swap-sdk'
import { parseToken } from '~/utils/amm'

export const state = () => ({
  tokenA: null,
  tokenB: null,

  // Parsed from url
  input: null,
  output: null,

  // Only show that tokens for swap
  only: [],

  liquidity: 30,
  showChart: false
})

export const mutations = {
  setTokenA: (state, token) => state.tokenA = token,
  setTokenB: (state, token) => state.tokenB = token,

  setInput: (state, token) => state.input = token,
  setOutput: (state, token) => state.output = token,
  setOnly: (state, tokens) => state.only = tokens,
  setShowChart: (state, data) => state.showChart = data
}

export const actions = {
  async init({ state, commit, dispatch, getters, rootGetters, rootState }) {
    if (rootState.amm.pools.length == 0) await dispatch('amm/fetchPools', null, { root: true })
    if (rootState.amm.pools.length == 0) return

    dispatch('setDefaultInputOutput')
  },

  setDefaultInputOutput({ state, commit, getters, rootState }) {
    const { input, output } = state

    if (!input && !output) {
      const { contract, symbol } = rootState.network.baseToken
      commit('setTokenB', null)
      return commit('setTokenA', getters.tokens.find(t => t.symbol.toLowerCase() == symbol.toLowerCase() && t.contract == contract))
    }

    const tokenA = getters.tokens.find(t => t.id == state.input?.toLowerCase())
    const tokenB = getters.tokens.find(t => t.id == state.output?.toLowerCase())
    if (tokenA && tokenB && tokenA.equals(tokenB)) return commit('setTokenA', tokenA)

    if (tokenA) commit('setTokenA', tokenA)
    if (tokenB) commit('setTokenB', tokenB)
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
  tokenA: (state, getters, rootState, rootGetters) => {
    return rootGetters['amm/tokensMap'].get(state.tokenA?.id)
  },

  tokenB: (state, getters, rootState, rootGetters) => {
    return rootGetters['amm/tokensMap'].get(state.tokenB?.id)
  },

  isSorted: (state, getters) => {
    const tokenA = getters.tokenA
    const tokenB = getters.tokenB
    return tokenA && tokenB && tokenA.sortsBefore(tokenB)
  },

  sortedA: (state, getters) => {
    return getters.isSorted ? getters.tokenA : getters.tokenB
  },

  sortedB: (state, getters) => {
    return getters.isSorted ? getters.tokenB : getters.tokenA
  },

  tokens: (state, getters, rootState, rootGetters) => {
    const tokens = Array.from(rootGetters['amm/tokensMap'].values())

    if (state.only.length > 0) {
      return tokens.filter((t) => state.only.includes(t.id))
    }

    return tokens
  },

  routes: (state, getters, rootState) => {
    const [tokenA, tokenB, feeAmountFromUrl] = rootState.route.fullPath.replace('/add-liquidity/', '').split('/')
    return { tokenA, tokenB, feeAmountFromUrl }
  },
}
