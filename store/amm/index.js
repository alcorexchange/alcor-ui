import Vue from 'vue'
import axios from 'axios'
import cloneDeep from 'lodash/cloneDeep'

import { Percent, Pool, Position } from '@alcorexchange/alcor-swap-sdk'

import { fetchAllRows } from '~/utils/eosjs'
import { isTicksAtLimit, tryParsePrice, tryParseCurrencyAmount, parseToken, tryParseTick } from '~/utils/amm'
import { nameToUint64 } from '~/utils'

const DEFAULT_SLIPPAGE = 0.3

export const state = () => ({
  pools: [],
  positions: [],
  //plainPositions: [],

  // Store only one pool ticks at the time
  ticks: {},

  // Api
  poolsStats: [],
  history: [],

  // TODO move to module
  selectedTokenA: null,
  selectedTokenB: null,
  slippage: DEFAULT_SLIPPAGE,
  maxHops: 2,

  last_pool_subscribed: null
})

export const mutations = {
  setPools: (state, pools) => state.pools = pools,

  setPositions: (state, positions) => state.positions = positions,
  setPlainPositions: (state, positions) => state.plainPositions = positions,
  setSlippage: (state, slippage) => state.slippage = slippage,
  setMaxHops: (state, maxHops) => state.maxHops = maxHops,
  setLastPoolSubscribed: (state, poolId) => state.last_pool_subscribed = poolId,

  setPoolsStats: (state, stats) => state.poolsStats = stats,
  setHistory: (state, data) => state.history = data,

  updatePool: (state, pool) => {
    const index = state.pools.findIndex((c) => c.id === pool.id)

    if (index == -1) {
      state.pools.push(pool)
    } else {
      Vue.set(state.pools, index, pool)
    }
  },

  setTicks: (state, { poolId, ticks }) => {
    ticks.sort((a, b) => a.id - b.id)
    Vue.set(state.ticks, poolId, ticks)
  }
}

