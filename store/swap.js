import { asset } from 'eos-common'
import { make256key } from '~/utils'
import { preparePair, get_second_tokens, get_all_tokens } from '~/utils/pools'

export const state = () => ({
  pairs: [],

  input: null,
  output: null,

  tab: 'Swap',

  withdraw_token: {
    amount: '',
    symbol: '',
    contract: '',
    precision: 0
  }
})

export const mutations = {
  setPairs: (state, pairs) => state.pairs = pairs,
  setInput: (state, token) => state.input = token,
  setOutput: (state, token) => state.output = token,
  setTab: (state, tab) => state.tab = tab,
  setWithdrawToken: (state, token) => state.withdraw_token = token
}

export const actions = {
  init({ state, commit, dispatch, rootState }) {
    dispatch('getPairs')
    commit('setInput', rootState.network.baseToken)
  },

  setPair({ state, commit }, pair_id) {
    const pair = state.pairs.filter(p => p.id == pair_id)[0]

    if (!pair) return // TODO ERROR

    commit('setInput', {
      contract: pair.pool1.contract,
      symbol: pair.pool1.quantity.symbol.code().to_string(),
      precision: pair.pool1.quantity.symbol.precision()
    })

    commit('setOutput', {
      contract: pair.pool2.contract,
      symbol: pair.pool2.quantity.symbol.code().to_string(),
      precision: pair.pool2.quantity.symbol.precision()
    })
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
      r.rate = (parseFloat(r.pool1.quantity) / parseFloat(r.pool2.quantity)).toFixed(6)
      r.pool1.quantity = asset(r.pool1.quantity)
      r.pool2.quantity = asset(r.pool2.quantity)
      r.supply = asset(r.supply)
      r.name = r.pool1.quantity.symbol.code().to_string() + '/' + r.pool2.quantity.symbol.code().to_string()
      r.i256 = make256key(
        r.pool1.contract, r.pool1.quantity.symbol.code().to_string(),
        r.pool2.contract, r.pool2.quantity.symbol.code().to_string()
      )
    })

    commit('setPairs', rows)
  },

  updatePairOnPush({ state, commit }, data) {
    const { pair_id, supply, pool1, pool2 } = data

    const pair = state.pairs.filter(p => p.id == pair_id)[0]
    if (!pair) return console.log('NOT FOUND PAIR FOR UPDATE BY PUSH:', pair_id)

    const update = {
      pool1: { contract: pair.pool1.contract, quantity: pool1 },
      pool2: { contract: pair.pool2.contract, quantity: pool2 }
    }

    if (supply) {
      update.supply = supply
    }

    this._vm.$set(state.pairs, pair_id, preparePair({ ...pair, ...update }))
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
    return get_all_tokens(state.pairs)
  },

  tokens1(state, getters, rootState) {
    if (!state.input) {
      return getters.tokens0
    } else {
      return get_second_tokens(state.pairs, state.input)
    }
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
