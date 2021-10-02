import axios from 'axios'

import { make256key, nameToUint64 } from '~/utils'

export const strict = false

export const state = () => ({
  user: null,
  userDeals: [],
  userOrders: [],
  userOrdersLoading: true,
  account: null,
  liquidityPositions: [],

  markets: [],
  markets_obj: {},
  network: {},

  baseUrl: '',
  tokens: [],
  ibcTokens: ['eth.token'],
  ibcAccepts: []
})

export const mutations = {
  setNetwork: (state, network) => {
    state.network = network
  },

  setUser: (state, user) => state.user = user,
  setMarkets: (state, markets) => {
    state.markets_obj = markets.reduce((obj, item) => Object.assign(obj, { [item.id]: item }), {})
    state.markets = markets
  },
  setUserDeals: (state, deals) => state.userDeals = deals,
  setLiquidityPositions: (state, positions) => state.liquidityPositions = positions,

  setBaseUrl: (state, url) => state.baseUrl = url,
  setLoading: (state, loading) => state.loading = loading,
  setTokens: (state, tokens) => state.tokens = tokens,
  setAccount: (state, account) => state.account = account,

  setUserOrders: (state, orders) => state.userOrders = orders,
  setUserOrdersLoading: (state, loading) => state.userOrdersLoading = loading
}

export const actions = {
  init({ dispatch, state, getters }) {
    dispatch('fetchTokens')

    if (state.network.name == 'local') return

    dispatch('loadMarkets').then(dispatch('loadUserOrders'))

    setInterval(() => dispatch('update'), 15000)

    this.$socket.on('connect_error', (err) => {
      console.log(`websocket connect_error due to ${err.message}`)
    })

    // TODO Move push notifications to other place
    this.$socket.on('match', match => {
      dispatch('loadOrders', match.market_id)

      const market = getters.markets.filter(m => m.id == match.market_id)[0]

      if (match.bid) {
        this._vm.$notify({
          title: `Order match - ${market.symbol}`,
          message: `${match.bid} ${market.base_token.symbol.name} at ${match.price}`,
          type: 'success'
        })
      } else {
        this._vm.$notify({
          title: `Order match - ${market.symbol}`,
          message: `${match.ask} ${market.base_token.symbol.name} at ${match.price}`,
          type: 'success'
        })
      }
    })
  },

  toggleTheme({ state, commit }) {
    this.$colorMode.preference = this.$colorMode.preference !== 'dark' ? 'dark' : 'light'
  },

  async fetchTokens({ commit }) {
    const { data: tokens } = await this.$axios.get('https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/tokens.json')

    commit('setTokens', tokens)
  },

  update({ dispatch }) {
    dispatch('loadUserBalances')
    dispatch('loadAccountData')
  },

  async loadAccountData({ state, commit, getters, dispatch }) {
    if (!state.user) return

    const account = await this.$rpc.get_account(state.user.name)
    commit('setAccount', account)
  },

  async loadMarkets({ state, commit, getters, dispatch }) {
    const { data } = await this.$axios.get('/markets')
    data.map(m => {
      const { base_token, quote_token } = m

      m.symbol = quote_token.symbol.name + ' / ' + base_token.symbol.name
      m.slug = (quote_token.str + '_' + base_token.str).toLowerCase().replace(/@/g, '-')

      m.i256 = make256key(base_token.contract, base_token.symbol.name, quote_token.contract, quote_token.symbol.name)
    })
    commit('setMarkets', data)
  },

  async loadIbc({ state, commit, rootGetters }) {
    const { rows: ibcTokens } = await this.$rpc.get_table_rows({
      code: 'bosibc.io',
      scope: 'bosibc.io',
      table: 'accepts',
      limit: 1000
    })

    const tokens = [...new Set([...state.ibcTokens, ...ibcTokens.map(t => t.original_contract)])]

    commit('setIbcTokens', tokens)
    commit('setIbcAccepts', ibcTokens)
  },

  loadUserLiqudityPositions({ state, commit }) {
    this.$axios.get(`/account/${state.user.name}/liquidity_positions`).then(r => {
      commit('setLiquidityPositions', r.data)
    })
  },

  async loadUserOrders({ state, commit, dispatch }) {
    if (!state.user || !state.user.name) return
    const markets = state.markets.map(m => m.id)

    console.log('loadOrders start.. ')
    for (const market_id of markets) {
      await dispatch('loadOrders', market_id)
      //await new Promise(resolve => setTimeout(resolve, 500)) // Sleep for rate limit
    }
    console.log('loadOrders finish.')

    commit('setUserOrdersLoading', false)
  },

  async loadOrders({ state, commit, dispatch }, market_id) {
    if (!state.user || !state.user.name || !market_id) return

    const { name } = state.user

    await Promise.all([
      dispatch('api/getBuyOrders', {
        market_id,
        key_type: 'i64',
        index_position: 3,
        lower_bound: nameToUint64(name),
        upper_bound: nameToUint64(name)
      }, { root: true }),

      dispatch('api/getSellOrders', {
        market_id,
        key_type: 'i64',
        index_position: 3,
        lower_bound: nameToUint64(name),
        upper_bound: nameToUint64(name)
      }, { root: true })
    ]).then(([buyOrders, sellOrders]) => {
      buyOrders.map(o => {
        o.type = 'buy'
        o.market_id = market_id
      })
      sellOrders.map(o => {
        o.type = 'sell'
        o.market_id = market_id
      })

      // TODO Need optimization so much!
      commit('setUserOrders', state.userOrders.filter(o => o.market_id != market_id).concat(buyOrders.concat(sellOrders)))
    }).catch(e => console.log(e))
  },

  loadUserBalances({ rootState, state, commit }) {
    if (state.user) {
      // TODO Вынести этот эндпоинт в конфиг
      //this.$axios.get(`${state.network.lightapi}/api/balances/${state.network.name}/${rootState.user.name}`).then((r) => {
      // FIXME Почему то нукстовский аксиос не работает для телефонов
      axios.get(`${state.network.lightapi}/api/balances/${state.network.name}/${rootState.user.name}`).then((r) => {
        const balances = r.data.balances.filter(b => parseFloat(b.amount) > 0)
        balances.sort((a, b) => {
          if (a.contract == 'eosio.token' || b.contract == 'eosio.token') { return -1 }

          if (a.currency < b.currency) { return -1 }
          if (a.currency > b.currency) { return 1 }

          return 0
        })

        balances.map(b => b.id = b.currency + '@' + b.contract)

        commit('setUser', { ...state.user, balances }, { root: true })
      }).catch(e => console.log('balances: ', e))
    }
  },

  async fetchUserDeals({ state, commit }) {
    // TODO Rm this if not userd
    if (!state.user) return

    const { data: deals } = await this.$axios.get(`/account/${state.user.name}/deals`)
    commit('setUserDeals', deals)
  }
}

export const getters = {
  markets(state) {
    return state.markets
  },

  user(state) {
    return state.user
  },

  systemBalance(state) {
    const { symbol, contract } = state.network.baseToken

    if (state.user && state.user.balances) {
      const systemBalance = state.user.balances.filter(b => {
        return b.currency === symbol && b.contract === contract
      })[0]

      if (systemBalance) return parseFloat(systemBalance.amount).toFixed(4) + ' ' + symbol
    }

    return `0.0000 ${symbol}`
  },

  knownTokens(state) {
    const tokens = []

    state.markets.map(m => {
      tokens.push(m.quote_token)
    })

    return tokens
  }
}
