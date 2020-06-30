import { asset, number_to_asset } from 'eos-common'
import { preparePool } from '~/utils/pools'

export const state = () => ({
  pools: [],

  current_sym: ''
})

export const mutations = {
  setPools: (state, pools) => state.pools = pools,
  setCurrentSym: (state, sym) => state.current_sym = sym
}

export const actions = {
  async updatePool({ state, commit, rootGetters, rootState }) {
    const sym = Object.assign('', state.current_sym)

    if (sym == '') return // TODO Add if current page is pools and also for markets

    const { rows: [pool] } = await rootGetters['api/rpc'].get_table_rows({
      code: rootState.network.pools.contract,
      scope: sym,
      table: 'stat',
      limit: 1
    })

    const pools = state.pools.map(p => {
      if (p.supply.symbol.code().to_string() == sym) {
        return preparePool(pool)
      }

      return p
    })

    commit('setPools', pools)
  },

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
    }).filter(p => p.pool1.contract != 'yuhjtmanserg')

    if (state.pools.length == 0 && pools.length > 0) {
      commit('setCurrentSym', pools[0].supply.symbol.code().to_string())
    }

    commit('setPools', pools)
  }
}

export const getters = {
  current: (state) => state.pools.filter(p => p.supply.symbol.code().to_string() == state.current_sym)[0],

  baseBalance(state, getters, rootState) {
    if (!rootState.user || !rootState.user.balances) {
      if (getters.current) {
        return asset(0, getters.current.pool1.quantity.symbol).to_string()
      }

      return '0.0000 '
    }

    const balance = rootState.user.balances.filter(b => {
      return b.currency === getters.current.pool1.quantity.symbol.code().to_string() && b.contract == getters.current.pool1.contract
    })[0]
    if (!balance) return asset(0, getters.current.pool1.quantity.symbol).to_string()

    return `${balance.amount} ${balance.currency}`
  },

  quoteBalance(state, getters, rootState) {
    if (!rootState.user || !rootState.user.balances) {
      if (getters.current) {
        return asset(0, getters.current.pool2.quantity.symbol).to_string()
      }

      return '0.0000 '
    }

    const balance = rootState.user.balances.filter(b => {
      return b.currency === getters.current.pool2.quantity.symbol.code().to_string() && b.contract == getters.current.pool2.contract
    })[0]
    if (!balance) return asset(0, getters.current.pool2.quantity.symbol).to_string()

    return `${balance.amount} ${balance.currency}`
  }
}
