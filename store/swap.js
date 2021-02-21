import { asset, extended_asset } from 'eos-common'
import { preparePool } from '~/utils/pools'

export const state = () => ({
  pairs: [],

  input: null,
  output: null
})

export const mutations = {
  setPairs: (state, pairs) => state.pairs = pairs,
  setInput: (state, token) => state.input = token,
  setOutput: (state, token) => state.output = token
}

export const actions = {
  init({ state, commit, dispatch, rootState }) {
    if (['eos', 'local'].includes(rootState.network.name)) dispatch('getPairs')
    commit('setInput', rootState.network.baseToken)
  },

  async getPairs({ commit, rootState, rootGetters }) {
    const { rows } = await rootGetters['api/rpc'].get_table_rows({
      code: rootState.network.pools.contract,
      scope: rootState.network.pools.contract,
      table: 'pairs',
      limit: 1000
    })

    rows.map(r => {
      r.pool1.quantity = asset(r.pool1.quantity)
      r.pool2.quantity = asset(r.pool2.quantity)
      r.supply = asset(r.supply)
    })

    commit('setPairs', rows)
  },

  async updatePool({ state, getters, commit, rootGetters, rootState }) {
    //const sym = JSON.parse(JSON.stringify(state.current_sym))

    //if (!this._vm.$nuxt.$route.name.includes('pools')) return

    //const { rows: [pool] } = await rootGetters['api/rpc'].get_table_rows({
    //  code: rootState.network.pools.contract,
    //  scope: sym,
    //  table: 'stat',
    //  limit: 1
    //})

    //const pools = getters.pools.map(p => {
    //  if (p.supply.symbol.code().to_string() == sym) {
    //    return preparePool(pool)
    //  }

    //  return p
    //})

    //commit('setPools', pools)
  },
}

export const getters = {
  tokens0(state, getters, rootState) {
    const tokens = [rootState.network.baseToken] // Base token as default

    state.pairs.map(p => {
      let token = {
        symbol: p.pool1.quantity.symbol.code().to_string(),
        precision: p.pool1.quantity.symbol.precision(),
        contract: p.pool1.contract
      }

      if (tokens.filter(t => t.contract == token.contract && t.symbol == token.symbol).length == 0) tokens.push(token)

      token = {
        symbol: p.pool2.quantity.symbol.code().to_string(),
        precision: p.pool2.quantity.symbol.precision(),
        contract: p.pool2.contract
      }

      if (tokens.filter(t => t.contract == token.contract && t.symbol == token.symbol).length == 0) tokens.push(token)
    })

    return tokens
  },

  tokens1(state, getters, rootState) {
    const tokens = [rootState.network.baseToken]

    for (const p of state.pairs) {
      const symbol_t0 = p.pool1.quantity.symbol.code().to_string()
      const symbol_t1 = p.pool2.quantity.symbol.code().to_string()

      if (p.pool1.contract == state.input.contract && symbol_t0 == state.input.symbol) {
        const token = {
          symbol: p.pool2.quantity.symbol.code().to_string(),
          precision: p.pool2.quantity.symbol.precision(),
          contract: p.pool2.contract
        }

        if (tokens.filter(t => t.contract == token.contract && t.symbol == token.symbol).length == 0) tokens.push(token)
      }

      if (p.pool2.contract == state.input.contract && symbol_t1 == state.input.symbol) {
        const token = {
          symbol: p.pool1.quantity.symbol.code().to_string(),
          precision: p.pool1.quantity.symbol.precision(),
          contract: p.pool1.contract
        }

        if (tokens.filter(t => t.contract == token.contract && t.symbol == token.symbol).length == 0) tokens.push(token)
      }
    }

    return tokens
  },

  current(state) {
    const pair = state.pairs.filter(p => {
      if (!state.input || !state.output) return null

      return (
        p.pool1.contract == state.input.contract &&
        p.pool1.quantity.symbol.code().to_string() == state.input.symbol &&
        p.pool2.contract == state.output.contract &&
        p.pool2.quantity.symbol.code().to_string() == state.output.symbol
      ) || (
        p.pool2.contract == state.input.contract &&
        p.pool2.quantity.symbol.code().to_string() == state.input.symbol &&
        p.pool1.contract == state.output.contract &&
        p.pool1.quantity.symbol.code().to_string() == state.output.symbol
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
      if (state.input) {
        return '0.0000 ' + state.input.symbol
      } else {
        return '0.0000'
      }
    }

    const balance = rootState.user.balances.filter(b => {
      return b.currency === state.input.symbol && b.contract == state.input.contract
    })[0]

    if (!balance) return '0.0000 ' + state.input.symbol

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
