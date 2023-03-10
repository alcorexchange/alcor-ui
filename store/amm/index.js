import cloneDeep from 'lodash/cloneDeep'
import Vue from 'vue'
import { fetchAllRows } from '~/utils/eosjs'
import { isTicksAtLimit, tryParsePrice, tryParseCurrencyAmount, parseToken, tryParseTick } from '~/utils/amm'
import { Percent, Token, Pool, Tick, CurrencyAmount, Price, Position } from '~/assets/libs/swap-sdk'
import { nameToUint64 } from '~/utils'


const DEFAULT_SLIPPAGE = 0.3

export const state = () => ({
  pools: [],
  positions: [],
  plainPositions: [],

  // Store only one pool ticks at the time
  ticks: {},

  // TODO move to module
  selectedTokenA: null,
  selectedTokenB: null,
  slippage: DEFAULT_SLIPPAGE
})

export const mutations = {
  setPools: (state, pools) => state.pools = pools,
  setPositions: (state, positions) => state.positions = positions,
  setPlainPositions: (state, positions) => state.plainPositions = positions,
  setSlippage: (state, slippage) => state.slippage = slippage,
  setTicks: (state, { poolId, ticks }) => {
    ticks.sort((a, b) => a.id - b.id)
    Vue.set(state.ticks, poolId, ticks)
  },
}

export const actions = {
  async init({ dispatch }) {
    await dispatch('fetchPools')
    await dispatch('fetchPositions')
  },

  updateTickOfPool({ state, commit }, { poolId, tick }) {
    const ticks = cloneDeep(state.ticks[poolId] ?? [])

    const old = ticks.findIndex(old_tick => old_tick.id == tick.id)

    if (old != -1) {
      if (tick.liquidityGross == 0) {
        ticks.splice(old, 1)
      } else {
        ticks[old] = tick
      }
    } else if (tick.liquidityGross !== 0) {
      ticks.push(tick)
    }

    commit('setTicks', { poolId, ticks })
  },

  async fetchTicksOfPool({ commit, rootState }, poolId) {
    if (isNaN(poolId)) return

    const ticks = await fetchAllRows(this.$rpc, { code: rootState.network.amm.contract, scope: poolId, table: 'ticks' })
    commit('setTicks', { poolId, ticks })
  },

  async buildPlainPositions({ commit, getters }) {
    const positions = []
    for (const p of getters.positions) {
      const { tickLower, tickUpper, inRange, pool: { tokenA, tokenB, fee } } = p

      const priceLower = isTicksAtLimit(fee, tickLower, tickUpper).LOWER ? '0' : p.tokenAPriceLower.toSignificant(5)
      const priceUpper = isTicksAtLimit(fee, tickLower, tickUpper).UPPER ? '∞' : p.tokenAPriceUpper.toSignificant(5)

      const amountA = p.amountA.toAsset()
      const amountB = p.amountB.toAsset()
      const { feesA, feesB } = await p.getFees()
      const link = `/manage-position/${p.pool.id}-${p.id}-${p.pool.fee}`

      positions.push({ inRange, tokenA, tokenB, priceLower, priceUpper, amountA, amountB, link, fee, feesA: feesA.toAsset(), feesB: feesB.toAsset() })
    }

    commit('setPlainPositions', positions)
  },

  async fetchPositions({ state, commit, rootState, dispatch }) {
    // TODO Make server api for it
    const owner = rootState.user?.name

    const positions = []

    for (const pool of state.pools) {
      const rows = await fetchAllRows(this.$rpc, {
        code: rootState.network.amm.contract,
        scope: pool.id,
        table: 'positions',
        key_type: 'i64',
        index_position: 3,
        lower_bound: nameToUint64(owner),
        upper_bound: nameToUint64(owner)
      })

      if (!rows) continue

      rows.map(r => r.pool = pool.id)
      positions.push(...rows)
    }

    commit('setPositions', positions)
    dispatch('buildPlainPositions')
  },

  async fetchPools({ state, commit, rootState, dispatch }) {
    const { network } = rootState

    const rows = await fetchAllRows(this.$rpc, { code: network.amm.contract, scope: network.amm.contract, table: 'pools' })
    commit('setPools', rows)

    for (const row of rows) {
      dispatch('fetchTicksOfPool', row.id)
    }
  }
}

export const getters = {
  slippage: ({ slippage }) => new Percent((!isNaN(slippage) ? slippage : DEFAULT_SLIPPAGE) * 100, 10000),

  pools(state, getters, rootState) {
    const pools = []

    for (const row of state.pools) {
      const { tokenA, tokenB, protocolFeeA, protocolFeeB, currSlot: { sqrtPriceX64, tick } } = row

      const ticks = state.ticks[row.id] ?? []

      pools.push(new Pool({
        ...row,

        tokenA: parseToken(tokenA),
        tokenB: parseToken(tokenB),
        ticks,
        sqrtPriceX64,
        tickCurrent: tick
        // protocolFeeA: parseToken(protocolFeeA, protocolFeeB),
        // protocolFeeB: parseToken(protocolFeeA, protocolFeeB)
      }))
    }

    return state.ticks ? pools : pools
  },

  positions(state, getters) {
    const positions = []

    for (const position of state.positions) {
      const poolInstance = getters.pools.find(p => p.id == position.pool)

      positions.push(new Position({
        ...position,
        pool: poolInstance
      }))
    }

    return positions
  }
}
