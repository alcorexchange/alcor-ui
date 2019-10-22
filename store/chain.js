import config from '~/config'

import fetch from 'node-fetch'
import { configureScope } from '@sentry/browser'
import ScatterJS from '@scatterjs/core'
import ScatterEOS from '@scatterjs/eosjs2'
import { Api, JsonRpc } from 'eosjs'

ScatterJS.plugins(new ScatterEOS())

export const network = ScatterJS.Network.fromJson({
      blockchain: 'eos',
      ...config
});

const rpc = new JsonRpc(config.host, { fetch });
const eos = ScatterJS.eos(network, Api, {rpc, beta3:true})


export const state = () => ({
  scatterConnected: true,
  oldScatter: false
})

export const actions = {
  async init({ state, commit, dispatch }) {
    console.log('Connect scatter..')
    await ScatterJS.connect('EOSLESS', { network }).then(v => commit('setScatterConnected', v))

    if (state.scatterConnected) {
      window.scatterConnected = true
      let scatter_version
      await dispatch('login')

      try {
       scatter_version = await ScatterJS.scatter.getVersion()

      } catch(e) {
        commit('setOldScatter', true)
        scatter_version = 'Scatter as browser extention (Unmainteined)'
      } finally {
        configureScope((scope) => scope.setTag("scatter.version", scatter_version))
      }
    } else {
      await dispatch('init')
    }

    console.log('App starting..')
  },

  async logout({ commit }) {
    await ScatterJS.logout()
    commit('setUser', null, { root: true })
  },

  async login({ state, commit, dispatch }) {
    if (!state.scatterConnected)
      return this._vm.$notify({ title: 'Login', message: 'Scatter is not connected', type: 'error' })

    try {
      let r = await ScatterJS.login()

      configureScope((scope) => scope.setUser({"username": r.accounts[0].name}))
      commit('setUser', r.accounts[0], { root: true })
      dispatch('loadUserBalances', {}, { root: true })
    } catch(e) {
      this._vm.$notify({ title: 'Login', message: e.message, type: 'error' })
    }
  },

  async scatterConnect({ commit }) {
    commit('setScatterConnected', await ScatterJS.connect('Ordersbook', { network }))
  },

  getOrders() {
    return rpc.get_table_rows({code: config.contract, scope: config.contract, table: 'orders'})
  }
}

export const mutations = {
  setUser: (state, user) => state.user = user,
  setScatterConnected: (state, value) => state.scatterConnected = value,
  setOldScatter: (state, value) => state.oldScatter = value,
}

export const getters = {
  rpc: state => rpc,
  eos: state => eos,
  scatter: state => ScatterJS.scatter
}

export function transfer(contract, actor, quantity, memo) {
  return eos.transact({
     actions: [{
         account: contract,
         name: 'transfer',
         authorization: [{
             actor: actor,
             permission: 'active',
         }],
         data: {
             from: actor,
             to: config.contract,
             quantity,
             memo,
         },
     }]
   }, { blocksBehind: 3, expireSeconds: 3 * 60 }
  )
}

export function cancelorder(account, market_id, type, order_id) {
  return eos.transact({
     actions: [{
         account: config.contract,
         name: type == 'bid' ? 'cancelbuy': 'cancelsell',
         authorization: [{
             actor: account,
             permission: 'active',
         }],
       data: { executor: account, market_id, order_id }, }]
   }, { blocksBehind: 3, expireSeconds: 3 * 60 }
  )
}


// FIXME Patch JsonRpc https://github.com/EOSIO/eosjs/issues/324 not redy for production
rpc.get_table_rows = async function({
        json = true,
        code,
        scope,
        table,
        table_key = "",
        lower_bound = "",
        upper_bound = "",
        index_position = 1,
        key_type = "",
        limit = 10,
        reverse = false,
        show_payer = false,
     }) {
        return await this.fetch(
            "/v1/chain/get_table_rows", {
                json,
                code,
                scope,
                table,
                table_key,
                lower_bound,
                upper_bound,
                index_position,
                key_type,
                limit,
                reverse,
                show_payer,
            });
    }
