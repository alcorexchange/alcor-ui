import { asset } from 'eos-common'
import axios from 'axios'

import { parseAsset, littleEndianToDesimal } from '~/utils'

export const state = () => ({})

export const actions = {
  async getOrders({ rootState, getters }, { market_id, side, kwargs }) {
    kwargs = { limit: 1000, ...kwargs }

    const { rows } = await this.$rpc.get_table_rows({
      code: rootState.network.contract,
      scope: market_id,
      table: `${side}order`,
      limit: 1000,
      ...kwargs
    })

    return rows.map((b) => {
      b.ask = parseAsset(b.ask)
      b.bid = parseAsset(b.bid)
      b.unit_price = littleEndianToDesimal(b.unit_price)

      return b
    })
  },

  async getSellOrders({ dispatch }, { market_id, ...kwargs }) {
    return await dispatch('getOrders', { market_id, side: 'sell', kwargs })
  },

  async getBuyOrders({ dispatch }, { market_id, ...kwargs }) {
    return await dispatch('getOrders', { market_id, side: 'buy', kwargs })
  },

  async getToken({ getters, rootState }, { code, symbol }) {
    const {
      rows: [stat]
    } = await this.$rpc.get_table_rows({
      code,
      scope: symbol,
      table: 'stat'
    })

    stat.supply = asset(stat.supply)
    //stat.max_supply = asset(stat.max_supply)

    return stat
  },

  async getSymbolInfo() {
    try {
      const { data } = await axios.get(
        'https://wax-mainnet-ah.api.atomichub.io/v1/stats/info?symbol=WAX'
      )
      return data.data
    } catch (e) {
      console.error('Get symbol info error', e)
    }
  },

  async getCollectionData() {
    try {
      const { data } = await axios.get(
        'https://wax.api.atomicassets.io/atomicassets/v1/collections?order=desc&sort=created'
      )
      return data.data
    } catch (e) {
      console.error('Get assets error', e)
    }
  },

  async getAuctionData(
    { getters, rootState },
    { limit, search, collectionName }
  ) {
    try {
      const { data } = await axios.get(
        'https://wax.api.atomicassets.io/atomicmarket/v1/auctions?order=desc&sort=created&limit=' +
          limit +
          (search ? '&search=' + search : '') +
          (collectionName ? '&collection_name=' + collectionName : '')
      )
      return data.data
    } catch (e) {
      console.error('Get symbol info error', e)
    }
  },

  async getSaleData({ getters, rootState }, { limit, search, collectionName }) {
    try {
      const { data } = await axios.get(
        'https://wax.api.atomicassets.io/atomicmarket/v2/sales?order=desc&sort=created&limit=' +
          limit +
          (search ? '&search=' + search : '') +
          (collectionName ? '&collection_name=' + collectionName : '')
      )
      return data.data
    } catch (e) {
      console.error('Get symbol info error', e)
    }
  },

  async getAssetsData(
    { getters, rootState },
    { limit, search, collectionName }
  ) {
    try {
      const { data } = await axios.get(
        'https://wax.api.atomicassets.io/atomicassets/v1/assets?order=desc&sort=created&limit=' +
          limit +
          (search ? '&search=' + search : '') +
          (collectionName ? '&collection_name=' + collectionName : '')
      )
      return data.data
    } catch (e) {
      console.error('Get assets error', e)
    }
  },

  async getTemplatesData(
    { getters, rootState },
    { limit, search, collectionName }
  ) {
    try {
      const { data } = await axios.get(
        'https://wax.api.atomicassets.io/atomicassets/v1/templates?order=desc&sort=created&limit=' +
          limit +
          (search ? '&search=' + search : '') +
          (collectionName ? '&collection_name=' + collectionName : '')
      )
      return data.data
    } catch (e) {
      console.error('Get template error', e)
    }
  },

  async getSchemasData(
    { getters, rootState },
    { limit, search, collectionName }
  ) {
    try {
      const { data } = await axios.get(
        'https://wax.api.atomicassets.io/atomicassets/v1/schemas?order=desc&sort=created&limit=' +
          limit +
          (search ? '&search=' + search : '') +
          (collectionName ? '&collection_name=' + collectionName : '')
      )
      return data.data
    } catch (e) {
      console.error('Get schemas error', e)
    }
  },

  async getAccountsData(
    { getters, rootState },
    { limit, search, collectionName }
  ) {
    try {
      const { data } = await axios.get(
        'https://wax.api.atomicassets.io/atomicassets/v1/accounts?order=desc&sort=created&limit=' +
          limit +
          (search ? '&search=' + search : '') +
          (collectionName ? '&collection_name=' + collectionName : '')
      )
      return data.data
    } catch (e) {
      console.error('Get accounts error', e)
    }
  }
}
