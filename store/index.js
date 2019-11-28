import axios from 'axios'

import config from '~/config'
import { parseExtendedAsset } from '~/utils'

export const strict = false

export const state = () => ({
  user: null,
  history: [],
  markets: [],
  network: {}
})

export const mutations = {
  setNetwork: (state, network) => state.network = network,

  setUser: (state, user) => state.user = user,
  setHistory: (state, history) => state.history = history,
  setMarkets: (state, markets) => state.markets = markets
}

export const actions = {
  init({ dispatch, state }) {
    dispatch('loadHistory')
  },

  nuxtServerInit ({ commit }, { req }) {
    const subdomain = req.headers.host.split('.')

    if (subdomain.length == 1) {
      commit('setNetwork', config.networks.eos)
    } else {
      commit('setNetwork', config.networks[subdomain[0]])
    }
  },

  update({ dispatch }) {
    dispatch('loadUserBalances')
    dispatch('loadHistory')
  },

  async loadMarkets({ state, commit, getters }) {
    const { rows } = await getters['api/rpc'].get_table_rows({
      code: state.network.contract,
      scope: state.network.contract,
      table: 'markets',
      reverse: true,
      limit: 1000
    })

    rows.map(r => r.token = r.token = parseExtendedAsset(r.token))

    try {
      const { data } = await getters['api/backEnd'].get(`markets`)

      rows.map(r => {
        const m = data.filter(d => d.market_id == r.id)[0]
        if (m) {
          r.price = m.last_price
        } else {
          r.price = 0
        }
      })
    } catch {
      rows.map(r => r.price = 0)
    }

    commit('setMarkets', rows)
  },

  loadHistory({ state, commit, getters }) {
    getters['api/hyperion'].get('/history/get_actions', {
      params: {
        account: state.network.contract,
        limit: '1'
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
              limit: '1000'
            }
          })
        )
        offset += 1000
      }

      Promise.all(requests).then(data => {
        commit('setHistory', [].concat(...data.map(d => d.data.actions)))
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

  eosBalance(state) {
    // TODO В стейт
    if (!state.user || !state.user.balances) return '0.0000 EOS'

    const balance = state.user.balances.filter(b => b.currency === 'EOS')[0]
    if (!balance) return '0.0000 EOS'

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
