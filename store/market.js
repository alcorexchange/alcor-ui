import { nameToUint64 } from 'eosjs-account-name'

import { mergeSamePriceOrders } from '~/utils'

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

  userOrders: [],

  streaming: false,

  orderLoading: false
})

export const mutations = {
  setBids: (state, bids) => state.bids = bids,
  setAsks: (state, asks) => state.asks = asks,
  setStreaming: (state, streaming) => state.streaming = streaming,
  setPrice: (state, price) => state.price = price,
  setDeals: (state, deals) => state.deals = deals,

  setUserOrders: (state, orders) => state.userOrders = orders,

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

  unsubscribe({ state, rootState, commit, dispatch }, market) {
    this.$socket.emit('unsubscribe', { room: 'deals', params: { chain: rootState.network.name, market } })
    this.$socket.emit('unsubscribe', { room: 'orders', params: { chain: rootState.network.name, market } })
    this.$socket.emit('unsubscribe', { room: 'ticker', params: { chain: rootState.network.name, market } })
  },

  startStream({ state, rootState, commit, dispatch }, { to, from }) {
    //if (from) {
    //  this.$socket.emit('unsubscribe', { room: 'deals', params: { chain: rootState.network.name, market: from } })
    //  this.$socket.emit('unsubscribe', { room: 'orders', params: { chain: rootState.network.name, market: from } })
    //  this.$socket.emit('unsubscribe', { room: 'ticker', params: { chain: rootState.network.name, market: from } })
    //}
    this.$socket.emit('subscribe', { room: 'deals', params: { chain: rootState.network.name, market: to } })
    this.$socket.emit('subscribe', { room: 'orders', params: { chain: rootState.network.name, market: to } })

    this.$socket.on('new_deals', new_deals => {
      commit('setDeals', state.deals.unshift(...new_deals).slice(0, 100))
    })

    commit('setStreaming', true)
  },

  setMarket({ state, dispatch, commit }, market) {
    commit('setDeals', [])
    commit('setUserOrders', [])

    commit('setMarket', market)

    if (process.client) {
      dispatch('loadUserOrders')

      if (state.id) {
        dispatch('startStream', { to: market.id, from: state.id })
      } else {
        dispatch('startStream', { to: market.id })
      }
    }
  },

  async fetchOrders({ state, commit, dispatch }) {
    await Promise.all([
      // Fetching orders by price
      dispatch('api/getBuyOrders', { market_id: state.id, key_type: 'i128', index_position: 2 }, { root: true }),
      dispatch('api/getSellOrders', { market_id: state.id, key_type: 'i128', index_position: 2 }, { root: true })
    ]).then(([buyOrders, sellOrders]) => {
      commit('setBids', buyOrders)
      commit('setAsks', sellOrders)
    }).catch(e => console.log(e))
  },

  async loadUserOrders({ state, rootState, commit, dispatch }) {
    if (!rootState.user || !rootState.user.name || !state.id) return

    const { name } = rootState.user

    await Promise.all([
      dispatch('api/getBuyOrders', {
        market_id: state.id,
        key_type: 'i64',
        index_position: 3,
        lower_bound: nameToUint64(name),
        upper_bound: nameToUint64(name)
      }, { root: true }),

      dispatch('api/getSellOrders', {
        market_id: state.id,
        key_type: 'i64',
        index_position: 3,
        lower_bound: nameToUint64(name),
        upper_bound: nameToUint64(name)
      }, { root: true })
    ]).then(([buyOrders, sellOrders]) => {
      commit('setUserOrders', buyOrders.concat(sellOrders))
    }).catch(e => console.log(e))
  },

  async fetchMarket({ state, commit, rootGetters, dispatch }) {
    const { data: market } = await this.$axios.get(`/markets/${state.id}`)

    if (market.id != state.id) {
      throw new Error(`Market with id ${market.id} not found or closed :(`)
    }

    commit('setMarket', market)
    // TODO Move to client side
  }
}

export const getters = {
  price(state) {
    if (state.deals.length > 0) {
      return state.deals[0].unit_price.toFixed(8)
    }

    return '0.00000000'
  },

  relatedPool(state, getters, rootState) {
    const current = rootState.markets.filter(m => m.id == state.id)[0]
    if (!current) return null
    const pool = rootState.swap.pairs.filter(p => p.i256 == current.i256)[0]
    if (!pool) return null

    if (pool.pool1.contract == current.quote_token.contract &&
      pool.pool1.quantity.symbol.code().to_string() == current.quote_token.symbol.name) {
      pool.rate = (parseFloat(pool.pool2.quantity) / parseFloat(pool.pool1.quantity)).toFixed(6)
    } else {
      pool.rate = (parseFloat(pool.pool1.quantity) / parseFloat(pool.pool2.quantity)).toFixed(6)
    }

    return pool
  },

  token(state) {
    return state.token || {}
  },

  sorted_asks(state) {
    return mergeSamePriceOrders(state.asks)
  },

  sorted_bids(state) {
    return mergeSamePriceOrders(state.bids)
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
