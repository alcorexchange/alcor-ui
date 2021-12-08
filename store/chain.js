import WCW from '~/plugins/wallets/WCW'
import AnchoWallet from '~/plugins/wallets/Anchor'
import ProtonWallet from '~/plugins/wallets/Proton'
import ScatterWallet from '~/plugins/wallets/Scatter'

export const state = () => ({
  loginPromise: null,
  wallets: {},

  payForUser: false,
  currentWallet: 'anchor',
  lastWallet: null
})

export const mutations = {
  setWallets: (state, value) => state.wallets = value,
  setLoginPromise: (state, value) => state.loginPromise = value,
  setPayForUser: (state, value) => state.payForUser = value,
  setCurrentWallet: (state, value) => state.currentWallet = value,
  setLastWallet: (state, value) => state.lastWallet = value
}

export const actions = {
  init({ state, commit, dispatch, rootState, rootGetters, getters }) {
    const { network } = rootState

    const wallets = {
      anchor: new AnchoWallet(network, this.$rpc),
      scatter: new ScatterWallet(network, this.$rpc)
    }

    if (network.name == 'wax') wallets.wcw = new WCW(network, this.$rpc)
    if (network.name == 'proton') wallets.proton = new ProtonWallet(network, this.$rpc)

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

    dispatch('loadUserBalances', {}, { root: true }).then(() => dispatch('market/updatePairBalances', {}, { root: true }))
    dispatch('loadAccountLimits', {}, { root: true }).then(() => dispatch('loadUserOrders', {}, { root: true }))

    dispatch('loadOrders', rootState.market.id, { root: true })

    this.$socket.emit('subscribe', {
      room: 'account',
      params: {
        chain: rootState.network.name,
        name: rootState.user.name
      }
    })
  },

  logout({ state, dispatch, commit, getters, rootState }) {
    getters.wallet.logout()
    commit('setLastWallet', null)
    this.$socket.emit('unsubscribe', {
      room: 'account',
      params: {
        chain: rootState.network.name,
        name: rootState.user.name
      }
    })

    commit('setUser', null, { root: true })
    commit('setUserOrders', [], { root: true })
  },

  async login({ state, commit, dispatch, getters, rootState }, wallet_name) {
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
          name: `cancel${type}`,
          authorization: [rootState.user.authorization],
          data: { executor: account, market_id, order_id }
        }
      ]
    )

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

  async sendTransaction({ state, rootState, dispatch, getters, commit }, actions) {
    if (actions && actions[0].name != 'delegatebw') {
      await dispatch('resources/showIfNeeded', undefined, { root: true })
    }

    commit('loading/OPEN', { title: 'Connecting Wallet', text: 'Waiting transaction approval..' }, { root: true })

    try {
      return await getters.wallet.transact(actions)
    } catch (e) {
      throw e
    } finally {
      dispatch('update', {}, { root: true })
      commit('loading/CLOSE', {}, { root: true })
    }
  }
}

export const getters = {
  chainName(state, getters, rootState) {
    return rootState.network.name
  },

  wallet: (state, getters) => state.wallets[state.currentWallet]
}
