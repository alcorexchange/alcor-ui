import { FeeAmount, Token } from '@alcorexchange/alcor-swap-sdk'
import { constructPoolInstance, parseToken } from '~/utils/amm'

export const state = () => ({
  tokenA: null,
  tokenB: null,

  feeAmount: FeeAmount.MEDIUM,
  liquidity: 30
})

export const mutations = {
  setTokenA: (state, token) => state.tokenA = token,
  setTokenB: (state, token) => state.tokenB = token,
  setFeeAmount: (state, value) => state.feeAmount = parseInt(value)
}

export const actions = {
  async init({ dispatch }) {
    //await dispatch('fetchPairs')
    //await dispatch('fetchCoins')
  },

  setDefaultTokenA({ state, commit, getters, rootState }) {
    const { tokenA, tokenB } = state

    const { contract, symbol, precision } = rootState.network.baseToken
    const baseToken = new Token(contract, precision, symbol)

    if (!tokenA && ((!tokenB) || (tokenB && baseToken && baseToken.id == tokenB.id))) {
      commit('setTokenA', baseToken)
    }
  },

  toggleTokens({ state, commit }) {
    const tokenA = Object.assign({}, state.tokenA)
    const tokenB = Object.assign({}, state.tokenB)

    commit('setTokenA', tokenB)
    commit('setTokenB', tokenA)
  },

  setTokenA({ state, dispatch, commit }, token) {
    if (token.id == state.tokenB?.id) commit('setTokenB', null)
    commit('setTokenA', token)
    //dispatch('updateRoutePath')
  },

  setTokenB({ state, dispatch, commit }, token) {
    if (token.id == state.tokenA?.id) return commit('setTokenB', null)

    commit('setTokenB', token)
    //dispatch('updateRoutePath')
  },

  async fetchPairs({ state, commit, rootGetters, dispatch }) {
    //const { data: { data: pairs } } = await this.$axios.get('/coinswitch/pairs')
    //commit('setPairs', pairs.filter(p => p.isActive))
  }
}

export const getters = {
  tokenA: (state, getters) => getters.tokensMap.get(state.tokenA?.id),
  tokenB: (state, getters) => getters.tokensMap.get(state.tokenB?.id),
  isSorted: (state, getters) => getters.tokenA && getters.tokenB && getters.tokenA.sortsBefore(getters.tokenB),
  sortedA: (state, getters) => (getters.isSorted ? getters.tokenA : getters.tokenB),
  sortedB: (state, getters) => (getters.isSorted ? getters.tokenB : getters.tokenA),
  invertPrice: (state, getters) =>
    Boolean(getters.tokenA && getters.sortedA && !getters.tokenA.equals(getters.sortedA)),

  tokensMap(state, getters, rootState, rootGetters) {
    const tokens = new Map(rootGetters['amm/tokensMap'])

    if (rootState.user?.balances) {
      rootState.user.balances.forEach((b) => {
        const token = new Token(b.contract, parseInt(b.decimals), b.currency)
        if (!rootState.network.SCAM_CONTRACTS.includes(token.contract) && !tokens.has(token.id)) {
          tokens.set(token.id, token)
        }
      })
    }

    return tokens
  },

  tokens(state, getters) {
    return Array.from(getters.tokensMap.values())
  },

  pool(state, getters, rootState) {
    if (!state.tokenA || !state.tokenB) return null

    const pool = rootState.amm.pools.find((p) => {
      const tokenA = parseToken(p.tokenA)
      const tokenB = parseToken(p.tokenB)
      return (
        ((tokenA.id == state.tokenA?.id && tokenB.id == state.tokenB?.id) ||
          (tokenA.id == state.tokenB?.id && tokenB.id == state.tokenA?.id)) &&
        p.fee == state.feeAmount
      )
    })

    return pool ? constructPoolInstance(pool) : undefined
  },

  currnetPools(state, getters, rootState) {
    if (!state.tokenA || !state.tokenB) return []

    return rootState.amm.pools
      .filter((p) => {
        const tokenA = parseToken(p.tokenA)
        const tokenB = parseToken(p.tokenB)
        return (
          (tokenA.id == state.tokenA?.id && tokenB.id == state.tokenB?.id) ||
          (tokenA.id == state.tokenB?.id && tokenB.id == state.tokenA?.id)
        )
      })
      .map((p) => constructPoolInstance(p))
  },

  routes(state, getters, rootState) {
    const [tokenA, tokenB, feeAmountFromUrl] = rootState.route.fullPath.replace('/add-liquidity/', '').split('/')
    return { tokenA, tokenB, feeAmountFromUrl }
  },
}
