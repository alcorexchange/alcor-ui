import { configureScope } from '@sentry/browser'
import config from '../config'

export const state = () => ({
  scatterConnected: true,
  oldScatter: false,
  wallet: {}
})

export const actions = {
  async init({ state, commit, dispatch, rootState, rootGetters }) {
    const initAccessContext = require('eos-transit').initAccessContext
    const scatter = require('eos-transit-scatter-provider').default
    console.log('Connect scatter..')

    const accessContext = initAccessContext({
      appName: config.APP_NAME,
      network: rootState.network,
      walletProviders: [
        scatter()
      ]
    })

    const walletProviders = accessContext.getWalletProviders()
    const selectedProvider = walletProviders[0]
    const wallet = accessContext.initWallet(selectedProvider)

    commit('setWallet', wallet)

    await wallet.connect()
    console.log(wallet)
    commit('setScatterConnected', wallet.connected)

    if (state.scatterConnected) {
      let scatterVersion
      await dispatch('login')

      try {
        scatterVersion = await window.ScatterJS.scatter.getVersion()
        console.log('scatterVersion', scatterVersion)
      } catch (e) {
        commit('setOldScatter', true)
        scatterVersion = 'Scatter as browser extention (Unmainteined)'
      } finally {
        configureScope(scope =>
          scope.setTag('scatter.version', scatterVersion)
        )
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 3000))
      await dispatch('init')
    }

    console.log('App starting..')
  },

  async logout({ state, commit }) {
    await state.wallet.logout()
    commit('setUser', null, { root: true })
  },

  async login({ state, commit, dispatch }) {
    if (!state.scatterConnected)
      return this._vm.$notify({
        title: 'Login',
        message: 'Scatter is not connected',
        type: 'error'
      })

    try {
      await state.wallet.login()

      configureScope(scope => scope.setUser({ username: state.wallet.accountInfo.account_name }))
      commit('setUser', { ...state.wallet.accountInfo, name: state.wallet.accountInfo.account_name }, { root: true })
      dispatch('loadUserBalances', {}, { root: true })
    } catch (e) {
      this._vm.$notify({ title: 'Login', message: e.message, type: 'error' })
    }
  },

  transfer({ state, rootState }, { contract, actor, quantity, memo }) {
    // NEW eosjs-scatter versions
    return state.wallet.eosApi.transact(
      {
        actions: [
          {
            account: contract,
            name: 'transfer',
            authorization: [
              {
                actor,
                permission: 'active'
              }
            ],
            data: {
              from: actor,
              to: rootState.network.contract,
              quantity,
              memo
            }
          }
        ]
      },
      { blocksBehind: 3, expireSeconds: 3 * 60 }
    )
  },

  cancelorder({ state, rootState }, { account, market_id, type, order_id }) {
    return state.wallet.eosApi.transact(
      {
        actions: [
          {
            account: rootState.network.contract,
            name: type === 'bid' ? 'cancelbuy' : 'cancelsell',
            authorization: [
              {
                actor: account,
                permission: 'active'
              }
            ],
            data: { executor: account, market_id, order_id }
          }
        ]
      },
      { blocksBehind: 3, expireSeconds: 3 * 60 }
    )
  }
}

export const mutations = {
  setWallet: (state, wallet) => {
    state.wallet = wallet
  },

  setScatterConnected: (state, value) => {
    state.scatterConnected = value
  },

  setOldScatter: (state, value) => {
    state.oldScatter = value
  }
}
