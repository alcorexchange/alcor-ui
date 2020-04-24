import { configureScope } from '@sentry/browser'
import { PushTransactionArgs } from 'eosjs/dist/eosjs-rpc-interfaces'

import config from '../config'

const transactionHeader = {
  blocksBehind: 3,
  expireSeconds: 60 * 3
}

export const state = () => ({
  scatterConnected: false,
  oldScatter: false,
  wallet: {},
  payForUser: false,

  provider: 0
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
    const initAccessContext = require('eos-transit').initAccessContext
    const scatter = require('eos-transit-scatter-provider').default
    const tokenpocket = require('eos-transit-tokenpocket-provider').default

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
        scatter()
      ]
    })

    console.log('change provider:', state.provider)

    const walletProviders = accessContext.getWalletProviders()
    const selectedProvider = walletProviders[state.provider]
    const wallet = accessContext.initWallet(selectedProvider)

    commit('setWallet', wallet)

    try {
      await wallet.connect()
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

  transfer({ dispatch, rootState }, { contract, actor, quantity, memo }) {
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
            to: rootState.network.contract,
            quantity,
            memo
          }
        }
      ]
    )
  },

  cancelorder({ dispatch, rootState }, { account, market_id, type, order_id }) {
    return dispatch('sendTransaction',
      [
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
    )
  },

  async sendTransaction({ state, rootState }, actions) {
    const tx = {
      actions
    }

    let pushTransactionArgs = PushTransactionArgs
    let serverTransactionPushArgs = PushTransactionArgs | undefined

    if (state.payForUser) {
      try {
        serverTransactionPushArgs = await serverSign(tx, transactionHeader)
        console.log('serverTransactionPushArgs ', serverTransactionPushArgs)
      } catch (error) {
        console.error(`Error when requesting server signature: `, error.message)
      }
    }

    if (state.payForUser && serverTransactionPushArgs && rootState.network.name == 'eos') {
      // just to initialize the ABIs and other structures on api
      // https://github.com/EOSIO/eosjs/blob/master/src/eosjs-api.ts#L214-L254
      await state.wallet.eosApi.transact(tx, {
        ...transactionHeader,
        sign: false,
        broadcast: false
      })

      // fake requiredKeys to only be user's keys
      const requiredKeys = await state.wallet.eosApi.signatureProvider.getAvailableKeys()
      // must use server tx here because blocksBehind header might lead to different TAPOS tx header

      const abis = actions.map(x => ({ accountName: x.account }))
      abis.push({ accountName: 'eostokensdex' })

      const serializedTx = serverTransactionPushArgs.serializedTransaction
      const signArgs = {
        chainId: state.wallet.eosApi.chainId,
        requiredKeys,
        serializedTransaction: serializedTx,
        abis
      }
      pushTransactionArgs = await state.wallet.eosApi.signatureProvider.sign(signArgs)
      // add server signature
      pushTransactionArgs.signatures.unshift(
        serverTransactionPushArgs.signatures[0]
      )
    } else {
      // no server response => sign original tx
      pushTransactionArgs = await state.wallet.eosApi.transact(tx, {
        ...transactionHeader,
        sign: true,
        broadcast: false
      })
    }

    console.log('lolo3', pushTransactionArgs)
    return state.wallet.eosApi.pushSignedTransaction(pushTransactionArgs)
  }
}

export const mutations = {
  setPayForUser: (state, value) => state.payForUser = value,

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
  },
}
