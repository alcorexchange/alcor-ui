import { JsonRpc } from 'eosjs'

import fetch from 'node-fetch'
import axios from 'axios'
import axiosRetry from 'axios-retry'

import { parseAsset } from '~/utils'

axiosRetry(axios, { retries: 3 })

export const state = () => ({
  //rpc: null,
  //network: null
})

export const mutations = {
}

export const actions = {
  async getOrders({ rootState, getters }, { market_id, side, kwargs }) {
    kwargs = { limit: 1000, ...kwargs }

    const { rows } = await getters.rpc.get_table_rows({
      code: rootState.network.contract,
      scope: market_id,
      table: `${side}order`,
      limit: 1000,
      ...kwargs
    })

    return rows.map((b) => {
      b.ask = parseAsset(b.ask)
      b.bid = parseAsset(b.bid)
      return b
    })
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
      timeout: 10000
    })
  },

  backEnd(state, getters, rootState) {
    return axios.create({
      baseURL: rootState.baseUrl,
      timeout: 10000
    })
  }
}
