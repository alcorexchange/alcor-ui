import axios from 'axios'

import config from '~/config'
import { parseAsset } from '~/utils'

export const strict = false

const IP_REGEX = RegExp(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$/)

export const state = () => ({
  user: null,
  userDeals: [],

  markets: [],
  network: {},

  isMobile: false,
  theme: 'light',
  baseUrl: '',
  loading: false,
  tokens: [],
  ibcTokens: ['bosibc.io']
})

export const mutations = {
  setNetwork: (state, network) => {
    state.network = network
  },

  setUser: (state, user) => state.user = user,
  setMarkets: (state, markets) => state.markets = markets,
  setUserDeals: (state, deals) => state.userDeals = deals,

  setIsMobile: (state, mobile) => state.isMobile = mobile,
  setBaseUrl: (state, url) => state.baseUrl = url,
  setLoading: (state, loading) => state.loading = loading,
  setTokens: (state, tokens) => state.tokens = tokens,
  setIbcTokens: (state, ibcTokens) => state.ibcTokens = ibcTokens,
  setTheme: (state, theme) => state.theme = theme
}

export const actions = {
  init({ dispatch, state }) {
    dispatch('fetchTokens')
    window.addEventListener('resize', () => dispatch('checkIsMobile'))

    console.log('state.network.name', state.network.name)

    //setInterval(() => dispatch('market/fetchOrders', {}, { root: true }), 10000)

    if (state.network.name == 'local') return

    dispatch('loadMarkets')
    dispatch('loadIbc')
    dispatch('pools/fetchPools', {}, { root: true })
    dispatch('pools/updatePool', {}, { root: true })

    setInterval(() => dispatch('update'), 15000)
    setInterval(() => dispatch('pools/updatePool', {}, { root: true }), 10000)
  },

  toggleTheme({ state, commit }) {
    document.documentElement.classList.toggle('theme-dark')
    commit('setTheme', state.theme == 'light' ? 'dark' : 'light')
  },

  checkIsMobile ({ commit }) {
    commit('setIsMobile', window.innerWidth <= 1000)
  },

  async fetchTokens({ commit }) {
    const { data: tokens } = await axios.get('https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/tokens.json')

    commit('setTokens', tokens)
  },

  nuxtServerInit ({ commit, rootState }, { req }) {
    const protocol = process.env.isDev ? 'http' : 'https'
    commit('setBaseUrl', `${protocol}://${req.headers.host}`)

    const subdomain = req.headers.host.split('.')

    if (process.env.NETWORK) {
      commit('setNetwork', config.networks[process.env.NETWORK])
    } else if (IP_REGEX.test(req.headers.host)) {
      commit('setNetwork', config.networks.eos)
    } else if (subdomain.length <= 2) {
      commit('setNetwork', config.networks.eos)
    } else {
      commit('setNetwork', config.networks[subdomain[0]])
    }
  },

  update({ dispatch }) {
    dispatch('loadUserBalances')
  },

  async loadMarkets({ state, commit, getters, dispatch }) {
    const { data } = await getters['api/backEnd'].get('/api/markets')
    data.map(m => {
      m.symbol = m.quote_token.symbol.name + ' / ' + m.base_token.symbol.name
      m.slug = (m.quote_token.str + '_' + m.base_token.str).toLowerCase().replace(/@/g, '-')
    })
    commit('setMarkets', data)
  },

  loading({ commit }, test = '') {
    // TODO
    commit('setLoading', true)
  },

  async loadIbc({ state, commit, rootGetters }) {
    const { rows: ibcTokens } = await rootGetters['api/rpc'].get_table_rows({
      code: 'bosibc.io',
      scope: 'bosibc.io',
      table: 'accepts',
      limit: 1000
    })

    const tokens = [...new Set([...state.ibcTokens, ...ibcTokens.map(t => t.original_contract)])]

    commit('setIbcTokens', tokens)
  },

  loadUserBalances({ rootState, state, commit }) {
    if (state.user) {
      // TODO Вынести этот эндпоинт в конфиг
      axios.get(`${state.network.lightapi}/api/balances/${state.network.name}/${rootState.user.name}`).then((r) => {
        const balances = r.data.balances
        balances.sort((a, b) => {
          if (a.currency < b.currency) { return -1 }
          if (a.currency > b.currency) { return 1 }

          return 0
        })

        balances.map(b => b.id = b.currency + '@' + b.contract)

        commit('setUser', { ...state.user, balances }, { root: true })
      })
    }
  },

  async fetchUserDeals({ state, commit, rootGetters }) {
    if (!state.user) return

    const { data: deals } = await rootGetters['api/backEnd'].get(`/api/account/${state.user.name}/deals`)
    commit('setUserDeals', deals)
  }
}

export const getters = {
  user(state) {
    return state.user
  },

  knownTokens(state) {
    const tokens = []

    state.markets.map(m => {
      tokens.push(m.quote_token)
    })

    return tokens
  }
}
