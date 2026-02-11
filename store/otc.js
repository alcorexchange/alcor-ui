import { parseOtcAsset, calculatePrice } from '~/utils'

export const state = () => ({
  orders: []
})

export const mutations = {
  setOrders: (state, orders) => state.orders = orders
}

export const actions = {
  async fetchOrders({ rootState, commit }) {
    try {
      const { data } = await this.$axios.get('/v2/otc/orders', {
        params: {
          limit: 1000,
          offset: 0,
          sort: 'id',
          order: 'desc',
          hide_scam: false
        }
      })

      const rows = data?.items || []
      commit('setOrders', rows)
    } catch (apiError) {
      const contract = rootState.network.otc.contract

      const { rows } = await this.$rpc.get_table_rows({
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
    }
  },

  async getSellOrders({ dispatch }, { market_id, ...kwargs }) {
    return await dispatch('getOrders', { market_id, side: 'sell', kwargs })
  },

  async getBuyOrders({ dispatch }, { market_id, ...kwargs }) {
    return await dispatch('getOrders', { market_id, side: 'buy', kwargs })
  }
}
