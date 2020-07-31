import transit from 'eos-transit'

import ScatterProvider from 'eos-transit-scatter-provider'
import KeycatProvider from 'eos-transit-keycat-provider'
import SimpleosProvider from 'eos-transit-simpleos-provider'
import AnchorLinkProvider from 'eos-transit-anchorlink-provider'

import * as waxjs from '@waxio/waxjs/dist'

import config from '../config'

const fuelAuth = {
  actor: 'greymassfuel',
  permission: 'cosign'
}
const fuelNoop = {
  account: 'greymassnoop',
  name: 'noop',
  authorization: [fuelAuth],
  data: {}
}

const transactionHeader = {
  blocksBehind: 3,
  expireSeconds: 60 * 3
}

export const state = () => ({
  loginPromise: null,
  wallet: {},
  payForUser: false,

  provider: 0,
  currentWallet: 'transit'
})

export const actions = {
  async init({ state, commit, dispatch, rootState, rootGetters }) {
    if (rootState.network.name == 'wax') {
      if (!state.wallet.wax) {
        // Check for wax auto login
        const wax = new waxjs.WaxJS('https://wax.greymass.com', null, null, false)
        commit('setWallet', { ...state.wallet, wax })

        const isAutoLoginAvailable = await wax.isAutoLoginAvailable()
        if (isAutoLoginAvailable) {
          commit('setCurrentWallet', 'wax')
          commit('setUser', {
            name: wax.userAccount,
            authorization: {
              actor: wax.userAccount, permission: 'active'
            }
          }, { root: true })

          return
        }
        console.log('no wax autologin found...')
      }
    }

    dispatch('tryLogin')
  },

  async tryLogin({ state, dispatch, commit, getters }) {
    // Check if Scatter connected
    commit('setProvider', 0)
    let connect = false

    try {
      connect = await getters.wallet.connect()
    } catch {}

    if (connect) {
      await dispatch('login', 0)
      // return // FUTURE
    }
  },

  async logout({ state, commit, getters }) {
    switch (state.currentWallet) {
      case 'transit':
        await getters.wallet.logout()
        commit('setUser', null, { root: true })
        break
      default:
        commit('setUser', null, { root: true })
    }
  },

  async login({ state, commit, dispatch, getters, rootState }, provider) {
    try {
      if (provider == 'wax') {
        const userAccount = await state.wallet.wax.login()
        commit('setCurrentWallet', 'wax')
        commit('setUser', {
          name: userAccount,
          authorization: {
            actor: userAccount, permission: 'active'
          }
        }, { root: true })
      } else {
        commit('setProvider', provider)
        const wallet = getters.wallet

        let r
        try {
          if (wallet.connected) {
            // Что бы не залогиниться не с тем контекстом
            await getters.wallet.disconnect()
          }

          await getters.wallet.connect()
          r = await wallet.login()
        } catch (e) {
          this._vm.$notify({ title: 'Login error', message: e, type: 'error' })
          if (state.loginPromise) state.loginPromise.resolve(false)
          console.log('login crash...', e)
          getters.wallet.logout()

          if ('eosio::chain::name' in e) {
            dispatch('login')
          }

          return
        }

        commit('setUser', {
          name: r.account_name,
          authorization: { actor: getters.wallet.auth.accountName, permission: getters.wallet.auth.permission }
        }, { root: true })

        dispatch('loadUserBalances', {}, { root: true })
        commit('setCurrentWallet', 'transit')
      }

      if (state.loginPromise) state.loginPromise.resolve(true)
    } catch (e) {
      if (state.loginPromise) state.loginPromise.resolve(false)
      throw e
    }
  },

  transfer({ dispatch, rootState }, { contract, actor, quantity, memo, to }) {
    return dispatch('sendTransaction',
      [
        {
          account: contract,
          name: 'transfer',
          authorization: [
            rootState.user.authorization
          ],
          data: {
            from: actor,
            to: to || rootState.network.contract,
            quantity,
            memo
          }
        }
      ]
    )
  },

  cancelorder({ dispatch, rootState }, { contract, account, market_id, type, order_id }) {
    return dispatch('sendTransaction',
      [
        {
          account: contract || rootState.network.contract,
          name: type === 'bid' ? 'cancelbuy' : 'cancelsell',
          authorization: [rootState.user.authorization],
          data: { executor: account, market_id, order_id }
        }
      ]
    )
  },

  asyncLogin({ rootState, commit, dispatch }) {
    if (rootState.user) return Promise.resolve(true)

    const loginPromise = new Promise((resolve, reject) => {
      commit('setLoginPromise', { resolve, reject })
      dispatch('modal/login', null, { root: true })
    })

    return loginPromise
  },

  async sendTransaction({ state, rootState, dispatch, getters }, actions) {
    const tx = { actions }

    let result
    if (state.currentWallet == 'wax') {
      result = await state.wallet.wax.api.transact(tx, transactionHeader)
    } else {
      if (state.payForUser && rootState.network.name == 'eos') {
        tx.actions.unshift(fuelNoop)
      }

      result = await getters.wallet.eosApi.transact(tx, transactionHeader)
    }

    dispatch('update', {}, { root: true })
    return result
  }
}

export const mutations = {
  setLoginPromise: (state, value) => state.loginPromise = value,
  setPayForUser: (state, value) => state.payForUser = value,
  setCurrentWallet: (state, value) => state.currentWallet = value,

  setWallet: (state, wallet) => {
    state.wallet = wallet
  },

  setProvider: (state, value) => {
    state.provider = value
  }
}

export const getters = {
  chainName(state, getters, rootState) {
    return rootState.network.name
  },

  accessContext(state, getters, rootState) {
    const TokenPoketProvider = require('eos-transit-tokenpocket-provider').default
    const LynxProvider = require('eos-transit-lynx-provider').default

    const walletProviders = [
      ScatterProvider(),
      TokenPoketProvider(),
      AnchorLinkProvider(config.APP_NAME, {}),
      SimpleosProvider(),
      LynxProvider()
    ]

    if (rootState.network.name == 'eos') {
      walletProviders.push(KeycatProvider())
    }

    return transit.initDefaultAccessContext({
      appName: config.APP_NAME,
      network: {
        host: rootState.network.host,
        port: rootState.network.port,
        protocol: rootState.network.protocol,
        chainId: rootState.network.chainId
      },
      walletProviders
    })
  },

  walletProviders(state, getters) {
    return getters.accessContext.getWalletProviders()
  },

  walletProvider(state, getters) {
    return getters.walletProviders[state.provider]
  },

  wallet(state, getters) {
    const wallet = getters.accessContext.initWallet(getters.walletProvider)
    const api = wallet.eosApi
    // swizzle out authority provider to ignore the fuel permission
    const getRequiredKeys = api.authorityProvider.getRequiredKeys.bind(api.authorityProvider)
    api.authorityProvider.getRequiredKeys = (args) => {
      const actions = args.transaction.actions.map((action) => {
        const authorization = action.authorization.filter(
          ({ actor, permission }) =>
            !(actor === fuelAuth.actor && permission === fuelAuth.permission)
        )
        return {
          ...action,
          authorization
        }
      })
      const transaction = {
        ...args.transaction,
        actions
      }
      return getRequiredKeys({
        ...args,
        transaction
      })
    }
    wallet.eosApi = api
    return wallet
  }
}
