// import { TextDecoder, TextEncoder } from 'util'
import { TextDecoder, TextEncoder } from 'web-encoding'
import { Api, JsonRpc } from 'eosjs'
import WCW from '~/plugins/wallets/WCW'
import AnchoWallet from '~/plugins/wallets/Anchor'
import ProtonWallet from '~/plugins/wallets/Proton'
import ScatterWallet from '~/plugins/wallets/Scatter'
const rpcWAX = new JsonRpc('https://wax.greymass.com/')
const apiWAX = new Api({
  rpc: rpcWAX,
  textDecoder: new TextDecoder(),
  textEncoder: new TextEncoder(),
})

export const state = () => ({
  loginPromise: null,
  wallets: {},

  payForUser: false,
  currentWallet: 'anchor',
  lastWallet: null,
})

export const mutations = {
  setWallets: (state, value) => (state.wallets = value),
  setLoginPromise: (state, value) => (state.loginPromise = value),
  setPayForUser: (state, value) => (state.payForUser = value),
  setCurrentWallet: (state, value) => (state.currentWallet = value),
  setLastWallet: (state, value) => (state.lastWallet = value),
}

export const actions = {
  init({ state, commit, dispatch, rootState, rootGetters, getters }) {
    const { network } = rootState

    const wallets = {
      anchor: new AnchoWallet(network, this.$rpc),
      scatter: new ScatterWallet(network, this.$rpc),
    }

    if (network.name == 'wax') wallets.wcw = new WCW(network, this.$rpc)
    if (network.name == 'proton')
      wallets.proton = new ProtonWallet(network, this.$rpc)

    commit('setWallets', wallets)

    if (state.lastWallet) {
      commit('setCurrentWallet', state.lastWallet)
      dispatch('autoLogin')
    }
  },

  async autoLogin({ state, dispatch, commit, getters }) {
    const loginned = await getters.wallet.checkLogin()
    if (loginned) {
      const { name, authorization } = loginned
      commit('setUser', { name, authorization }, { root: true })
      dispatch('afterLoginHook')

      return true
    }
    return false
  },

  afterLoginHook({ dispatch, rootState }) {
    dispatch('loadAccountData', {}, { root: true })

    dispatch('loadUserBalances', {}, { root: true }).then(() =>
      dispatch('market/updatePairBalances', {}, { root: true })
    )
    dispatch('loadAccountLimits', {}, { root: true }).then(() =>
      dispatch('loadUserOrders', {}, { root: true })
    )

    dispatch('loadOrders', rootState.market.id, { root: true })

    this.$socket.emit('subscribe', {
      room: 'account',
      params: {
        chain: rootState.network.name,
        name: rootState.user.name,
      },
    })
  },

  logout({ state, dispatch, commit, getters, rootState }) {
    console.log('logout..')
    getters.wallet.logout()
    commit('setLastWallet', null)
    this.$socket.emit('unsubscribe', {
      room: 'account',
      params: {
        chain: rootState.network.name,
        name: rootState.user.name,
      },
    })

    commit('setUser', null, { root: true })
    commit('setUserOrders', [], { root: true })
  },

  async login({ state, commit, dispatch, getters, rootState }, wallet_name) {
    console.log('login..')
    commit('setCurrentWallet', wallet_name)
    const wasAutoLoginned = await dispatch('autoLogin')
    if (wasAutoLoginned) return commit('setLastWallet', wallet_name)

    const { name, authorization } = await getters.wallet.login()
    commit('setUser', { name, authorization }, { root: true })
    dispatch('afterLoginHook')

    commit('setLastWallet', wallet_name)

    //if (state.loginPromise) state.loginPromise.resolve(true)
    //if (state.loginPromise) state.loginPromise.resolve(false)
  },

  transfer({ dispatch, rootState }, { contract, actor, quantity, memo, to }) {
    return dispatch('sendTransaction', [
      {
        account: contract,
        name: 'transfer',
        authorization: [rootState.user.authorization],
        data: {
          from: actor,
          to: to || rootState.network.contract,
          quantity,
          memo,
        },
      },
    ])
  },

  async cancelorder(
    { dispatch, rootState },
    { contract, account, market_id, type, order_id }
  ) {
    const r = await dispatch('sendTransaction', [
      {
        account: contract || rootState.network.contract,
        name: `cancel${type}`,
        authorization: [rootState.user.authorization],
        data: { executor: account, market_id, order_id },
      },
    ])

    setTimeout(() => dispatch('loadOrders', market_id, { root: true }), 1000)
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

  async sendTransaction(
    { state, rootState, dispatch, getters, commit },
    actions
  ) {
    if (actions && actions[0].name != 'delegatebw') {
      await dispatch('resources/showIfNeeded', undefined, { root: true })
    }
    commit(
      'loading/OPEN',
      { title: 'Connecting Wallet', text: 'Waiting transaction approval..' },
      { root: true }
    )
    try {
      if (rootState.network.name == 'wax') {
        // Verify cosinging endpoint is online
        const original_actions = actions
        let response = {}
        try {
          response = await fetch(rootState.network.LIMITLESS_WAX_ENDPOINT, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          })
        } catch (e) {
          console.error(e)
          console.log(JSON.stringify(e))
          response.status = 400
        }

        let enough_cpu = false
        try {
          const account_info = await fetch(
            rootState.network.hyperion +
              '/v2/state/get_account?limit=1&skip=0&account=limitlesswax',
            {
              method: 'GET',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
            }
          )
          const account_info_json = await account_info.json()
          if (parseInt(account_info_json.account.cpu_limit.available) > 5000) {
            console.log('Enough cpu left')
            enough_cpu = true
          } else {
            console.log('Not enough cpu')
            enough_cpu = false
          }
        } catch (e) {
          console.error(e)
          console.log(JSON.stringify(e))
          enough_cpu = false
        }

        let cosignpayer = ''
        let index = 0
        let enough_bank_wax = false
        let ms = 1
        if (actions[0].data.to == 'alcorammswap') {
          cosignpayer = 'alcorammswap'
          index = 1
        }
        if (actions[0].data.to == 'alcordexmain') {
          cosignpayer = 'alcordexmain'
          index = 0
          ms = 2
        }
        try {
          const bank_wax = await rpcWAX.get_table_rows({
            json: true, // Get the response as json
            code: 'limitlessbnk', // Contract that we target
            scope: 'limitlessbnk', // Account that owns the data
            table: 'waxdeposits', // Table name
            limit: 100, // Maximum number of rows that we want to get
            reverse: false, // Optional: Get reversed data
            show_payer: false, // Optional: Show ram payer
          })
          for (let i = 0; i < bank_wax.rows.length; i++) {
            if (bank_wax.rows[i].index == index) {
              if (parseFloat(bank_wax.rows[i].deposit) > 0.1) {
                enough_bank_wax = true
              }
            }
          }
          if (!enough_bank_wax) console.log('Not enough wax in bank')
        } catch (e) {
          console.log('Not enough wax in bank')
          console.log(JSON.stringify(e))
        }
        // Cannot cosign for user
        if (
          response.status != 200 ||
          enough_cpu == false ||
          enough_bank_wax == false
        ) {
          return await getters.wallet.transact({
            max_cpu_usage_ms: 10,
            max_net_usage_words: 10000,
            actions,
          })
        } else {
          // Can cosign for user
          let cpu_cost = 0.02
          try {
            const table = await rpcWAX.get_table_rows({
              json: true, // Get the response as json
              code: 'limitlessbnk', // Contract that we target
              scope: 'limitlessbnk', // Account that owns the data
              table: 'config', // Table name
              limit: 1, // Maximum number of rows that we want to get
              reverse: false, // Optional: Get reversed data
              show_payer: false, // Optional: Show ram payer
            })
            cpu_cost = parseFloat(table.rows[0].cost)
          } catch (e) {
            console.log(JSON.stringify(e))
            console.log('Cant determine cost')
          }
          const cosign = {
            account: 'limitlesswax',
            name: 'paycpu',
            data: {
              user: rootState.user.name,
              info: ms + ' ms max, alcor',
            },
            authorization: [
              {
                actor: 'limitlesswax',
                permission: 'cosign',
              },
            ],
          }
          const cosignpay = {
            account: 'limitlessbnk',
            name: 'sendwax',
            data: {
              table_index: index,
              owner: 'alcordexfund',
              ms,
              maincontract: cosignpayer,
              amount: (cpu_cost * ms).toFixed(8) + ' WAX',
            },
            authorization: [
              {
                actor: 'limitlesswax',
                permission: 'cosign',
              },
            ],
          }
          actions = [cosign, cosignpay, ...actions]
          if (state.currentWallet == 'anchor') {
            const transaction = await apiWAX.transact(
              {
                max_cpu_usage_ms: ms,
                max_net_usage_words: 1000 * ms,
                actions,
              },
              {
                broadcast: false,
                sign: false,
                blocksBehind: 5,
                expireSeconds: 1200,
              }
            )
            const deserializedTransaction = await apiWAX.deserializeTransaction(
              transaction.serializedTransaction
            )
            const abis = await apiWAX.getTransactionAbis(
              deserializedTransaction
            )
            const serializedContextFreeData =
              await apiWAX.serializeContextFreeData(
                deserializedTransaction.context_free_data
              )

            const chainId = rootState.network.chainId
            const requiredKeys =
              await getters.wallet.sessionProvider.getAvailableKeys()
            const serializedTransaction = transaction.serializedTransaction
            const signedTransaction = await getters.wallet.sign(
              deserializedTransaction
            )

            const request = {
              transaction: Array.from(serializedTransaction),
            }

            const response = await fetch(
              rootState.network.LIMITLESS_WAX_ENDPOINT + 'cpu-rent',
              {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
              }
            )

            if (!response.ok) {
              const body = await response.json()
              throw new Error(body.reason || 'Failed to connect to endpoint')
            }

            const json = await response.json()

            if (!json.isOk) {
              throw new Error(json.reason)
            }

            const sigs = []
            if (json.signature) {
              sigs.push(json.signature[0])
              sigs.push(signedTransaction.signatures[0])
            }

            const full_transaction = {
              signatures: sigs,
              compression: false,
              serializedContextFreeData,
              serializedTransaction,
            }

            try {
              const completed_transaction = await apiWAX.rpc.send_transaction(
                full_transaction
              )
              return completed_transaction
            } catch (e) {
              console.log(e)
              throw new Error(e)
            }
          }
          if (state.currentWallet == 'wcw') {
            return await getters.wallet.transact({
              max_cpu_usage_ms: ms,
              max_net_usage_words: 1000 * ms,
              actions,
            })
          }
          // not logged in with anchor or wcw
          return await getters.wallet.transact(original_actions)
        }
      }

      return await getters.wallet.transact(actions)
    } catch (e) {
      throw e
    } finally {
      dispatch('update', {}, { root: true })
      commit('loading/CLOSE', {}, { root: true })
    }
  },
}

export const getters = {
  chainName(state, getters, rootState) {
    return rootState.network.name
  },

  wallet: (state, getters) => state.wallets[state.currentWallet],
}
