import axios from 'axios'

import config from '~/config'
import { hyperion, backEnd } from '~/api'
import { parseAsset, parseExtendedAsset } from '~/utils'

export const strict = false

export const state = () => ({
  user: null,
  history: [],
  markets: []
})

export const mutations = {
  setUser: (state, user) => state.user = user,
  setHistory: (state, history) => state.history = history,
  setMarkets: (state, markets) => state.markets = markets
}

export const actions = {
  init({ dispatch, state }) {
    dispatch('loadHistory')
  },

  update({ dispatch }) {
    dispatch('loadUserBalances')
    dispatch('loadHistory')
  },

  async loadMarkets({ state, commit, rootGetters }) {
    const { rows } = await rootGetters['chain/rpc'].get_table_rows({
      code: config.contract,
      scope: config.contract,
      table: 'markets',
      reverse: true,
      limit: 1000
    })

    rows.map(r => r.token = r.token = parseExtendedAsset(r.token))

    try {
      const { data } = await backEnd.get(`markets`)

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

  loadHistory({ commit }) {
    hyperion.get('/history/get_actions', {
      params: {
        account: config.contract,
        //sort: '1',
        limit: '1000'
      }
    }).then(r => {
      const history = r.data.actions.filter(m => ['sellmatch', 'buymatch'].includes(m.act.name)).map(m => {
        const data = m.act.data.record
        data.trx_id = m.trx_id
        data.type = m.act.name
        data.ask = parseAsset(data.ask)
        data.bid = parseAsset(data.bid)

        // FIXME Fix afret fix contract timestamp
        data.time = new Date(m['@timestamp'])

        return data
      })

      commit('setHistory', history)
    })
  },

  loadUserBalances({ rootState, state, commit }) {
    if (state.user) {
      // TODO Вынести этот эндпоинт в конфиг
      axios.get(`${config.lightapi}/api/account/${config.name}/${rootState.user.name}`).then((r) => {
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
