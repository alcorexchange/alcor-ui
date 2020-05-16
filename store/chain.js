import { configureScope, captureException } from '@sentry/browser'
import { PushTransactionArgs } from 'eosjs/dist/eosjs-rpc-interfaces'

import * as waxjs from '@waxio/waxjs/dist'

import config from '../config'

const transactionHeader = {
  blocksBehind: 3,
  expireSeconds: 60 * 3
}

export const state = () => ({
  loginPromise: null,
  scatterConnected: false,
  oldScatter: false,
  wallet: {},
  payForUser: false,

  provider: 0,
  currentWallet: 'scatter'
})

async function serverSign(transaction, txHeaders) {
  const rawResponse = await fetch('/api/sign', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tx: transaction, txHeaders })
  })

  const content = await rawResponse.json()
  if (content.error) throw new Error(content.error)

  const pushTransactionArgs = {
    ...content,
    serializedTransaction: Buffer.from(content.serializedTransaction, `hex`)
  }

  return pushTransactionArgs
}

export const actions = {
  nextProvider({ state, commit }, providers) {
    const next = state.provider + 1

    if (next == providers.length) {
      commit('setProvider', 0)
    } else {
      commit('setProvider', next)
    }
  },

  async init({ state, commit, dispatch, rootState, rootGetters }) {
    // TODO Refactor handle different wallets working
    if (rootState.user) return

    if (rootState.network.name == 'wax') {
      if (state.wallet.wax) return

      // Check for wax auto login
      const wax = new waxjs.WaxJS('https://wax.greymass.com', null, null, false)
      commit('setWallet', { ...state.wallet, wax })

      const isAutoLoginAvailable = await wax.isAutoLoginAvailable()
      if (isAutoLoginAvailable) {
        commit('setCurrentWallet', 'wax')
        commit('setUser', { name: wax.userAccount }, { root: true })
        return
      }
      console.log('no wax autologin found...')
    }

    const initAccessContext = require('eos-transit').initAccessContext
    const scatter = require('eos-transit-scatter-provider').default
    const tokenpocket = require('eos-transit-tokenpocket-provider').default
    const anchor = require('eos-transit-anchorlink-provider').default

    const accessContext = initAccessContext({
      appName: config.APP_NAME,
      network: {
        host: rootState.network.host,
        port: rootState.network.port,
        protocol: rootState.network.protocol,
        chainId: rootState.network.chainId
      },
      walletProviders: [
        tokenpocket(),
        scatter(),
        //anchor()
      ]
    })

    console.log('change provider:', state.provider)

    const walletProviders = accessContext.getWalletProviders()
    const selectedProvider = walletProviders[state.provider]
    const wallet = accessContext.initWallet(selectedProvider)

    try {
      await wallet.connect()
      commit('setWallet', { ...state.wallet, scatter: wallet })
    } catch (e) {
      console.log('scatter err', e)
      console.log('scatter not connected, retry width provider', state.provider)
      dispatch('nextProvider', walletProviders)

      await new Promise(resolve => setTimeout(resolve, 1000))
      return await dispatch('init')
    }

    commit('setScatterConnected', wallet.connected)

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

    console.log('App starting..')
  },

  async logout({ state, commit, getters }) {
    switch (state.currentWallet) {
      case 'scatter':
        commit('setUser', null, { root: true })
        await state.wallet.scatter.logout()
        break
      default:
        commit('setUser', null, { root: true })
    }
  },

  async login({ state, commit, dispatch }, provider = 'scatter') {
    try {
      if (provider == 'scatter') {
        if (!state.scatterConnected) return this._vm.$notify({ title: 'Login', message: 'Scatter is not connected', type: 'error' })

        await state.wallet.scatter.login()

        configureScope(scope => scope.setUser({ username: state.wallet.scatter.accountInfo.account_name }))
        commit('setUser', { ...state.wallet.scatter.accountInfo, name: state.wallet.scatter.accountInfo.account_name }, { root: true })
        dispatch('loadUserBalances', {}, { root: true })
        commit('setCurrentWallet', 'scatter')
      } else if (provider == 'wax') {
        const userAccount = await state.wallet.wax.login()
        commit('setUser', { name: userAccount }, { root: true })
        commit('setCurrentWallet', 'wax')
      }

      if (state.loginPromise) state.loginPromise.resolve(true)
    } catch (e) {
      dispatch('loadUserBalances', {}, { root: true })
      captureException(e)
      this._vm.$notify({ title: 'Login', message: e.message, type: 'error' })
      if (state.loginPromise) state.loginPromise.resolve(false)
    } finally {
      commit('setLoginPromise', null)
    }
  },

  transfer({ dispatch, rootState }, { contract, actor, quantity, memo, to }) {
    return dispatch('sendTransaction',
      [
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
          authorization: [
            {
              actor: account,
              permission: 'active'
            }
          ],
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

  async sendTransaction({ state, rootState, dispatch }, actions) {
    const tx = { actions }

    let result
    if (state.currentWallet == 'wax') {
      console.log(state.wallet.wax)
      result = await state.wallet.wax.api.transact(tx, transactionHeader)
    } else {
      let pushTransactionArgs = PushTransactionArgs
      let serverTransactionPushArgs = PushTransactionArgs | undefined

      if (state.payForUser && rootState.network.name == 'eos') {
        try {
          serverTransactionPushArgs = await serverSign(tx, transactionHeader)
          console.log('serverTransactionPushArgs ', serverTransactionPushArgs)
        } catch (error) {
          this._vm.$notify({ title: 'Free CPU', message: error.message, type: 'warning' })

          console.error(`Error when requesting server signature: `, error.message)
        }
      }

      if (state.payForUser && serverTransactionPushArgs && rootState.network.name == 'eos') {
        // just to initialize the ABIs and other structures on api
        // https://github.com/EOSIO/eosjs/blob/master/src/eosjs-api.ts#L214-L254
        await state.wallet.scatter.eosApi.transact(tx, {
          ...transactionHeader,
          sign: false,
          broadcast: false
        })

        // fake requiredKeys to only be user's keys
        const requiredKeys = await state.wallet.scatter.eosApi.signatureProvider.getAvailableKeys()
        // must use server tx here because blocksBehind header might lead to different TAPOS tx header

        const abis = actions.map(x => ({ accountName: x.account }))
        abis.push({ accountName: 'eostokensdex' })

        const serializedTx = serverTransactionPushArgs.serializedTransaction
        const signArgs = {
          chainId: state.wallet.scatter.eosApi.chainId,
          requiredKeys,
          serializedTransaction: serializedTx,
          abis
        }
        pushTransactionArgs = await state.wallet.scatter.eosApi.signatureProvider.sign(signArgs)
        // add server signature
        pushTransactionArgs.signatures.unshift(
          serverTransactionPushArgs.signatures[0]
        )
      } else {
        // no server response => sign original tx
        pushTransactionArgs = await state.wallet.scatter.eosApi.transact(tx, {
          ...transactionHeader,
          sign: true,
          broadcast: false
        })
      }

      result = await state.wallet.scatter.eosApi.pushSignedTransaction(pushTransactionArgs)
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

  setScatterConnected: (state, value) => {
    state.scatterConnected = value
  },

  setOldScatter: (state, value) => {
    state.oldScatter = value
  },

  setProvider: (state, value) => {
    state.provider = value
  }
}
