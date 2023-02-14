import JSBI from "jsbi"
import { asset } from 'eos-common'

import { fetchAllRows } from '../utils/eosjs'
import { tryParsePrice, parseToken } from '../utils/amm'
import { Token, Pool, Tick, CurrencyAmount, Price, Position } from '~/assets/libs/swap-sdk'
import { nameToUint64 } from '~/utils'

export const state = () => ({
  pools: [],
  positions: [],

  selectedTokenA: null,
  selectedTokenB: null
})

export const mutations = {
  setPools: (state, pools) => state.pools = pools,
  setPositions: (state, positions) => state.positions = positions
}

export const actions = {
  async init({ dispatch, rootState }) {
    await dispatch('fetchPairs')
    await dispatch('fetchPositions', rootState?.user?.name)
  },

  async placePositions({ state, commit, rootState, dispatch }, owner) {

  },

  async fetchPositions({ state, commit, rootState, dispatch }, owner) {
    if (!owner) return console.log('[fetchPositions] no user provided')

    const positions = []

    for (const { id } of state.pools) {
      const [row] = await fetchAllRows(this.$rpc, {
        code: rootState.network.amm.contract,
        scope: id,
        table: 'positions',
        key_type: 'i64',
        index_position: 3,
        lower_bound: nameToUint64(owner),
        upper_bound: nameToUint64(owner)
      })

      if (!row) continue

      row.pool = id
      positions.push(row)
    }

    commit('setPositions', positions)
    console.log('positions', positions)
  },

  async test({ state, getters, commit, rootState, dispatch }) {
    await dispatch('fetchPairs')
    await dispatch('fetchPositions', rootState?.user?.name)

    console.log('testsss', getters.positions)
    //await dispatch('fetchPairs')
    //console.log('2222')

    const pool = getters.pools[0]
    console.log('pool', pool.sqrtRatioX64.toString())

    const r = pool.tokenAPrice.toFixed(20)
    //const r = tryParsePrice(pool.tokenA, pool.tokenB, '1.0032').toFixed()
    console.log('r', r)

    //const pool = state.pools[0]
    //
    //const inAmountStr = asset('1.0432 B').amount.toString()
    ////console.log(inAmount)

    //console.log('pool.tokenA', pool.tokenA)
    //const amountIn = new CurrencyAmount(pool.tokenA, inAmountStr)
    //console.log('amountIn', amountIn.toFixed())

    //console.log('pool', await pool.getOutputAmount(amountIn, 0))
  },

  async fetchPairs({ state, commit, rootState, dispatch }) {
    const { network } = rootState

    const pools = []
    const rows = await fetchAllRows(this.$rpc, { code: network.amm.contract, scope: network.amm.contract, table: 'pools' })

    for (const row of rows) {
      row.ticks = await fetchAllRows(this.$rpc, { code: network.amm.contract, scope: row.id, table: 'ticks' })
      pools.push(row)
    }

    commit('setPools', rows)
  }
}

export const getters = {
  pools(state, getters, rootState) {
    const pools = []

    for (const row of state.pools) {
      const { id, ticks, tokenA, tokenB, fee, liquidity, currSlot: { sqrtPriceX64, tick } } = row
      const TICKS = ticks.map(t => new Tick({ index: t.id, ...t }))
      TICKS.sort((a, b) => a.index - b.index)

      pools.push(new Pool(
        parseToken(tokenA),
        parseToken(tokenB),
        fee,
        sqrtPriceX64,
        liquidity,
        tick,
        TICKS,
        id
      ))
    }

    return pools
  },

  positions(state, getters, rootState) {
    const positions = []

    for (const { liquidity, upper, lower, pool } of state.positions) {
      const poolInstance = getters.pools.find(p => p.id == pool)
      positions.push(new Position({ pool: poolInstance, liquidity, tickLower: lower, tickUpper: upper }))
    }

    console.log('positions gg', positions)
    return positions
  },

  depositCoins(state, getters, rootState) {
    return state.pairs.map(p => p.depositCoin)
  }
}
