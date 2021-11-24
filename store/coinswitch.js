export const state = () => ({
  //coins: [],
  pairs: []
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

  async fetchPairs({ state, commit, rootGetters, dispatch }) {
    const { data: { data: pairs } } = await this.$axios.get('/coinswitch/pairs')

    commit('setPairs', pairs.filter(p => p.isActive))
  }
}

export const getters = {
  depositCoins(state, getters, rootState) {
    return state.pairs.map(p => p.depositCoin)
  }
}
