export const state = () => ({
})

export const mutations = {
}

export const actions = {
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

    markets.map(m => {
      m.orderCount = {
        buy: m.orders.filter(o => o.type == 'buy').length,
        sell: m.orders.filter(o => o.type == 'sell').length
      }

      m.totalBase = m.orders.filter(o => o.type == 'buy').map(o => parseFloat(o.bid.prefix)).reduce((a, b) => a + b, 0)
      m.totalQuote = m.orders.filter(o => o.type == 'sell').map(o => parseFloat(o.bid.prefix)).reduce((a, b) => a + b, 0)
    })

    return markets
  },

  pairsCount(state, getters, rootState) {
    return getters.pairPositions.length
  }
}
