import { asset } from 'eos-common'
import axios from 'axios'

import { parseAsset, littleEndianToDesimal } from '~/utils'

export const state = () => ({
  account: ''
})

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

  async getSpecificCollectionData({ getters, rootState }, { collectionName }) {
    try {
      const { data } = await axios.get(
        'https://wax.api.atomicassets.io/atomicassets/v1/collections/' +
          collectionName
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
    { limit, search, collectionName, schemaName }
  ) {
    try {
      const { data } = await axios.get(
        'https://wax.api.atomicassets.io/atomicassets/v1/templates?order=desc&sort=created&limit=' +
          limit +
          (search ? '&search=' + search : '') +
          (collectionName ? '&collection_name=' + collectionName : '') +
          (schemaName ? '&schema_name=' + schemaName : '')
      )
      return data.data
    } catch (e) {
      console.error('Get template error', e)
    }
  },
  async getAccount({ getters, rootState }, { accountName }) {
    try {
      const { data } = await axios.post(
        'https://wax.pink.gg/v1/chain/get_account',
        {
          account_name: accountName
        }
      )
      return data
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
        'https://wax.api.atomicassets.io/atomicassets/v1/schemas?order=desc&sort=created' +
          (limit ? '&limit=' + limit : '') +
          (search ? '&search=' + search : '') +
          (collectionName ? '&collection_name=' + collectionName : '')
      )
      return data.data
    } catch (e) {
      console.error('Get schemas error', e)
    }
  },

  async getSpecificSchemasData(
    { getters, rootState },
    { schema_name, collection_name }
  ) {
    try {
      const { data } = await axios.get(
        'https://wax.api.atomicassets.io/atomicassets/v1/schemas/' +
          collection_name +
          '/' +
          schema_name
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
  },

  async getAssets({ getters, rootState }, { owner }) {
    try {
      const { data } = await axios.get(
        'https://wax.api.atomicassets.io/atomicassets/v1/assets?collection_name=stf.capcom' +
          '&owner=' +
          owner +
          '&page=1&limit=1000&order=desc&sort=asset_id'
      )

      return data.data
    } catch (e) {
      console.error('Get accounts error', e)
    }
  },

  async getSpecificAsset({ getters, rootState }, { asset_id }) {
    try {
      const { data } = await axios.get(
        'https://wax.api.atomicassets.io/atomicmarket/v1/assets/' + asset_id
      )
      return data.data
    } catch (e) {
      console.error('Get accounts error', e)
    }
  },

  async getAssetsTransfer({ getters, rootState }, { asset_id }) {
    try {
      const { data } = await axios.get(
        'https://wax.api.atomicassets.io/atomicmarket/v1/transfers?page=1&limit=20&order=desc&sort=created&asset_id=' +
          asset_id
      )
      return data.data
    } catch (e) {
      console.error('Get accounts error', e)
    }
  },

  async getAssetsSales({ getters, rootState }, { asset_id }) {
    try {
      const { data } = await axios.get(
        'https://wax.api.atomicassets.io/atomicmarket/v1/assets/' +
          asset_id +
          '/sales?order=asc'
      )
      return data.data
    } catch (e) {
      console.error('Get accounts error', e)
    }
  },

  async getAssetsLog({ getters, rootState }, { asset_id }) {
    try {
      const { data } = await axios.get(
        'https://wax.api.atomicassets.io/atomicassets/v1/assets/' +
          asset_id +
          '/logs?page=1&limit=20&order=desc'
      )
      return data.data
    } catch (e) {
      console.error('Get accounts error', e)
    }
  }
}
