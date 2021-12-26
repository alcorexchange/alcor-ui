import cloneDeep from 'lodash/cloneDeep'

import { captureException } from '@sentry/browser'
import { Big } from 'big.js'

import config from '~/config'

function sortByPrice(a, b) {
  if (a[0] > b[0]) return -1
  if (a[0] < b[0]) return 1
  return 0
}

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
  last_market_subscribed: null,

  orderLoading: false,

  showVolumeInUSD: false,
  price_bid: null,
  amount_buy: null,
  amount_sell: null,
  percent_buy: 0,
  percent_sell: 0,
  total_buy: null,
  total_sell: null,

  markets_active_tab: null
})

export const mutations = {
  setShowVolumeInUSD: (state, value) => state.showVolumeInUSD = value,
  setBids: (state, bids) => state.bids = bids,
  setAsks: (state, asks) => state.asks = asks,
  setStreaming: (state, streaming) => state.streaming = streaming,
  setPrice: (state, price) => state.price = price,
  setDeals: (state, deals) => state.deals = deals,
  setMarketActiveTab: (state, value) => state.markets_active_tab = value,
  setLastMarketSubscribed: (state, value) => state.last_market_subscribed = value,

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
      state.deals.unshift(...new_deals)
      commit('setDeals', state.deals.slice(0, 200))
    })

    this.$socket.io.on('reconnect', () => {
      commit('setBids', [])
      commit('setAsks', [])

      if (state.last_market_subscribed !== null) {
        dispatch('unsubscribe', state.last_market_subscribed)
      }

      if (state.id && this._vm.$nuxt.$route.name == 'trade-index-id') {
        dispatch('startStream', state.id)
      }
    })

    this.$socket.on('orderbook_buy', bids => {
      if (state.bids.length == 0) {
        commit('setBids', bids.sort(sortByPrice))
      } else {
        const old_bids = cloneDeep(state.bids)

        bids.map(b => {
          const old = old_bids.findIndex(old_bid => old_bid[0] == b[0])

          if (old != -1) {
            if (b[1] == 0) {
              old_bids.splice(old, 1)
            } else {
              old_bids[old] = b
            }
          } else if (b[1] !== 0) {
            old_bids.push(b)
          }
        })

        commit('setBids', old_bids)
      }
    })

    this.$socket.on('orderbook_sell', asks => {
      if (state.asks.length == 0) {
        commit('setAsks', asks.sort(sortByPrice))
      } else {
        const old_asks = cloneDeep(state.asks)

        asks.map(b => {
          const old = old_asks.findIndex(old_ask => old_ask[0] == b[0])
          if (old != -1) {
            if (b[1] == 0) {
              old_asks.splice(old, 1)
            } else {
              old_asks[old] = b
            }
          } else if (b[1] !== 0) {
            old_asks.push(b)
          }

          commit('setAsks', old_asks)
        })
      }
    })

    // TODO Update balance each 5 seconds using
    //set
  },

  update({ dispatch }) {
  },

  unsubscribe({ state, rootState, commit, dispatch }, market) {
    this.$socket.emit('unsubscribe', { room: 'orderbook', params: { chain: rootState.network.name, market } })

    this.$socket.emit('unsubscribe', { room: 'ticker', params: { chain: rootState.network.name, market } })
    this.$socket.emit('unsubscribe', { room: 'deals', params: { chain: rootState.network.name, market } })
    this.$socket.emit('unsubscribe', { room: 'orders', params: { chain: rootState.network.name, market } })

    commit('setBids', [])
    commit('setAsks', [])
  },

  startStream({ state, rootState, commit, dispatch }, market) {
    if (market === undefined) return

    this.$socket.emit('subscribe', { room: 'deals', params: { chain: rootState.network.name, market } })
    this.$socket.emit('subscribe', { room: 'orders', params: { chain: rootState.network.name, market } })
    this.$socket.emit('subscribe', { room: 'orderbook', params: { chain: rootState.network.name, market, side: 'buy' } })
    this.$socket.emit('subscribe', { room: 'orderbook', params: { chain: rootState.network.name, market, side: 'sell' } })

    commit('setLastMarketSubscribed', market)
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
      dispatch('updatePairBalances')
    }
  },

  fetchAsks({ state, commit, dispatch }) {
    dispatch('api/getSellOrders', { market_id: state.id, key_type: 'i128', index_position: 2 }, { root: true }).then(orders => commit('setAsks', orders))
  },

  fetchBids({ state, commit, dispatch }) {
    dispatch('api/getBuyOrders', { market_id: state.id, key_type: 'i128', index_position: 2 }, { root: true }).then(orders => commit('setBids', orders))
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
  changePrice({ commit, dispatch }, price) {
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
  setPrecisionPrice({ state, commit, dispatch }, inPrice = null) {
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
      const total = Big(state.total_buy).round(prec, 0).toString()
      commit('SET_TOTAL_BUY', total)
    } else {
      commit('SET_TOTAL_BUY', null)
    }
  },
  setPrecisionTotalSell({ state, commit }) {
    const prec = state.base_token.symbol.precision
    if (state.total_sell) {
      const total = Big(state.total_sell).round(prec, 0).toString()
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
      amount = parseFloat(state.amount_buy).toFixed(state.quote_token.symbol.precision)
      total = parseFloat(state.total_buy).toFixed(state.base_token.symbol.precision)
    } else {
      amount = parseFloat(0).toFixed(state.quote_token.symbol.precision)
      total = parseFloat(state.total_buy).toFixed(state.base_token.symbol.precision)
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
            dispatch('updatePairBalances')
            dispatch('loadOrders', state.id, { root: true })
          }, 1000)
        })

      return { err: false, desc: res }
    } catch (e) {
      captureException(e, { extra: { order: this.order } })
      return { err: true, desc: e }
    }
  },

  updatePairBalances({ state, dispatch, rootState }) {
    dispatch('updateBalance', {
      contract: state.base_token.contract,
      symbol: state.base_token.symbol.name
    }, { root: true })

    dispatch('updateBalance', {
      contract: state.quote_token.contract,
      symbol: state.quote_token.symbol.name
    }, { root: true })
  },

  async fetchSell({ state, dispatch, rootState }, trade) {
    if (!await dispatch('chain/asyncLogin', null, { root: true })) return

    const { user } = rootState
    const amount = parseFloat(state.amount_sell).toFixed(state.quote_token.symbol.precision)
    let total = null

    if (trade == 'limit') {
      total = parseFloat(state.total_sell).toFixed(state.base_token.symbol.precision)
    } else {
      total = parseFloat(0).toFixed(state.base_token.symbol.precision)
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
            dispatch('updatePairBalances')
            dispatch('loadOrders', state.id, { root: true })
          }, 1000)
        })

      return { err: false, desc: res }
    } catch (e) {
      captureException(e, { extra: { order: this.order } })
      return { err: true, desc: e }
    }
  },

  async cancelAll({ dispatch, rootState }, orders) {
    if (orders.length == 0) return

    const actions = []

    orders.map(order => {
      const { account, market_id, id } = order

      actions.push({
        account: rootState.network.contract,
        name: ['buy', 'bid'].includes(order.type) ? 'cancelbuy' : 'cancelsell',
        authorization: [rootState.user.authorization],
        data: { executor: account, market_id, order_id: id }
      })
    })

    await dispatch('chain/sendTransaction', actions, { root: true })
    setTimeout(() => {
      dispatch('updatePairBalances')
      dispatch('loadOrders', orders[0].market_id, { root: true })
    }, 1000)
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
    return state.asks.sort(sortByPrice).reverse()
  },

  sorted_bids(state, getters, rootState) {
    return state.bids.sort(sortByPrice)
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
