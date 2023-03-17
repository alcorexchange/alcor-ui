import { FeeAmount, PositionLibrary, TickLibrary, CurrencyAmount, Token } from '~/assets/libs/swap-sdk'

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

  toggleTokens({ state, commit }) {
    const tokenA = Object.assign({}, state.tokenA)
    const tokenB = Object.assign({}, state.tokenB)

    commit('setTokenA', tokenB)
    commit('setTokenB', tokenA)
  },

  updateRoutePath({ state, getters, rootState }) {
    // TODO Handle fee!
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

  setTokenA({ state, dispatch, commit }, token) {
    if (token.name == state.tokenB?.name) commit('setTokenB', null)
    commit('setTokenA', token)
    //dispatch('updateRoutePath')
  },

  setTokenB({ state, dispatch, commit }, token) {
    if (token.name == state.tokenA?.name) return commit('setTokenB', null)

    commit('setTokenB', token)
    //dispatch('updateRoutePath')
  },

  async fetchPairs({ state, commit, rootGetters, dispatch }) {
    //const { data: { data: pairs } } = await this.$axios.get('/coinswitch/pairs')
    //commit('setPairs', pairs.filter(p => p.isActive))
  }
}

export const getters = {
  tokenA: (state, getters) => getters.tokens.find(t => t.name == state.tokenA?.name),
  tokenB: (state, getters) => getters.tokens.find(t => t.name == state.tokenB?.name),
  isSorted: (state, getters) => getters.tokenA && getters.tokenB && getters.tokenA.sortsBefore(getters.tokenB),
  sortedA: (state, getters) => getters.isSorted ? getters.tokenA : getters.tokenB,
  sortedB: (state, getters) => getters.isSorted ? getters.tokenB : getters.tokenA,
  invertPrice: (state, getters) => Boolean(getters.tokenA && getters.sortedA && !getters.tokenA.equals(getters.sortedA)),

  tokens(state, getters, rootState, rootGetters) {
    // Тут вообще все
    const tokens = []

    rootGetters['amm/pools'].map(p => {
      const { tokenA, tokenB } = p

      if (tokens.filter(t => t.name == tokenA.name).length == 0) tokens.push(tokenA)
      if (tokens.filter(t => t.name == tokenB.name).length == 0) tokens.push(tokenB)
    })

    if (rootState.user?.balances)
      rootState.user?.balances.map(b => {
        const token = new Token(
          b.contract,
          parseInt(b.decimals),
          b.currency,
          b.id.replace('@', '-').toLowerCase()
        )

        if (tokens.filter(t => t.name == token.name).length == 0) tokens.push(token)
      })

    return tokens
  },

  pool(state, getters, rootState, rootGetters) {
    if (!state.tokenA || !state.tokenB) return null

    const pool = rootGetters['amm/pools'].find(p => {
      return (
        (p.tokenA.name == state.tokenA?.name && p.tokenB.name == state.tokenB?.name) ||
        (p.tokenA.name == state.tokenB?.name && p.tokenB.name == state.tokenA?.name)
      ) && p.fee == state.feeAmount
    })

    return pool
  },

  routes(state, getters, rootState) {
    const [tokenA, tokenB, feeAmountFromUrl] = rootState
      .route.fullPath.replace('/add-liquidity/', '').split('/')

    return { tokenA, tokenB, feeAmountFromUrl }
  }
}