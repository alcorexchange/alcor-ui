import { sort_by_price, prepareOrder, mergeSamePriceOrders, parseAsset } from '~/utils'

export const state = () => ({
  id: null,

  slug: '',
  symbol: '',

  base_token: {},
  quote_token: {},

  stats: {},

  bids: [],
  asks: [],

  deals: [],

  streaming: false,

  orderLoading: false
})

export const mutations = {
  setBids: (state, bids) => state.bids = bids,
  setAsks: (state, asks) => state.asks = asks,
  setStreaming: (state, streaming) => state.streaming = streaming,

  setMarket: (state, market) => {
    const { id, base_token, quote_token, slug, symbol } = market

    state.id = id
    state.slug = slug
    state.symbol = symbol
    state.base_token = base_token
    state.quote_token = quote_token
    state.stats = market
  }
}

export const actions = {
  update({ dispatch }) {
    dispatch('fetchOrders')
  },

  startStream({ state, rootState, commit }, { to, from }) {
    if (from) {
      this._vm.$socket.emit('unsubscribe', { room: 'deals', params: { chain: rootState.network.name, market: from } })
      this._vm.$socket.emit('unsubscribe', { room: 'orders', params: { chain: rootState.network.name, market: from } })
      this._vm.$socket.emit('unsubscribe', { room: 'ticker', params: { chain: rootState.network.name, market: from } })
    }
    this._vm.$socket.emit('subscribe', { room: 'deals', params: { chain: rootState.network.name, market: to } })
    this._vm.$socket.emit('subscribe', { room: 'orders', params: { chain: rootState.network.name, market: to } })

    commit('setStreaming', true)
  },

  setMarket({ state, dispatch, commit }, market) {
    if (process.client) {
      if (state.id) {
        dispatch('startStream', { to: market.id, from: state.id })
      } else {
        dispatch('startStream', { to: market.id })
      }
    }

    commit('setMarket', market)
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

    commit('setMarket', market)
    // TODO Move to client side
  }
}

export const getters = {
  token (state) {
    return state.token || {}
  },

  price(state) {
    let price = 0

    if (state.deals.length > 0)
      price = state.deals[0].unit_price
    else if (state.bids.length)
      price = state.bids.sort(sort_by_price)[0].unit_price
    else if (state.asks.length)
      price = state.asks.sort(sort_by_price)[state.asks.length - 1].unit_price

    return price
  },

  sorted_asks(state) {
    return mergeSamePriceOrders(state.asks.slice()).sort(sort_by_price)
  },

  sorted_bids(state) {
    return mergeSamePriceOrders(state.bids.slice()).sort(sort_by_price)
  },

  baseBalance(state, getters, rootState) {
    const { user } = rootState

    if (!user || !user.balances) return '0.0000 ' + state.base_token.symbol.name

    const balance = user.balances.filter(b => b.currency === state.base_token.symbol.name)[0]
    if (!balance) return '0.0000 ' + state.base_token.symbol.name

    return `${balance.amount} ${balance.currency}`
  },

  tokenBalance(state, getters, rootState) {
    const { user } = rootState

    if (!user || !user.balances || !state.quote_token.symbol.name) return '0.0000'
    const balance = user.balances.filter((b) => {
      return b.currency === state.quote_token.symbol.name &&
             b.contract === state.quote_token.contract
    })[0]

    if (balance)
      return `${balance.amount} ${balance.currency}`
    else
      return Number(0).toFixed(state.quote_token.symbol.precision) + ` ${state.quote_token.symbol.name}`
  }
}
