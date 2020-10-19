import { asset } from 'eos-common'
import { preparePool } from '~/utils/pools'

export const state = () => ({
  pairs: [],

  input: null,
  output: null,
})

export const mutations = {
  setPairs: (state, pairs) => state.pairs = pairs,
  setInput: (state, token) => state.input = token,
  setOutput: (state, token) => state.output = token
}

export const actions = {
  init({ state, commit, dispatch, rootState }) {
    if (rootState.network.name == 'eos') dispatch('getPairs')
    commit('setInput', rootState.network.baseToken)
  },

  async getPairs({ commit, rootGetters }) {
    const { rows } = await rootGetters['api/rpc'].get_table_rows({
      code: 'swap.defi',
      scope: 'swap.defi',
      table: 'pairs',
      limit: 1000
    })

    rows.map(r => {
      r.reserve0 = asset(r.reserve0)
      r.reserve1 = asset(r.reserve1)
    })

    commit('setPairs', rows)
  },

  async updatePool({ state, getters, commit, rootGetters, rootState }) {
    const sym = JSON.parse(JSON.stringify(state.current_sym))

    if (!this._vm.$nuxt.$route.name.includes('pools')) return

    const { rows: [pool] } = await rootGetters['api/rpc'].get_table_rows({
      code: rootState.network.pools.contract,
      scope: sym,
      table: 'stat',
      limit: 1
    })

    const pools = getters.pools.map(p => {
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

      return pool
    }).filter(p => p.pool1.contract != 'yuhjtmanserg')

    if (state.pools.length == 0 && pools.length > 0) {
      commit('setCurrentSym', pools[0].supply.split(' ')[1])
    }

    commit('setPools', pools)
  }
}

export const getters = {
  tokens0(state, getters, rootState) {
    const tokens = [rootState.network.baseToken] // Base token as default

    state.pairs.map(p => {
      let token = {
        symbol: p.token0.symbol.split(',')[1],
        precision: parseFloat(p.token0.symbol.split(',')[0]),
        contract: p.token0.contract
      }

      if (tokens.filter(t => t.contract == token.contract && t.symbol == token.symbol).length == 0) tokens.push(token)

      token = {
        symbol: p.token1.symbol.split(',')[1],
        precision: parseFloat(p.token1.symbol.split(',')[0]),
        contract: p.token1.contract
      }

      if (tokens.filter(t => t.contract == token.contract && t.symbol == token.symbol).length == 0) tokens.push(token)
    })

    return tokens
  },

  tokens1(state, getters, rootState) {
    const tokens = [rootState.network.baseToken] // Base token as default

    for (const p of state.pairs) {
      const symbol_t0 = p.token0.symbol.split(',')[1]
      const symbol_t1 = p.token1.symbol.split(',')[1]

      if (p.token0.contract == state.input.contract && symbol_t0 == state.input.symbol) {
        const token = {
          symbol: p.token1.symbol.split(',')[1],
          precision: parseFloat(p.token1.symbol.split(',')[0]),
          contract: p.token1.contract
        }

        if (tokens.filter(t => t.contract == token.contract && t.symbol == token.symbol).length == 0) tokens.push(token)
      }

      if (p.token1.contract == state.input.contract && symbol_t1 == state.input.symbol) {
        const token = {
          symbol: p.token0.symbol.split(',')[1],
          precision: parseFloat(p.token0.symbol.split(',')[0]),
          contract: p.token0.contract
        }

        if (tokens.filter(t => t.contract == token.contract && t.symbol == token.symbol).length == 0) tokens.push(token)
      }
    }

    return tokens
  },

  pair(state) {
    const pair = state.pairs.filter(p => {
      if (!state.input || !state.output) return null

      return (
        p.token0.contract == state.input.contract &&
        p.reserve0.symbol.code().to_string() == state.input.symbol &&
        p.token1.contract == state.output.contract &&
        p.reserve1.symbol.code().to_string() == state.output.symbol
      ) || (
        p.token1.contract == state.input.contract &&
        p.reserve1.symbol.code().to_string() == state.input.symbol &&
        p.token0.contract == state.output.contract &&
        p.reserve0.symbol.code().to_string() == state.output.symbol
      )
    })[0]

    return pair || null
  },

  pools(state) {
    return state.pools.map(pool => {
      const p = JSON.parse(JSON.stringify(pool))

      p.pool1.quantity = asset(pool.pool1.quantity)
      p.pool2.quantity = asset(pool.pool2.quantity)
      p.supply = asset(pool.supply)

      return p
    })
  },

  inputBalance(state, getters, rootState) {
    if (!rootState.user || !rootState.user.balances) {
      if (getters.current) {
        return asset(0, state.input.symbol).to_string()
      }

      return '0.0000 '
    }

    const balance = rootState.user.balances.filter(b => {
      return b.currency === state.input.symbol && b.contract == state.input.contract
    })[0]
    if (!balance) return asset(0, state.input.symbol).to_string()

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
