export const state = () => ({
  systemPrice: 0
})

export const mutations = {
  setSystemPrice: (state, price) => state.systemPrice = price
}

export const actions = {
  async init({ state, commit, dispatch, rootState, getters }) {
    // const { data } = await this.$axios.get('https://api.coingecko.com/api/v3/simple/price',
    //   {
    //     params: {
    //       ids: rootState.network.name,
    //       vs_currencies: 'usd'
    //     }
    //   }
    // )
    // commit('setSystemPrice', data[rootState.network.name].usd)
    dispatch('loadUserBalances', {}, { root: true })
  }
}

export const getters = {
  balances(state, getters, rootState) {
    const tokens = rootState.tokens
    const balances = rootState.userBalances

    return balances.map(token => {
      const id = (token.currency + '-' + token.contract).toLowerCase()

      const price = tokens.find(t => t.id == id)?.usd_price || 0
      const usd_value = parseFloat(token.amount) * price

      return {
        ...token,
        id, // Patching new standart price
        symbol: token.currency,
        usd_value
      }
    })
  },

  portfolioUSDValue(state, getters, rootState) {
    return getters.balances.reduce((sum, b) => sum + b.usd_value, 0)
  },

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

  allOrders(state, getters, rootState) {
    const orders = []

    for (const position of getters.pairPositions) {
      for (const order of position.orders) {
        orders.unshift({ ...order, market_id: position.id, market_symbol: position.symbol, market: { id: position.id, slug: position.slug } })
      }
    }

    return orders
  },

  pairsCount(state, getters, rootState) {
    return getters.pairPositions.length
  }
}
