import { asset } from 'eos-common'
import axios from 'axios'

import {
  parseAsset,
  littleEndianToDesimal
} from '~/utils'

export const state = () => ({
})

const API_URL = 'http://wax.blokcrafters.io'

export const actions = {
  async getOrders({
    rootState,
    getters
  }, {
    market_id,
    side,
    kwargs
  }) {
    kwargs = {
      limit: 1000,
      ...kwargs
    }

    const {
      rows
    } = await this.$rpc.get_table_rows({
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

  async getSellOrders({
    dispatch
  }, {
    market_id,
    ...kwargs
  }) {
    return await dispatch('getOrders', {
      market_id,
      side: 'sell',
      kwargs
    })
  },

  async getBuyOrders({
    dispatch
  }, {
    market_id,
    ...kwargs
  }) {
    return await dispatch('getOrders', {
      market_id,
      side: 'buy',
      kwargs
    })
  },

  async getToken({ getters, rootState }, { code, symbol }) {
    const { rows: [stat] } = await this.$rpc.get_table_rows({
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
      const {
        data
      } = await axios.get(
        'https://wax-mainnet-ah.api.atomichub.io/v1/stats/info?symbol=WAX'
      )
      return data.data
    } catch (e) {
      console.error('Get symbol info error', e)
    }
  },

  async getCollectionData({
    getters,
    rootState
  }, {
    author
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL}/atomicassets/v1/collections?order=desc&sort=created` + (author ? '&author=' + author : '')
      )
      return data.data
    } catch (e) {
      console.error('Get assets error', e)
    }
  },


  async getCollectionsForSet() {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL}/atomicmarket/v1/stats/collections?symbol=WAX&search=collection_name&page=1&limit=100&order=desc&sort=volume`
      )
      return data.data
    } catch (e) {
      console.error('Get assets error', e)
    }
  },

  async getSpecificCollectionData({
    getters,
    rootState
  }, {
    collectionName
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL}/atomicassets/v1/collections/` +
        collectionName
      )
      return data.data
    } catch (e) {
      console.error('Get assets error', e)
    }
  },

  async getAuctionData({
    getters,
    rootState
  }, {
    limit = 100,
    search,
    collectionName,
    seller,
    participant,
    bidder,
    buyer_blacklist,
    buyer,
    state
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL}/atomicmarket/v1/auctions?order=desc&sort=created&limit=` +
        limit +
        (search ? '&match=' + search : '') +
        (collectionName ? '&collection_name=' + collectionName : '') +
        (seller ? '&seller=' + seller : '') +
        (buyer ? '&buyer=' + buyer : '') +
        (state ? '&state=' + state : '') +
        (participant ? '&participant=' + participant : '') +
        (bidder ? '&bidder=' + bidder : '') +
        (buyer_blacklist ? '&buyer_blacklist=' + buyer_blacklist : '')
      )
      return data.data
    } catch (e) {
      console.error('Get symbol info error', e)
    }
  },

  async getSaleData({
    getters,
    rootState
  }, {
    limit,
    search,
    collectionName
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL}/atomicmarket/v2/sales?order=desc&sort=created&limit=` +
        limit +
        (search ? '&search=' + search : '') +
        (collectionName ? '&collection_name=' + collectionName : '')
      )
      return data.data
    } catch (e) {
      console.error('Get symbol info error', e)
    }
  },

  async getAssetsData({
    getters,
    rootState
  }, {
    limit,
    search,
    collectionName
  }) {
    try {
      const {
        data
      } = await axios.get(`${API_URL}/atomicassets/v1/assets?order=desc&sort=created&limit=` +
        limit +
        (search ? '&search=' + search : '') +
        (collectionName ? '&collection_name=' + collectionName : '')
      )
      return data.data
    } catch (e) {
      console.error('Get assets error', e)
    }
  },

  async getTemplatesData({
    getters,
    rootState
  }, {
    limit,
    search,
    collectionName,
    schemaName
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL}/atomicassets/v1/templates?order=desc&sort=created&limit=` +
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
  async getAccount({
    getters,
    rootState
  }, {
    accountName
  }) {
    try {
      const {
        data
      } = await axios.post(
        'https://wax.pink.gg/v1/chain/get_account', { account_name: accountName }
      )
      return data
    } catch (e) {
      console.error('Get template error', e)
    }
  },

  async getSchemasData({
    getters,
    rootState
  }, {
    limit,
    search,
    collectionName
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL}/atomicassets/v1/schemas?order=desc&sort=created` +
        (limit ? '&limit=' + limit : '') +
        (search ? '&match=' + search : '') +
        (collectionName ? '&collection_name=' + collectionName : '')
      )
      return data.data
    } catch (e) {
      console.error('Get schemas error', e)
    }
  },

  async getSpecificSchemasData({
    getters,
    rootState
  }, {
    schema_name,
    collection_name
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL}/atomicassets/v1/schemas/` +
        collection_name +
        '/' +
        schema_name
      )
      return data.data
    } catch (e) {
      console.error('Get schemas error', e)
    }
  },

  async getAccountsData({
    getters,
    rootState
  }, {
    limit,
    search
  }) {
    try {
      const {
        data
      } = await axios.post('https://wax.pink.gg/v1/chain/get_table_by_scope', {
        code: 'eosio',
        limit: 15,
        lower_bound: search,
        table: 'userres',
      }
      )
      return data.rows
    } catch (e) {
      console.error('Get accounts error', e)
    }
  },

  async getAssets({
    getters,
    rootState
  }, {
    owner
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL} / atomicassets / v1 / assets` +
        '?owner=' +
        owner +
        '&page=1&limit=1000&order=desc&sort=asset_id'
      )

      return data.data
    } catch (e) {
      console.error('Get accounts error', e)
    }
  },

  async getSales({
    getters,
    rootState
  }, {
    seller,
    state,
    participant,
    buyer
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL} / atomicmarket / v2 / sales ? page = 1 & limit=100 & order=desc & sort=created` +
        (seller ? '&seller=' + seller : '') +
        (buyer ? '&buyer=' + buyer : '') +
        (state ? '&state=' + state : '') +
        (participant ? '&participant=' + participant : '')
      )

      return data.data
    } catch (e) {
      console.error('Get accounts error', e)
    }
  },

  async getSpecificAsset({
    getters,
    rootState
  }, {
    asset_id
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL} / atomicmarket / v1 / assets / ` + asset_id
      )
      return data.data
    } catch (e) {
      console.error('Get accounts error', e)
    }
  },

  async getAssetsTransfer({
    getters,
    rootState
  }, {
    asset_id
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL} / atomicmarket / v1 / transfers ? page = 1 & limit=20 & order=desc & sort=created & asset_id=` +
        asset_id
      )
      return data.data
    } catch (e) {
      console.error('Get accounts error', e)
    }
  },

  async getAssetsSales({
    getters,
    rootState
  }, {
    asset_id
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL} / atomicmarket / v1 / assets / ` +
        asset_id +
        '/sales?order=asc'
      )
      return data.data
    } catch (e) {
      console.error('Get accounts error', e)
    }
  },

  async getAssetsLog({
    getters,
    rootState
  }, {
    asset_id
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL} / atomicassets / v1 / assets / ` +
        asset_id +
        '/logs?page=1&limit=20&order=desc'
      )
      return data.data
    } catch (e) {
      console.error('Get accounts error', e)
    }
  },
  // get NFT inventory, auctions, listings, bought, sold counts
  async getInventoryCounts({
    getters,
    rootState
  }, {
    owner
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL} / atomicassets / v1 / assets / _count ? owner = ` +
        owner
      )
      return data.data
    } catch (e) {
      console.error('Get symbol info error', e)
    }
  },
  async getInventorySuggestedmedian({
    getters,
    rootState
  }, {
    owner
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL} / atomicmarket / v1 / prices / assets ? owner = ` +
        owner
      )
      return data.data
    } catch (e) {
      console.error('Get symbol info error', e)
    }
  },
  async getAuctionsCounts({
    getters,
    rootState
  }, {
    owner
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL} / atomicmarket / v1 / auctions / _count ? owner = ` +
        owner
      )
      return data.data
    } catch (e) {
      console.error('Get symbol info error', e)
    }
  },
  async getSalesCounts({
    getters,
    rootState
  }, {
    owner
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL} / atomicmarket / v2 / sales / _count ? owner = ` +
        owner
      )
      return data.data
    } catch (e) {
      console.error('Get symbol info error', e)
    }
  },
  async getBoughtCounts({
    getters,
    rootState
  }, {
    owner
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL} / atomicmarket / v1 / buyoff ers / _count ? owner = ` +
        owner
      )
      return data.data
    } catch (e) {
      console.error('Get symbol info error', e)
    }
  },
  async getAccountValue({
    getters,
    rootState
  }, {
    owner
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL} / atomicmarket / v1 / stats / accounts / ` +
        owner + '?symbol=WAX'
      )
      return data.data
    } catch (e) {
      console.error('Get symbol info error', e)
    }
  },
  // price on tempchart
  async getTemplatePrice({
    getters,
    rootState
  }, {
    templateID
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL} / atomicmarket / v1 / prices / templates ? template_id = ` + templateID + '&page=1&limit=100&order=desc'
      )
      return data.data
    } catch (e) {
      console.error('Get symbol info error', e)
    }
  },
  // get price history for a template for NFT sale chart
  async getChartData({
    getters,
    rootState
  }, {
    schema_name,
    template_id,
    burned
  }) {
    try {
      const {
        data
      } = await axios.get(
        `${API_URL} / atomicmarket / v1 / prices / sales / days ? template_id = ` + template_id +
        '&schema_name=' + schema_name + '&burned' + burned
      )
      return data.data
    } catch (e) {
      console.error('Get symbol info error', e)
    }
  },
  // get collection set
  async getCollectionSets({
    getters,
    rootState
  }, {
    collection_name
  }) {
    try {
      const data = await axios.get(
        `${API_URL} / atomicassets / v1 / templates ? collection_name = ` + collection_name + '&page=1&limit=100&order=desc&sort=created'
      )
      return data.data
    } catch (e) {
      console.error('Get symbol info error', e)
    }
  }
}
