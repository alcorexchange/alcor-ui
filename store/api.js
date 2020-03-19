//import ScatterJS from '@scatterjs/core'
//import ScatterEOS from '@scatterjs/eosjs2'
import ScatterJS from 'scatterjs-core'
import ScatterEOS from 'scatterjs-plugin-eosjs'
import * as Eos_legacy from 'eosjs_legacy'

import { JsonRpc } from 'eosjs'

import fetch from 'node-fetch'
import axios from 'axios'
import axiosRetry from 'axios-retry'

import { parseAsset } from '~/utils'

axiosRetry(axios, { retries: 10 })
ScatterJS.plugins(new ScatterEOS())


export const state = () => ({
  //rpc: null,
  //network: null
})

export const mutations = {
}

export const actions = {
  async getOrders({ getters }, { market_id, side, kwargs }) {
    kwargs = { limit: 1000, ...kwargs }

    const { rows } = await getters.rpc.get_table_rows({
      code: getters.network.contract,
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

  eos(state, getters, rootState) {
    return ScatterJS.eos(rootState.network, Eos_legacy)
  },

  hyperion(state, getters, rootState) {
    return axios.create({
      baseURL: rootState.network.hyperion,
      timeout: 10000
    })
  },

  backEnd(state, getters, rootState) {
    return axios.create({
      baseURL: rootState.network.backEnd,
      timeout: 10000
    })
  },

  network(state, getters, rootState) {
    return ScatterJS.Network.fromJson({
      blockchain: 'eos',
      ...rootState.network
    })
  }
}
