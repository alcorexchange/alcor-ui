import transit from 'eos-transit'

import KeycatProvider from 'eos-transit-keycat-provider'
import SimpleosProvider from 'eos-transit-simpleos-provider'
import AnchorLinkProvider from 'eos-transit-anchorlink-provider'

import * as waxjs from '@waxio/waxjs/dist'

import config from '../config'
import ScatterProvider from '~/plugins/transit/Scatter'

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
  currentWallet: 'transit',

  anchorSession: { accountName: null, authorization: null }
})

export const actions = {
  async init({ state, commit, dispatch, rootState, rootGetters }) {
    if (rootState.network.name == 'wax') {
      if (!state.wallet.wax) {
        // Check for wax auto login
        const wax = new waxjs.WaxJS('https://wax.greymass.com', null, null, false)
        wax.rpc = this.$rpc
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
    // Check if Anchor || Scatter connected
    let connect = false

    if (state.anchorSession.accountName && state.anchorSession.authorization) {
      // Try anchor
      await dispatch('login', 1)
      commit('setProvider', 1)
    } else {
      try {
        connect = await getters.wallet.connect()
      } catch { }

      if (connect) {
        await dispatch('login', 0)
      }
    }
  },

  async logout({ state, commit, getters }) {
    if (state.provider == 1) {
      commit('setAnchorSession', { accountName: null, authorization: null })
    }

    switch (state.currentWallet) {
      case 'transit':
        await getters.wallet.logout()
        commit('setUser', null, { root: true })
        break
      case 'wax':
        // TODO Logount from WCW
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

          if (provider == 1) {
            r = await wallet.login(state.anchorSession.accountName, state.anchorSession.authorization)
          } else {
            r = await wallet.login()
          }
        } catch (e) {
          this._vm.$notify({ title: 'Login error', message: e, type: 'error' })
          if (state.loginPromise) state.loginPromise.resolve(false)
          console.log('login crash...', e)
          getters.wallet.logout()

          if (e.message.includes('unknown key')) {
            dispatch('login')
          }

          return
        }

        if (provider == 1 && (!state.anchorSession.accountName || !state.anchorSession.authorization)) {
          // Save last Anchor session
          commit('setAnchorSession', { accountName: getters.wallet.auth.accountName, authorization: getters.wallet.auth.permission })
        }

        commit('setUser', {
          name: r.account_name,
          authorization: { actor: getters.wallet.auth.accountName, permission: getters.wallet.auth.permission }
        }, { root: true })

        commit('setCurrentWallet', 'transit')
      }

      dispatch('fetchUserDeals', {}, { root: true })

      dispatch('loadUserBalances', {}, { root: true })
      dispatch('market/loadUserOrders', {}, { root: true })

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

  async cancelorder({ dispatch, rootState }, { contract, account, market_id, type, order_id }) {
    const r = await dispatch('sendTransaction',
      [
        {
          account: contract || rootState.network.contract,
          name: type === 'bid' ? 'cancelbuy' : 'cancelsell',
          authorization: [rootState.user.authorization],
          data: { executor: account, market_id, order_id }
        }
      ]
    )

    dispatch('market/loadUserOrders', {}, { root: true })

    return r
  },

  asyncLogin({ rootState, commit, dispatch }) {
    if (rootState.user) return Promise.resolve(true)

    const loginPromise = new Promise((resolve, reject) => {
      commit('setLoginPromise', { resolve, reject })
      dispatch('modal/login', null, { root: true })
    })

    return loginPromise
  },

  async sendTransaction({ state, rootState, dispatch, getters, commit }, actions) {
    const tx = { actions }
    let transact

    await dispatch('resources/showIfNeeded', undefined, { root: true })

    if (state.currentWallet == 'wax') {
      transact = state.wallet.wax.api.transact(tx, transactionHeader)
    } else {
      if (state.payForUser && ['eos'].includes(rootState.network.name)) {
        tx.actions.unshift(fuelNoop)
      }

      // Transit
      getters.wallet.eosApi.rpc = this.$rpc
      transact = getters.wallet.eosApi.transact(tx, transactionHeader)
    }

    commit('loading/OPEN', { title: 'Connecting Wallet', text: 'Waiting transaction approval..' }, { root: true })

    try {
      return await transact
    } catch (e) {
      throw e
    } finally {
      dispatch('update', {}, { root: true })
      commit('loading/CLOSE', {}, { root: true })
    }
  }
}

export const mutations = {
  setLoginPromise: (state, value) => state.loginPromise = value,
  setPayForUser: (state, value) => state.payForUser = value,
  setCurrentWallet: (state, value) => state.currentWallet = value,
  setAnchorSession: (state, value) => state.anchorSession = value,

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
    const LynxProvider = require('eos-transit-lynx-provider').default
    const LedgerProvider = require('eos-transit-ledger-provider').default
    const ProtonProvider = require('~/plugins/transit/ProtonProvider').default

    const walletProviders = [
      ScatterProvider(),
      AnchorLinkProvider(localStorage.getItem('device_id'), {}),
      SimpleosProvider(),
      LynxProvider(),
      LedgerProvider()
    ]

    if (rootState.network.name == 'eos') {
      walletProviders.push(KeycatProvider())
    }

    if (rootState.network.name == 'proton') {
      walletProviders.push(ProtonProvider(config.APP_NAME, { requestAccount: rootState.network.contract }))
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
    let api

    if (wallet.provider.getEosApi !== undefined && wallet.provider.getEosApi() !== undefined) {
      api = wallet.provider.getEosApi()
    } else {
      api = wallet.eosApi
    }

    const getRequiredKeys = api.authorityProvider.getRequiredKeys.bind(api.authorityProvider)

    // swizzle out authority provider to ignore the fuel permission
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