export const actions = {
  init({ dispatch, rootState, commit }) {
    dispatch('fetchPools')
    dispatch('fetchPoolsStats')

    this.$socket.on('account:update-positions', positions => {
      // TODO Handle positions id's
      dispatch('fetchPositions')
      dispatch('fetchPositionsHistory')
    })

    // We do not need ticks on UI anymore
    // this.$socket.on('swap:ticks:update', ({ poolId, ticks }) => {
    //   ticks.forEach(tick => {
    //     dispatch('updateTickOfPool', { poolId, tick })
    //   })
    // })

    this.$socket.on('swap:pool:update', data => {
      data.forEach(pool => {
        commit('updatePool', pool)
      })
    })

    dispatch('subscribeForAllSwapEvents')
    this.$socket.io.on('reconnect', () => {
      dispatch('subscribeForAllSwapEvents')
      dispatch('fetchPools')
      dispatch('fetchPoolsStats')
      dispatch('fetchPositionsHistory')
    })
  },

  unsubscribe({ state, rootState, commit, dispatch }, poolId) {
    this.$socket.emit('unsubscribe', { room: 'swap', params: { chain: rootState.network.name, poolId } })
  },

  subscribeForAllSwapEvents({ rootState, commit }) {
    this.$socket.emit('subscribe', { room: 'swap', params: { chain: rootState.network.name, allPools: true } })
  },

  afterLogin({ dispatch }) {
    dispatch('fetchPositions')
    dispatch('fetchPositionsHistory')
  },

  async fetchPoolsStats({ state, commit }) {
    const { data: pools } = await this.$axios.get('/v2/swap/pools')
    commit('setPoolsStats', pools)
  },

  async fetchPositions({ state, commit, rootState, dispatch }) {
    const owner = rootState.user?.name

    const { data: positions } = await this.$axios.get('/v2/account/' + owner + '/positions')
    commit('setPositions', positions)
  },

  async fetchPositionsHistory({ state, commit, rootState, dispatch }, { page = 1 } = {}) {
    const ITEMS_PER_PAGE = 20
    const skip = (page - 1) * ITEMS_PER_PAGE
    const owner = rootState.user?.name
    if (!owner) return
    const [position, swap] = await axios.all([
      this.$axios.get('/v2/account/' + owner + '/positions-history', {
        params: {
          skip,
          limit: ITEMS_PER_PAGE
        }
      }),
      this.$axios.get('/v2/account/' + owner + '/swap-history', {
        params: {
          skip,
          limit: ITEMS_PER_PAGE
        }
      }),
    ])
    const merged = [...position.data, ...swap.data.map(item => ({ ...item, type: 'swap' }))]
    commit('setHistory', page == 1 ? merged : [...merged, ...state.history])

    // To check on LoadMore
    return merged
  },

  updateTickOfPool({ state, commit }, { poolId, tick }) {
    // FIXME We do not user ticks on UI side
    const ticks = cloneDeep(state.ticks[poolId] ?? [])

    const old = ticks.findIndex(old_tick => {
      return old_tick.id == tick.id
    })

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

    // TODO use backend for it may be

    const ticks = await fetchAllRows(this.$rpc, { code: rootState.network.amm.contract, scope: poolId, table: 'ticks' })
    commit('setTicks', { poolId, ticks })
  },

  async poolUpdate({ state, commit, rootState, dispatch }, poolId) {
    if (isNaN(poolId)) return
    console.log('pool update triggered')

    // FIXME We do not user that in UI
    //dispatch('fetchTicksOfPool', poolId)

    const { network } = rootState

    const [pool] = await fetchAllRows(this.$rpc, {
      code: network.amm.contract,
      scope: network.amm.contract,
      table: 'pools',
      limit: 1,
      lower_bound: poolId,
      upper_bound: poolId
    })

    if (!pool) return console.error('Pool not found!', poolId)
    const old_pools = cloneDeep(state.pools)
    const old_pool = old_pools.findIndex(o => o.id == pool.id)

    if (old_pool != -1) {
      old_pools[old_pool] = pool
    } else { old_pools.push(pool) }

    commit('setPools', old_pools)
  },

  async fetchPools({ state, commit, rootState, dispatch }) {
    //console.log('fetchPools')
    // TODO Redo with api (if it will work safely)
    // and load ticks with single api call

    const { network } = rootState

    const rows = await fetchAllRows(this.$rpc, { code: network.amm.contract, scope: network.amm.contract, table: 'pools' })

    commit('setPools', rows.filter(p => !rootState.network.SCAM_CONTRACTS.includes(p.tokenA.contract) &&
      !rootState.network.SCAM_CONTRACTS.includes(p.tokenB.contract)))

    // Seem like we do not need ticks
    // for (const row of rows) {
    //   dispatch('fetchTicksOfPool', row.id)
    // }
  },
}

export const getters = {
  slippage: ({ slippage }) => new Percent((!isNaN(slippage) ? slippage : DEFAULT_SLIPPAGE) * 100, 10000),

  pools(state, getters, rootState) {
    const pools = []

    for (const row of state.pools) {
      const { tokenA, tokenB, currSlot: { sqrtPriceX64, tick } } = row

      pools.push(new Pool({
        ...row,

        tokenA: parseToken(tokenA),
        tokenB: parseToken(tokenB),
        sqrtPriceX64,
        tickCurrent: tick
      }))
    }

    return pools
  },

  positions(state, getters) {
    const positions = []

    for (const position of state.positions) {
      // Pools are broken here, we have to construct it manually again here
      // BROKEN const poolInstance = getters.pools.find(p => p.id == position.pool)

      const pool = state.pools.find(p => p.id == position.pool)
      if (!pool) continue
      const { tokenA, tokenB, currSlot: { sqrtPriceX64, tick } } = pool

      const poolInstance = new Pool({
        ...pool,

        tokenA: parseToken(tokenA),
        tokenB: parseToken(tokenB),
        sqrtPriceX64,
        tickCurrent: tick
      })

      if (!poolInstance) continue

      const tempPosition = new Position({
        ...position,
        pool: new Pool({ ...poolInstance })
      })

      // Add Stats
      Object.assign(tempPosition, {
        feesA: position.feesA || '0.0000',
        feesB: position.feesB || '0.0000',
        pNl: position.pNl | 0,
        totalValue: position.totalValue || 0
      })

      positions.push(tempPosition)
    }

    return positions
  },
}
