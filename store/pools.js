import { asset, number_to_asset } from 'eos-common'

export const state = () => ({
  pools: [],

  current_sym: ''
})

export const mutations = {
  setPools: (state, pools) => state.pools = pools,
  setCurrentSym: (state, sym) => state.current_sym = sym
}

export const actions = {
  async fetchPools({ commit, rootGetters, rootState }) {
    const { rows } = await rootGetters['api/rpc'].get_table_by_scope({
      code: rootState.network.pools.contract,
      table: 'stat',
      limit: 1000
    })

    const pools = []
    rows.reverse().map(r => {
      rootGetters['api/rpc'].get_table_rows({
        code: rootState.network.pools.contract,
        scope: r.scope,
        table: 'stat',
        limit: 1
      }).then(data => {
        const [pool] = data.rows

        pool.pool1.quantity = asset(pool.pool1.quantity)
        pool.pool2.quantity = asset(pool.pool2.quantity)
        pool.supply = asset(pool.supply)

        pools.push(pool)
      })
    })

    commit('setPools', pools)
    console.log('fetch, new pools: ', pools)
  }
}

export const getters = {
  current: (state) => state.pools.filter(p => p.supply.symbol.code().to_string() == state.current_sym)[0],
}
