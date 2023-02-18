import { get_all_tokens } from "~/utils/pools"

export const state = () => ({
  tokenA: null,
  tokenB: null,
  feeAmount: 3000
})

export const mutations = {
  setTokenA: (state, token) => state.tokenA = token,
  setTokenB: (state, token) => state.tokenB = token
}

export const actions = {
  async init({ dispatch }) {
    //await dispatch('fetchPairs')
    //await dispatch('fetchCoins')
  },

  updateRoutePath({ state, getters, rootState }) {
    // TODO Handle fee!
    const { tokenA, tokenB } = getters.routes

    let path = '/add-liquidity/'

    if (state.tokenA && state.tokenA.name !== tokenA) {
      path += state.tokenA.name
    }

    if (!state.tokenA && state.tokenB) {
      path += state.tokenB.name
    }

    if (state.tokenB && state.tokenB.name !== tokenB) {
      path += `/${state.tokenB.name}`
    }

    if (state.tokenA && state.tokenB && state.feeAmount) {
      path += `/${state.feeAmount}`
    }

    const currentRount = rootState.route.fullPath
    if (currentRount !== path) this.$router.push({ path })
  },

  setTokenA({ dispatch, commit }, token) {
    commit('setTokenA', token)
    dispatch('updateRoutePath')
  },

  setTokenB({ dispatch, commit }, token) {
    commit('setTokenB', token)
    dispatch('updateRoutePath')
  },

  async fetchPairs({ state, commit, rootGetters, dispatch }) {
    //const { data: { data: pairs } } = await this.$axios.get('/coinswitch/pairs')
    //commit('setPairs', pairs.filter(p => p.isActive))
  }
}

export const getters = {
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
      console.log(p)
      const { tokenA, tokenB } = p

      if (tokenA.name == state.tokenA.name) tokens.push(tokenB)
      if (tokenB.name == state.tokenA.name) tokens.push(tokenA)
    })

    return tokens
  },

  pool(state, getters, rootState, rootGetters) {
    // TODO Add fee filter
    if (!state.tokenA || !state.tokenB) return null

    return rootGetters['amm/pools'].find(p => {
      return p.tokenA.name == state.tokenA.name && p.tokenB.name == state.tokenB.name
    })
  },

  routes(state, getters, rootState) {
    const [_, tokenA, tokenB, feeAmountFromUrl] = rootState
      .route.fullPath.replace('/add-liquidity/', '').split('/')

    return { tokenA, tokenB, feeAmountFromUrl }
  }
}
