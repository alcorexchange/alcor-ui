import { asset } from 'eos-common'
import { preparePair } from '~/utils/pools'

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
    dispatch('getPairs')
    commit('setInput', rootState.network.baseToken)
  },

  toggleInputs({ state, commit }) {
    if (!state.output) return

    const i = Object.assign({}, state.input)
    const o = Object.assign({}, state.output)

    commit('setInput', o)
    commit('setOutput', i)
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
      r.name = r.pool1.quantity.symbol.code().to_string() + '/' + r.pool2.quantity.symbol.code().to_string()
    })

    commit('setPairs', rows)
  },

  async updatePair({ state, getters, commit, rootGetters, rootState }, pair_id) {
    console.log('updatePair...')
    if (!this._vm.$nuxt.$route.name.includes('swap')) return

    const { rows: [new_pair] } = await rootGetters['api/rpc'].get_table_rows({
      code: rootState.network.pools.contract,
      scope: rootState.network.pools.contract,
      table: 'pairs',
      limit: 1
    })

    if (!new_pair) {
      return console.log('Not found pair for update: ', pair_id)
    }

    const pairs = state.pairs
    for (let i = 0; i < pairs.length; i++) {
      if (pairs[i].id == pair_id) {
        this._vm.$set(state.pairs, new_pair.id, preparePair(new_pair))
        return
      }
    }

    console.log('not updated pair: ', pair_id)
  }
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

    if (!state.input) return getters.tokens0

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

    return pair
  },

  isReverted(state, { current }) {
    if (!current) return false
    return !(current.pool1.contract == state.input.contract && current.pool1.quantity.symbol.code().to_string() == state.input.symbol)
  },

  poolOne(state, { current }) {
    if (!current) return null

    if (current.pool1.contract == state.input.contract && current.pool1.quantity.symbol.code().to_string() == state.input.symbol) {
      return current.pool1
    } else {
      return current.pool2
    }
  },

  poolTwo(state, { current }) {
    if (!current) return null

    if (current.pool1.contract == state.input.contract && current.pool1.quantity.symbol.code().to_string() == state.input.symbol) {
      return current.pool2
    } else {
      return current.pool1
    }
  },

  inputBalance(state, getters, rootState) {
    if (!rootState.user || !rootState.user.balances || !state.input) {
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

  outputBalance(state, getters, rootState) {
    if (!rootState.user || !rootState.user.balances || !state.output) {
      if (getters.current) {
        return '0.0000 ' + state.output.symbol
      }

      return '0.0000'
    }

    const balance = rootState.user.balances.filter(b => {
      return b.currency === state.output.symbol && b.contract == state.output.contract
    })[0]
    if (!balance) return '0.0000 ' + state.output.symbol

    return `${balance.amount} ${balance.currency}`
  }
}
