import { JsonRpc } from 'eosjs'

import fetch from 'node-fetch'
import axios from 'axios'
import axiosRetry from 'axios-retry'

import { parseOtcAsset, calculatePrice } from '~/utils'

axiosRetry(axios, { retries: 3 })

export const state = () => ({
  orders: []
})

export const mutations = {
  setOrders: (state, orders) => state.orders = orders
}

export const actions = {
  async fetchOrders({ rootState, commit, getters }) {
    const contract = rootState.network.otc.contract

    const { rows } = await getters.rpc.get_table_rows({
      code: contract,
      scope: contract,
      table: 'orders',
      reverse: true,
      limit: 1000
    })

    rows.map(r => {
      r.price = calculatePrice(r.sell, r.buy)
      r.buy = parseOtcAsset(r.buy)
      r.sell = parseOtcAsset(r.sell)
    })

    commit('setOrders', rows)
  },

  async getSellOrders({ dispatch }, { market_id, ...kwargs }) {
    return await dispatch('getOrders', { market_id, side: 'sell', kwargs })
  },

  async getBuyOrders({ dispatch }, { market_id, ...kwargs }) {
    return await dispatch('getOrders', { market_id, side: 'buy', kwargs })
  }
}

export const getters = {
  rpc(state, getters, rootState) {
    return new JsonRpc(rootState.network.protocol + '://' + rootState.network.host + ':' + rootState.network.port, { fetch })
  },

  hyperion(state, getters, rootState) {
    // FIXME If delete state from here, then rootState.network is undefined
    return axios.create({
      baseURL: rootState.network.hyperion,
      timeout: 30000
    })
  },

  backEnd(state, getters, rootState) {
    return axios.create({
      baseURL: rootState.baseUrl,
      timeout: 30000
    })
  }
}
