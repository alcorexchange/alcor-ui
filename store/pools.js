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
  async fetchPools({ state, commit, rootGetters, rootState }) {
    const { rows } = await rootGetters['api/rpc'].get_table_by_scope({
      code: rootState.network.pools.contract,
      table: 'stat',
      limit: 1000
    })

    const requests = rows.map(r => {
      return rootGetters['api/rpc'].get_table_rows({
        code: rootState.network.pools.contract,
        scope: r.scope,
        table: 'stat',
        limit: 1
      })
    })

    const pools = (await Promise.all(requests)).reverse().map(r => {
      const [pool] = r.rows

      pool.pool1.quantity = asset(pool.pool1.quantity)
      pool.pool2.quantity = asset(pool.pool2.quantity)
      pool.supply = asset(pool.supply)

      return pool
    })

    commit('setPools', pools)
  }
}

export const getters = {
  current: (state) => state.pools.filter(p => p.supply.symbol.code().to_string() == state.current_sym)[0],
}
