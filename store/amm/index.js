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
  //plainPositions: [],

  // Store only one pool ticks at the time
  ticks: {},

  // Api
  poolsStats: [],
  positionsStats: [],

  // TODO move to module
  selectedTokenA: null,
  selectedTokenB: null,
  slippage: DEFAULT_SLIPPAGE,

  last_pool_subscribed: null
})

export const mutations = {
  setPools: (state, pools) => state.pools = pools,
  setPositions: (state, positions) => state.positions = positions,
  setPlainPositions: (state, positions) => state.plainPositions = positions,
  setSlippage: (state, slippage) => state.slippage = slippage,
  setLastPoolSubscribed: (state, poolId) => state.last_pool_subscribed = poolId,

  setPoolsStats: (state, stats) => state.poolsStats = stats,
  setPositionsStats: (state, stats) => state.positionsStats = stats,

  setTicks: (state, { poolId, ticks }) => {
    ticks.sort((a, b) => a.id - b.id)
    Vue.set(state.ticks, poolId, ticks)
  },
  setPoolTokens: (state, { poolIndex, tokenA, tokenB }) => {
    const pool = state.pools[poolIndex]
    Vue.set(state.pools, poolIndex, { ...pool, tokenA, tokenB })
    // pool.tokenA = tokenA
    // pool.tokenB = tokenB
  },
}

export const actions = {
  async init({ dispatch }) {
    dispatch('fetchPools')
    dispatch('fetchPoolsStats')

    this.$socket.on('account:update-positions', positions => {
      // TODO Handle positions id's
      dispatch('fetchPositions')
      dispatch('fetchPositionsStats')
    })

    // TODO Do it on backend might be
    this.$socket.emit('subscribe', { room: 'swap', params: { chain: rootState.network.name, allPools: true } })

    this.$socket.on('swap:ticks:update', data => {
      console.log('SWAP TICKS UPDATE!!!', data)
    })

    this.$socket.on('swap:pool:update', data => {
      console.log('SWAP POOL UPDATE!!!', data)
    })

    this.$socket.io.on('reconnect', () => {
      // TODO Fetch for ticks again
      // Connect to last poool updates
      //
      // commit('setBids', [])
      // commit('setAsks', [])

      // if (state.last_market_subscribed !== null) {
      //   dispatch('unsubscribe', state.last_market_subscribed)
      // }

      // if (state.id && this._vm.$nuxt.$route.name.includes('trade-index-id')) {
      //   dispatch('startStream', state.id)
      // }
    })
  },

  unsubscribe({ state, rootState, commit, dispatch }, poolId) {
    this.$socket.emit('unsubscribe', { room: 'swap', params: { chain: rootState.network.name, poolId } })
  },

  subscribe({ rootState, commit }, poolId) {
    if (market === undefined) return

    this.$socket.emit('subscribe', { room: 'swap', params: { chain: rootState.network.name, poolId } })

    commit('setLastPoolSubscribed', poolId)
    console.log('subscribed to pool', poolId)
    //commit('setStreaming', true)
  },


  async afterLogin({ dispatch }) {
    dispatch('fetchPools')
    dispatch('fetchPositions')
    dispatch('fetchPositionsStats')
  },

  subscribeToPool() {
    this.$socket.on('account:update-positions', positions => {
      // TODO Handle positions id's
      dispatch('fetchPositions')
      dispatch('fetchPositionsStats')
    })
  },


  async fetchPoolsStats({ state, commit }) {
    const { data: pools } = await this.$axios.get('/v2/pools')
    commit('setPoolsStats', pools)
  },

  async fetchPositionsStats({ rootState, commit }) {
    const owner = rootState.user?.name

    const { data } = await this.$axios.get('/v2/account/' + owner + '/positions-stats')
    commit('setPositionsStats', data)
  },

  async fetchPositions({ state, commit, rootState, dispatch }) {
    const owner = rootState.user?.name

    const { data: positions } = await this.$axios.get('/v2/account/' + owner + '/positions')
    commit('setPositions', positions)
    console.log('positions fetched', positions)
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

    // TODO use backend for it may be

    const ticks = await fetchAllRows(this.$rpc, { code: rootState.network.amm.contract, scope: poolId, table: 'ticks' })
    commit('setTicks', { poolId, ticks })
  },

  async poolUpdate({ state, commit, rootState, dispatch }, poolId) {
    if (isNaN(poolId)) return

    dispatch('fetchTicksOfPool', poolId)

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
    const { network } = rootState

    const rows = await fetchAllRows(this.$rpc, { code: network.amm.contract, scope: network.amm.contract, table: 'pools' })
    commit('setPools', rows)
    console.log('pools setted')

    for (const row of rows) {
      dispatch('fetchTicksOfPool', row.id)
    }
  },

  toggleTokens({ state, commit }, { poolId }) {
    console.log({ poolId })
    console.log({ pool: state.pools })
    const poolIndex = state.pools.findIndex(({ id }) => id === parseInt(poolId))
    const { tokenA: _tokenA, tokenB: _tokenB } = state.pools[poolIndex]
    commit('setPoolTokens', {
      tokenA: _tokenB, tokenB: _tokenA, poolIndex
    })
  }
}

export const getters = {
  slippage: ({ slippage }) => new Percent((!isNaN(slippage) ? slippage : DEFAULT_SLIPPAGE) * 100, 10000),

  pools(state, getters, rootState) {
    const pools = []

    console.log('pools getter', state.pools)
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

    return pools
  },

  positions(state, getters) {
    const positions = []

    for (const position of state.positions) {
      const poolInstance = getters.pools.find(p => p.id == position.pool)

      if (!poolInstance) continue

      positions.push(new Position({
        ...position,
        pool: poolInstance
      }))
    }

    console.log('positions getter', positions)
    return positions
  },

  plainPositions(state, getters) {
    const positions = []
    for (const p of getters.positions) {
      const stats = state.positionsStats.find(pos => pos.id == p.id) || {}

      const { tickLower, tickUpper, inRange, pool: { tokenA, tokenB, fee } } = p

      const priceLower = isTicksAtLimit(fee, tickLower, tickUpper).LOWER ? '0' : p.tokenAPriceLower.toSignificant(5)
      const priceUpper = isTicksAtLimit(fee, tickLower, tickUpper).UPPER ? '∞' : p.tokenAPriceUpper.toSignificant(5)

      const amountA = p.amountA.toAsset()
      const amountB = p.amountB.toAsset()

      const link = `/positions/${p.pool.id}-${p.id}-${p.pool.fee}`

      // if (stats.totalValue) stats.totalValue = parseFloat(stats.totalValue).toFixed(2)
      // if (stats.pNl) stats.pNl = parseFloat(stats.pNl).toFixed(2)

      positions.push({ ...stats, inRange, tokenA, tokenB, priceLower, priceUpper, amountA, amountB, link, fee })
    }

    return positions
  },
}
