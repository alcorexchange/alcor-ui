import { sort_by_price, prepareOrder } from '~/utils'

export const state = () => ({
  id: null,
  token: {},
  stats: {},

  bids: [],
  asks: [],

  deals: [],
  charts: [],

  orderLoading: false,
  activeTab: 'first'
})

export const mutations = {
  setId: (state, id) => state.id = id,
  setBids: (state, bids) => state.bids = bids,
  setAsks: (state, asks) => state.asks = asks,
  setCharts: (state, charts) => state.charts = charts,
  setDeals: (state, deals) => state.deals = deals,
  setToken: (state, token) => state.token = token,
  setStats: (state, stats) => state.stats = stats,
  setActiveTab: (state, tab) => state.activeTab = tab,
  setOrderLoading: (state, orderLoading) => state.orderLoading = orderLoading
}

export const actions = {
  async fetchCharts({ state, commit, rootGetters }) {
    const { data: charts } = await rootGetters['api/backEnd'].get(`/api/markets/${state.id}/charts`)
    commit('setCharts', charts)
  },

  async fetchDeals({ state, commit, rootGetters }) {
    const { data: deals } = await rootGetters['api/backEnd'].get(`/api/markets/${state.id}/deals`)
    commit('setDeals', deals)
  },

  async fetchOrders({ state, commit, dispatch }) {
    await Promise.all([
      dispatch('api/getBuyOrders', { market_id: state.id }, { root: true }),
      dispatch('api/getSellOrders', { market_id: state.id }, { root: true })
    ]).then(([buyOrders, sellOrders]) => {
      buyOrders.map(o => prepareOrder(o))
      sellOrders.map(o => prepareOrder(o))

      commit('setBids', buyOrders)
      commit('setAsks', sellOrders)
    }).catch(e => console.log(e))
  },

  async fetchMarket({ state, commit, rootGetters, dispatch }) {
    const { data: market } = await rootGetters['api/backEnd'].get(`/api/markets/${state.id}`)

    if (market.id != state.id) {
      throw new Error(`Market with id ${market.id} not found or closed :(`)
    }

    commit('setToken', market.token)
    commit('setStats', market)
    commit('setId', market.id)

    // TODO Move to client side
  }
}

export const getters = {
  token (state) {
    return state.token || {}
  },

  wrongPrice() {
    //if (this.totalEos === 0.0 || !this.amount || !this.price) return false

    //return assetToAmount(this.amount, 4) * assetToAmount(this.price, 8) % config.PRICE_SCALE !== 0
    return 'todo'
  },

  price(state) {
    let price = 0

    if (state.bids.length)
      price = state.bids.sort(sort_by_price)[0].unit_price
    else if (state.asks.length)
      price = state.asks.sort(sort_by_price)[state.asks.length - 1].unit_price

    return price
  },

  sorted_asks(state) {
    console.log(state.asks)
    return state.asks.slice().sort(sort_by_price)
  },

  sorted_bids(state) {
    return state.bids.slice().sort(sort_by_price)
  }
}
