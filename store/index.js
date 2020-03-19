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

    if (process.env.NETWORK) {
      commit('setNetwork', config.networks[process.env.NETWORK])
    } else if (req.headers.host == '127.0.0.1:3000') {
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
    const { rows } = await getters['api/rpc'].get_table_rows({
      code: state.network.contract,
      scope: state.network.contract,
      table: 'markets',
      reverse: true,
      limit: 1000
    })

    rows.map(r => r.token = r.token = parseExtendedAsset(r.token))

    try {
      const requests = rows.map(d => {
        return { market: d, p: dispatch('api/getBuyOrders', { market_id: d.id, index_position: 2, key_type: 'i64', limit: 1 }) }
      })

      await Promise.all(requests.map(r => r.p))

      const markets = []
      for (const req of requests) {
        const { market, p } = req

        const [order] = await p

        if (order) {
          market.last_price = order.unit_price
        } else {
          market.last_price = 0
        }

        markets.push(market)
      }

      commit('setMarkets', markets)
    } catch (e) {
      rows.map(r => r.last_price = '0.' + '0'.repeat(state.network.baseToken.precision) + ' ' + state.network.baseToken.symbol)
      commit('setMarkets', rows)
    }
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
