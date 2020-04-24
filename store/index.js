import axios from 'axios'

import config from '~/config'
import { parseExtendedAsset } from '~/utils'

export const strict = false

const IP_REGEX = RegExp(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$/)

export const state = () => ({
  user: null,
  history: [],
  markets: [],
  network: {},

  isMobile: false,
  baseUrl: ''
})

export const mutations = {
  setNetwork: (state, network) => {
    state.network = network
  },

  setUser: (state, user) => state.user = user,
  setHistory: (state, history) => state.history = history,
  setMarkets: (state, markets) => state.markets = markets,

  setIsMobile: (state, mobile) => state.isMobile = mobile,
  setBaseUrl: (state, url) => state.baseUrl = url
}

export const actions = {
  init({ dispatch, state }) {
    // Init on client
    dispatch('loadHistory')

    window.addEventListener('resize', () => dispatch('checkIsMobile'))
  },

  checkIsMobile ({ commit }) {
    commit('setIsMobile', window.innerWidth <= 1000)
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
    //dispatch('loadHistory') TODO Может в будущем обновлять
  },

  async loadMarkets({ state, commit, getters, dispatch }) {
    const { data } = await getters['api/backEnd'].get('/api/markets')
    commit('setMarkets', data)
  },

  loadHistory({ state, commit, getters }) {
    const contract = state.network.contract
    const formatActionFilter = action => `${contract}:${action}`

    getters['api/hyperion'].get('/history/get_actions', {
      params: {
        account: contract,
        limit: '1',
        filter: config.CONTRACT_ACTIONS.map(formatActionFilter).join(',')
      }
    }).then(r => {
      // FIXME Really not safe code
      const times = Math.ceil(r.data.total.value / 1000)
      let offset = 0
      const requests = []

      for (let i = 0; i < times; i++) {
        requests.push(
          getters['api/hyperion'].get('/history/get_actions', {
            params: {
              account: state.network.contract,
              skip: offset,
              filter: config.CONTRACT_ACTIONS.map(formatActionFilter).join(','),
              limit: '1000'
            }
          })
        )
        offset += 1000
      }

      Promise.all(requests).then(data => {
        commit('setHistory', [].concat(...data.map(d => d.data.actions)).filter(a => {
          return ['sellreceipt', 'buyreceipt', 'sellmatch', 'buymatch', 'cancelbuy', 'cancelsell'].includes(a.act.name)
        }))
      })
    })
  },

  loadUserBalances({ rootState, state, commit }) {
    if (state.user) {
      // TODO Вынести этот эндпоинт в конфиг
      axios.get(`${state.network.lightapi}/api/account/${state.network.name}/${rootState.user.name}`).then((r) => {
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
  }
}

export const getters = {
  user(state) {
    return state.user
  },

  baseBalance(state) {
    if (!state.user || !state.user.balances) return '0.0000 ' + state.network.baseToken.symbol

    const balance = state.user.balances.filter(b => b.currency === state.network.baseToken.symbol)[0]
    if (!balance) return '0.0000 ' + state.network.baseToken.symbol

    return `${balance.amount} ${balance.currency}`
  },

  tokenBalance(state) {
    if (!state.user || !state.user.balances || !state.market.token.symbol) return '0.0000'
    const balance = state.user.balances.filter((b) => {
      return b.currency === state.market.token.symbol.name &&
             b.contract === state.market.token.contract
    })[0]

    if (balance)
      return `${balance.amount} ${balance.currency}`
    else
      return Number(0).toFixed(state.market.token.symbol.precision) + ` ${state.market.token.symbol.name}`
  }
}
