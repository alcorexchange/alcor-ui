export const state = () => ({
  pairs: []
})

export const mutations = {
  setPairs: (state, pairs) => state.pairs = pairs
}

export const actions = {
  async init({ dispatch }) {
  },

  async fetchPairs({ state, commit, rootGetters, dispatch }) {
  }
}

export const getters = {
  depositCoins(state, getters, rootState) {
    return state.pairs.map(p => p.depositCoin)
  }
}
