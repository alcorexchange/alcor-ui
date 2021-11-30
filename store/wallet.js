export const state = () => ({
  systemPrice: 0
})

export const mutations = {
  setSystemPrice: (state, price) => state.systemPrice = price
}

export const actions = {
  async init({ state, commit, dispatch, rootState, getters }) {
    if (rootState.network.name == 'proton') return commit('setSystemPrice', 1)

    const { data } = await this.$axios.get('https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: rootState.network.name,
          vs_currencies: 'usd'
        }
      }
    )

    commit('setSystemPrice', data[rootState.network.name].usd)
    dispatch('loadUserBalances', {}, { root: true })
  }
}

export const getters = {
  buyPositionsCount(state, getters, rootState) {
    return rootState.userOrders.filter(p => p.type == 'buy').length
  },

  sellPositionsCount(state, getters, rootState) {
    return rootState.userOrders.filter(p => p.type == 'sell').length
  },

  pairPositions(state, getters, rootState) {
    const markets = []

    rootState.userOrders.map(o => {
      if (markets.filter(m => m.id == o.market_id).length == 0) {
        markets.push({
          ...rootState.markets_obj[o.market_id],
          orders: [o]
        })
      } else {
        markets.filter(m => m.id == o.market_id)[0].orders.push(o)
      }
    })

    return markets.map(m => {
      m.orderCount = {
        buy: m.orders.filter(o => o.type == 'buy').length,
        sell: m.orders.filter(o => o.type == 'sell').length
      }

      m.totalBase = m.orders.filter(o => o.type == 'buy').map(o => parseFloat(o.bid.prefix)).reduce((a, b) => a + b, 0)
      m.totalQuote = m.orders.filter(o => o.type == 'sell').map(o => parseFloat(o.bid.prefix)).reduce((a, b) => a + b, 0)

      return m
    })
  },

  pairsCount(state, getters, rootState) {
    return getters.pairPositions.length
  }
}
