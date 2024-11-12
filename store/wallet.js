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
    const { tokens, userBalances, network } = rootState

    // Ensure tokens and userBalances are defined
    if (!tokens || !userBalances) {
      return []
    }

    const result = userBalances.map((token) => {
      const id = `${token.currency}-${token.contract}`.toLowerCase()
      const tokenData = tokens.find((t) => t.id === id)
      const price = tokenData ? tokenData.usd_price : 0
      const usd_value = parseFloat(token.amount) * price

      return {
        ...token,
        id,
        symbol: token.currency,
        usd_value,
      }
    })

    // Check and add a default entry for 'usdt.alcor' on the 'wax' network if it does not exist
    if (network.name === 'wax' && !result.some((b) => b.currency === 'WAXUSDC' && b.contract === 'eth.token')) {
      result.push({
        currency: 'WAXUSDC',
        contract: 'eth.token',
        decimals: 6,
        amount: 0,
        id: 'waxusdc-eth.token', // Match the ID format of other entries
        usd_value: 0,
      })
    }

    result.sort((a, b) => {
      const { baseToken, name } = network

      if (name === 'wax' && a.currency === 'WAXUSDC' && a.contract === 'eth.token') {
        return -1
      }

      if (a.contract === baseToken.contract) {
        return -1
      }

      return b.usd_value - a.usd_value // Sort by USD value, highest first
    })

    return result
  },

  portfolioUSDValue(state, getters, rootState) {
    return getters.balances.reduce((sum, b) => sum + b.usd_value, 0)
  },

  buyPositionsCount(state, getters, rootState) {
    return rootState.userOrders.filter((p) => p.type == 'buy').length
  },

  sellPositionsCount(state, getters, rootState) {
    return rootState.userOrders.filter((p) => p.type == 'sell').length
  },

  pairPositions(state, getters, rootState) {
    const markets = []

    rootState.userOrders.map((o) => {
      if (markets.filter((m) => m.id == o.market_id).length == 0) {
        markets.push({
          ...rootState.markets_obj[o.market_id],
          orders: [o],
        })
      } else {
        markets.filter((m) => m.id == o.market_id)[0].orders.push(o)
      }
    })

    return markets.map((m) => {
      m.orderCount = {
        buy: m.orders.filter((o) => o.type == 'buy').length,
        sell: m.orders.filter((o) => o.type == 'sell').length,
      }

      m.totalBase = m.orders
        .filter((o) => o.type == 'buy')
        .map((o) => parseFloat(o.bid.prefix))
        .reduce((a, b) => a + b, 0)
      m.totalQuote = m.orders
        .filter((o) => o.type == 'sell')
        .map((o) => parseFloat(o.bid.prefix))
        .reduce((a, b) => a + b, 0)

      return m
    })
  },

  allOrders(state, getters, rootState) {
    const orders = []

    for (const position of getters.pairPositions) {
      for (const order of position.orders) {
        orders.unshift({
          ...order,
          market_id: position.id,
          market_symbol: position.symbol,
          market: { id: position.id, slug: position.slug },
        })
      }
    }

    return orders.sort((a, b) => b.unit_price - a.unit_price)
  },

  pairsCount(state, getters, rootState) {
    return getters.pairPositions.length
  },
}
