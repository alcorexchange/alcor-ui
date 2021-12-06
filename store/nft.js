import { prepareNFT } from '~/utils'

export const state = () => ({
  orders: [],

  authorFilter: [],
  catFilter: []
})

export const mutations = {
  setOrders: (state, orders) => state.orders = orders,
  setAuthorFilter: (state, filter) => state.authorFilter = filter,
  setCatFilter: (state, filter) => state.catFilter = filter
}

export const actions = {
  async fetch({ commit, rootGetters, rootState }) {
    console.log('Fetch nfts...')
    const { rows: orders } = await this.$rpc.get_table_rows({
      code: rootState.network.nftMarket.contract,
      scope: rootState.network.nftMarket.contract,
      table: 'sellorders',
      limit: 1000
    })

    const { rows: nfts } = await this.$rpc.get_table_rows({
      code: 'simpleassets',
      scope: rootState.network.nftMarket.contract,
      table: 'sassets',
      limit: 1000
    })

    orders.map(o => {
      o.sell = o.sell.map(s => {
        const token = nfts.filter(n => n.id == s)[0]
        if (token) {
          prepareNFT(token)
          s = token
        } else s = { id: s }

        return s
      })
    })

    commit('setOrders', orders)
  }
}

export const getters = {
  //current: (state) => state.pools.filter(p => p.supply.symbol.code().to_string() == state.current_sym)[0],
}
