import { captureException } from '@sentry/browser'

// import { asset } from 'eos-common'
import Big from 'big.js'

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
  init({ state, commit, dispatch }) {
    this.$socket.on('new_deals', new_deals => {
      // TODO Refactor it
      state.deals.unshift(...new_deals)
      commit('setDeals', state.deals.slice(0, 100))
    })

    this.$socket.on('connect', () => {
      if (state.id) dispatch('startStream', state.id)
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
    if (market === undefined) return

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

  fetchAsks({ state, commit, dispatch }) {
    dispatch('api/getSellOrders', { market_id: state.id, key_type: 'i128', index_position: 2 }, { root: true }).then(orders => commit('setAsks', orders))
  },

  fetchBids({ state, commit, dispatch }) {
    dispatch('api/getBuyOrders', { market_id: state.id, key_type: 'i128', index_position: 2 }, { root: true }).then(orders => commit('setBids', orders))
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

  clearField({ commit }) {
    commit('SET_PRICE', null)
    commit('SET_AMOUNT_BUY', null)
    commit('SET_AMOUNT_SELL', null)
    commit('SET_PERCENT_BUY', 0)
    commit('SET_PERCENT_SELL', 0)
    commit('SET_TOTAL_BUY', null)
    commit('SET_TOTAL_SELL', null)
  },
  async changePrice({ commit, dispatch }, price) {
    commit('SET_PRICE', price)
    dispatch('calcAndSetTotal')
  },
  changeAmount({ commit, dispatch }, params) {
    const amount = params.amount.toString() ? params.amount.toString().replace(/[^\d.]/g, '') : null
    const type = params.type

    if (type == 'buy') {
      commit('SET_AMOUNT_BUY', amount)
      dispatch('calcAndSetTotal')
    }

    if (type == 'sell') {
      commit('SET_AMOUNT_SELL', amount)
      dispatch('calcAndSetTotal')
    }
  },
  async changeTotal({ state, commit, dispatch }, params) {
    const total = params.total.toString() ? params.total.toString().replace(/[^\d.]/g, '') : null
    const type = params.type

    if (type == 'buy') {
      commit('SET_TOTAL_BUY', total)
      const amount = await dispatch('calculateAmount', { total: state.total_buy })
      commit('SET_AMOUNT_BUY', amount)
    } else if (type == 'sell') {
      commit('SET_TOTAL_SELL', total)
      const amount = await dispatch('calculateAmount', { total: state.total_sell })
      commit('SET_AMOUNT_SELL', amount)
    }
  },
  async calcAndSetTotal({ state, commit, dispatch }) {
    if (state.amount_buy > 0) {
      const totalBuy = await dispatch('calculateTotal', { amount: state.amount_buy })
      commit('SET_TOTAL_BUY', totalBuy)
    } else {
      commit('SET_TOTAL_BUY', null)
    }

    if (state.amount_sell > 0) {
      const totalSell = await dispatch('calculateTotal', { amount: state.amount_sell })
      commit('SET_TOTAL_SELL', totalSell)
    } else {
      commit('SET_TOTAL_SELL', null)
    }
  },
  calculateTotal({ state }, params) {
    if (!state.price_bid) return null

    const bp = state.base_token.symbol.precision
    const price = Big(state.price_bid)
    const amount = Big(params.amount)
    const total = price.times(amount).round(bp, 0)
    return total.toString()
  },
  async setPrecisionPrice({ state, commit, dispatch }, inPrice = null) {
    const price = inPrice !== null ? inPrice : state.price_bid
    const precision = config.PRICE_DIGITS
    const correctPrice = Math.max(parseFloat(price) || 0, 1 / 10 ** precision)
    const floatPrice = correctPrice.toFixed(precision)
    commit('SET_PRICE', floatPrice)
    dispatch('calcAndSetTotal')
  },
  calculateAmount({ state }, params) {
    if (!state.price_bid || !params.total) return null

    Big.NE = -9
    const qp = state.quote_token.symbol.precision
    const price = Big(state.price_bid)
    const total = Big(params.total)
    const amount = total.div(price).round(qp, 3)
    return amount.toString()
  },
  async setPrecisionAmountBuy({ state, commit, dispatch }) {
    const prec = state.quote_token.symbol.precision
    if (state.amount_buy) {
      const amount = Big(state.amount_buy).round(prec, 0).toString()
      commit('SET_AMOUNT_BUY', amount)

      await dispatch('changeAmount', { amount, type: 'buy' })
    } else {
      commit('SET_AMOUNT_BUY', null)
    }
  },
  async setPrecisionAmountSell({ state, commit, dispatch }) {
    const prec = state.quote_token.symbol.precision
    if (state.amount_sell) {
      const amount = Big(state.amount_sell).round(prec, 0).toString()
      commit('SET_AMOUNT_SELL', amount)

      await dispatch('changeAmount', { amount, type: 'sell' })
    } else {
      commit('SET_AMOUNT_SELL', null)
    }
  },
  setPrecisionTotalBuy({ state, commit }) {
    const prec = state.base_token.symbol.precision
    if (state.total_buy) {
      const total = Big(state.total_buy).round(prec, 0)
      commit('SET_TOTAL_BUY', total)
    } else {
      commit('SET_TOTAL_BUY', null)
    }
  },
  setPrecisionTotalSell({ state, commit }) {
    const prec = state.base_token.symbol.precision
    if (state.total_sell) {
      const total = Big(state.total_sell).round(prec, 0)
      commit('SET_TOTAL_SELL', total)
    } else {
      commit('SET_TOTAL_SELL', null)
    }
  },
  calculatePercent({ state }, params) {
    if (parseFloat(!params.balance) || params.percent == 0) return false

    const balanceStr = params.balance.replace(/[^\d.]/g, '')
    const balance = Big(balanceStr)
    const percent = Big(params.percent)
    const prec = params.prec
    const calc = balance.times(percent).div(100).round(prec, 0)
    return calc.toString()
  },
  async changePercentBuy({ state, commit, dispatch, getters }, params) {
    commit('SET_PERCENT_BUY', params.percent)
    const balance = getters.baseBalance
    const prec = state.base_token.symbol.precision
    const total = await dispatch('calculatePercent', { balance, prec, percent: params.percent })

    if (!total) {
      commit('SET_TOTAL_BUY', null)
      return
    }

    await dispatch('changeTotal', { total, type: 'buy' })
  },

  async changePercentSell({ state, commit, dispatch, getters }, percent) {
    commit('SET_PERCENT_SELL', percent)
    const balance = getters.tokenBalance
    const prec = state.quote_token.symbol.precision
    const amount = await dispatch('calculatePercent', { balance, prec, percent })
    if (!amount) {
      commit('SET_AMOUNT_SELL', null)
      return
    }

    dispatch('changeAmount', { amount, type: 'sell' })
  },

  async fetchBuy({ state, dispatch, rootState }, trade) {
    if (!await dispatch('chain/asyncLogin', null, { root: true })) return

    const { user, network } = rootState
    let amount = null
    let total = null

    if (trade == 'limit') {
      amount = state.amount_buy
      total = state.total_buy
    } else {
      amount = '0'
      total = state.total_buy
    }

    const objTrans = [{
      account: state.base_token.contract,
      name: 'transfer',
      authorization: [user.authorization],
      data: {
        from: user.name,
        to: network.contract,
        quantity: `${total} ${state.base_token.symbol.name}`,
        memo: `${amount} ${state.quote_token.str}`
      }
    }]

    try {
      const res = await dispatch('chain/sendTransaction', objTrans, { root: true })
        .then(() => {
          setTimeout(() => {
            dispatch('loadUserBalances', null, { root: true })
            dispatch('loadOrders', state.id, { root: true })
            dispatch('fetchOrders')
          }, 1000)
        })

      return { err: false, desc: res }
    } catch (e) {
      captureException(e, { extra: { order: this.order } })
      return { err: true, desc: e }
    }
  },

  async fetchSell({ state, dispatch, rootState }, trade) {
    if (!await dispatch('chain/asyncLogin', null, { root: true })) return

    const { user } = rootState
    const amount = state.amount_sell
    let total = null

    if (trade == 'limit') {
      total = state.total_sell
    } else {
      total = '0'
    }

    const objTrans = {
      contract: state.quote_token.contract,
      actor: user.name,
      quantity: `${amount} ${state.quote_token.symbol.name}`,
      memo: `${total} ${state.base_token.symbol.name}@${state.base_token.contract}`
    }

    try {
      const res = await dispatch('chain/transfer', objTrans, { root: true })
        .then(() => {
          setTimeout(() => {
            dispatch('loadUserBalances', null, { root: true })
            dispatch('loadOrders', state.id, { root: true })
            dispatch('fetchOrders')
          }, 1000)
        })

      return { err: false, desc: res }
    } catch (e) {
      captureException(e, { extra: { order: this.order } })
      return { err: true, desc: e }
    }
  }
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
