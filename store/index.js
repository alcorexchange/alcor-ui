import axios from 'axios'
import config from '~/config'

// I like this
export const strict = false

export const state = () => ({
  user: null
})

export const mutations = {
  setUser: (state, user) => state.user = user
}

export const actions = {
  update({ dispatch }) {
    dispatch('loadUserBalances')
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
  },
}
