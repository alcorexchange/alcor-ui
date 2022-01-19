import findIndex from 'lodash/findIndex'

import { asset } from 'eos-common'
import { parseAsset, make256key } from '~/utils'
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
  },

  stream: null,

  slippage: 0.1
})

export const mutations = {
  setPairs: (state, pairs) => state.pairs = pairs,
  setInput: (state, token) => state.input = token,
  setOutput: (state, token) => state.output = token,
  setTab: (state, tab) => state.tab = tab,
  setWithdrawToken: (state, token) => state.withdraw_token = token,
  setStream: (state, stream) => state.stream = stream,
  setSlippage: (state, slippage) => state.slippage = slippage,

  updatePair: (state, pair) => {
    const index = findIndex(state.pairs, { id: pair.id })
    if (index === -1) return console.log('not updated pair: ', pair.id)

    state.pairs.splice(index, 1, pair)
  }
}

export const actions = {
  async init({ state, commit, dispatch, rootState, getters }) {
    await dispatch('getPairs')

    if (!getters.current) {
      if (getters.pairs.length > 0) dispatch('setPair', getters.pairs[0].id)
      return
    }

    // Or, there was selected in inputs
    // Update after server input/output set (need precision)
    const tokens = get_all_tokens(getters.pairs)

    const input = tokens.filter(t => t.symbol == state.input.symbol && t.contract == state.input.contract)[0]
    const output = tokens.filter(t => t.symbol == state.output.symbol && t.contract == state.output.contract)[0] // can fail if no pairs

    if (input) commit('setInput', input)
    if (output) commit('setOutput', output)
  },

  startStream({ state, commit, dispatch, getters, rootState }) {
    const stream = setInterval(() => {
      if (!getters.current) return
      dispatch('updatePair', getters.current.id)
    }, 1000)

    commit('setStream', stream)
  },

  stopStream({ state, commit }) {
    if (state.stream) {
      clearInterval(state.stream)
      commit('setStream', null)
    }
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

  updatePairBalances({ getters, dispatch }) {
    if (!getters.current) return

    const { pool1, pool2 } = getters.current

    dispatch('updateBalance', {
      contract: pool1.contract,
      symbol: pool1.quantity.symbol.code().to_string()
    }, { root: true })

    dispatch('updateBalance', {
      contract: pool2.contract,
      symbol: pool2.quantity.symbol.code().to_string()
    }, { root: true })
  },

  async getPairs({ commit, rootState, rootGetters }) {
    const pairs = []

    let lower_bound
    while (true) {
      const { rows } = await this.$rpc.get_table_rows({
        code: rootState.network.pools.contract,
        scope: rootState.network.pools.contract,
        table: 'pairs',
        limit: 1000,
        lower_bound
      })

      pairs.push(...rows)
      if (rows.length != 1000) break
      lower_bound = rows[rows.length - 1].id
    }

    pairs.map(r => {
      r.pool1.quantity = asset(r.pool1.quantity)
      r.pool2.quantity = asset(r.pool2.quantity)
      r.supply = asset(r.supply)
      r.name = r.pool1.quantity.symbol.code().to_string() + '/' + r.pool2.quantity.symbol.code().to_string()
      r.i256 = make256key(
        r.pool1.contract, r.pool1.quantity.symbol.code().to_string(),
        r.pool2.contract, r.pool2.quantity.symbol.code().to_string()
      )
    })

    const { SCAM_CONTRACTS } = rootState.network
    commit(
      'setPairs',
      pairs.filter(r => !(SCAM_CONTRACTS.includes(r.pool1.contract)) && !(SCAM_CONTRACTS.includes(r.pool1.contract)))
    )
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
    if (!this._vm.$nuxt.$route.name.includes('swap')) return

    const { rows: [new_pair] } = await this.$rpc.get_table_rows({
      code: rootState.network.pools.contract,
      scope: rootState.network.pools.contract,
      table: 'pairs',
      limit: 1,
      lower_bound: getters.current.id,
      upper_bound: getters.current.id
    })

    if (!new_pair) {
      return console.log('Not found pair for update: ', pair_id)
    }

    commit('updatePair', preparePair(new_pair))
  }
}

export const getters = {
  pairs(state) {
    return state.pairs
  },

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
