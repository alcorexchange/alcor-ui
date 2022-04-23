import { asset } from 'eos-common'

import { parseAsset, littleEndianToDesimal } from '~/utils'

export const state = () => ({
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
    const { rows: [stat] } = await this.$rpc.get_table_rows({
      code,
      scope: symbol,
      table: 'stat'
    })

    stat.supply = asset(stat.supply)
    //stat.max_supply = asset(stat.max_supply)

    return stat
  }
}
