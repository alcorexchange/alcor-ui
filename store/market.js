// import { asset } from 'eos-common'
import config from '~/config'
import { mergeSamePriceOrders } from '~/utils'

export const state = () => ({
  id: null,

  slug: '',
  symbol: '',
  meta: {},

  base_token: {},
  quote_token: {},

  stats: {},

  bids: [],
  asks: [],

  deals: [],

  streaming: false,

  orderLoading: false,

  price_bid: null,
  amount_buy: null,
  amount_sell: null,
  percent_buy: 0,
  percent_sell: 0,
  total_buy: null,
  total_sell: null
})

export const mutations = {
  setBids: (state, bids) => state.bids = bids,
  setAsks: (state, asks) => state.asks = asks,
  setStreaming: (state, streaming) => state.streaming = streaming,
  setPrice: (state, price) => state.price = price,
  setDeals: (state, deals) => state.deals = deals,

  setMarket: (state, market) => {
    const { id, base_token, quote_token, slug } = market

    state.id = id
    state.slug = slug
    state.symbol = quote_token.symbol.name + '/' + base_token.symbol.name
    state.base_token = base_token
    state.quote_token = quote_token
    state.stats = market
  },

  SET_PRICE: (state, price) => state.price_bid = price,

  SET_AMOUNT_BUY: (state, amount) => state.amount_buy = amount,
  SET_AMOUNT_SELL: (state, amount) => state.amount_sell = amount,
  SET_PERCENT_BUY: (state, percent) => state.percent_buy = percent,
  SET_PERCENT_SELL: (state, percent) => state.percent_sell = percent,
  SET_TOTAL_BUY: (state, amount) => state.total_buy = amount,
  SET_TOTAL_SELL: (state, amount) => state.total_sell = amount
}

export const actions = {
  init({ state, commit }) {
    this.$socket.on('new_deals', new_deals => {
      // TODO Refactor it
      state.deals.unshift(...new_deals)
      commit('setDeals', state.deals.slice(0, 100))
    })
  },

  update({ dispatch }) {
    dispatch('fetchOrders')
  },

  unsubscribe({ state, rootState, commit, dispatch }, market) {
    this.$socket.emit('unsubscribe', { room: 'ticker', params: { chain: rootState.network.name, market } })
    this.$socket.emit('unsubscribe', { room: 'deals', params: { chain: rootState.network.name, market } })
    this.$socket.emit('unsubscribe', { room: 'orders', params: { chain: rootState.network.name, market } })
  },

  startStream({ state, rootState, commit, dispatch }, market) {
    this.$socket.emit('subscribe', { room: 'deals', params: { chain: rootState.network.name, market } })
    this.$socket.emit('subscribe', { room: 'orders', params: { chain: rootState.network.name, market } })

    commit('setStreaming', true)
  },

  setMarket({ state, dispatch, commit }, market) {
    commit('setDeals', [])

    if (process.client) {
      if (state.id) {
        dispatch('startStream', market.id)
      } else {
        dispatch('startStream', market.id)
      }
    }

    commit('setMarket', market)

    if (process.client) {
      dispatch('loadOrders', market.id, { root: true })
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

  async fetchMarket({ state, commit, rootGetters, dispatch }) {
    const { data: market } = await this.$axios.get(`/markets/${state.id}`)

    if (market.id != state.id) {
      throw new Error(`Market with id ${market.id} not found or closed :(`)
    }

    commit('setMarket', market)
    // TODO Move to client side
  },

  /**
   * @param {Object} params - Has two parameters for calculating the accuracy of assets
   * @param {string} params.int - The quantity to be reduced to a fractional
   * @param {string} param.prec - How many characters after the comma
   */
  calculatePrecision({ state }, params) {
    return parseFloat(params.int).toFixed(params.prec)
  },

  setPrecisionPrice({ state, commit }) {
    const precision = config.PRICE_DIGITS
    const price = Math.max(parseFloat(state.price_bid) || 0, 1 / 10 ** precision)
    const floatPrice = price.toFixed(precision)

    commit('SET_PRICE', floatPrice)
  },

  async setPrecisionAmountBuy({ state, commit, dispatch }) {
    const float = await dispatch('calculatePrecision', {
      int: state.amount_buy,
      prec: state.quote_token.symbol.precision
    })

    commit('SET_AMOUNT_BUY', float)
  },

  async setPrecisionAmountSell({ state, commit, dispatch }) {
    const float = await dispatch('calculatePrecision', {
      int: state.amount_sell,
      prec: state.quote_token.symbol.precision
    })

    commit('SET_AMOUNT_SELL', float)
  },

  async setPrecisionTotalBuy({ state, commit, dispatch }) {
    const float = await dispatch('calculatePrecision', {
      int: state.total_buy,
      prec: state.base_token.symbol.precision
    })

    commit('SET_TOTAL_BUY', float)
  },

  async setPrecisionTotalSell({ state, commit, dispatch }) {
    const float = await dispatch('calculatePrecision', {
      int: state.total_sell,
      prec: state.base_token.symbol.precision
    })

    commit('SET_TOTAL_SELL', float)
  }

  // setAmountBuy({ state, commit }, amount) {

  //   // const symbolUpperCase = state.base_token.symbol.name.toUpperCase()
  //   // const amountFrac = asset(`${amountFloat} ${symbolUpperCase}`).amount

  //   commit('SET_AMOUNT_BUY', {
  //     // frac: amountFrac,
  //     whole: amount
  //   })
  // },

  // setBuyTotal({ state, commit }, total) {
  //   const bp = state.base_token.symbol.precision
  //   const qp = state.quote_token.symbol.precision
  //   const totalFloat = parseFloat(total).toFixed(bp)

  //   if (state.price_bid > 0) {
  //     const priceFloat = parseFloat(state.price_bid).toFixed(bp)
  //     const amount = totalFloat / priceFloat
  //     commit('SET_AMOUNT_BUY', amount.toFixed(qp))
  //   }

  //   commit('SET_TOTAL_BUY', totalFloat)
  // }
}

export const getters = {
  price(state) {
    if (state.deals.length > 0) {
      return state.deals[0].unit_price.toFixed(8)
    }

    return '0.00000000'
  },

  meta(state, getters, rootState) {
    return rootState.markets.filter(m => m.id == state.id)[0] || {}
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

  sorted_asks(state, getters, rootState) {
    if (rootState.user) {
      state.asks.filter(o => o.account == rootState.user.name).forEach(o => o.myOrder = true)
    }

    return mergeSamePriceOrders(state.asks)
  },

  sorted_bids(state, getters, rootState) {
    if (rootState.user) {
      state.bids.filter(o => o.account == rootState.user.name).forEach(o => o.myOrder = true)
    }

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

    if (!user || !user.balances || !state.quote_token.symbol.name) return '0.0000 ' + state.quote_token.symbol.name
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
