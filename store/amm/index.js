import Vue from 'vue'
import axios from 'axios'

import { Percent, Token } from '@alcorexchange/alcor-swap-sdk'

import { parseExtendedAssetPlain } from '~/utils'
import { fetchAllRows } from '~/utils/eosjs'
import { constructPosition, constructPoolInstance } from '~/utils/amm'

const DEFAULT_SLIPPAGE = 10

export const state = () => ({
  pools: [],
  positions: [],
  //plainPositions: [],

  // Store only one pool ticks at the time
  ticks: {},

  // Api
  poolsStats: [],
  history: [],
  allTokens: [],

  // TODO move to module
  selectedTokenA: null,
  selectedTokenB: null,
  slippage: DEFAULT_SLIPPAGE,
  maxHops: 2,
  recalculateOnPriceChange: true,

  positions_loading_status: 'loading',
  last_pool_subscribed: null
})

export const mutations = {
  setPools: (state, pools) => (state.pools = pools),

  setAllTokens: (state, tokens) => (state.allTokens = tokens),
  setPositions: (state, positions) => (state.positions = positions),
  setPlainPositions: (state, positions) => (state.plainPositions = positions),
  setSlippage: (state, slippage) => (state.slippage = slippage),
  setMaxHops: (state, maxHops) => (state.maxHops = maxHops),
  setRecalculateOnPriceChange: (state, recalculateOnPriceChange) =>
    (state.recalculateOnPriceChange = recalculateOnPriceChange),
  setLastPoolSubscribed: (state, poolId) => (state.last_pool_subscribed = poolId),
  setLastPositionsLoadingStatus: (state, status) => (state.positions_loading_status = status),

  setPoolsStats: (state, stats) => (state.poolsStats = stats),
  setHistory: (state, data) => (state.history = data),

  updatePool: (state, pool) => {
    const index = state.pools.findIndex((c) => c.id === pool.id)

    if (index == -1) {
      state.pools.push(pool)
    } else {
      Vue.set(state.pools, index, pool)
    }
  },

  updatePools: (state, pools) => {
    const poolMap = new Map(state.pools.map((pool) => [pool.id, pool]))

    pools.forEach((pool) => {
      poolMap.set(pool.id, pool)
    })

    // Перезаписываем весь массив пулов
    state.pools = Array.from(poolMap.values())
  },

  setTicks: (state, { poolId, ticks }) => {
    ticks.sort((a, b) => a.id - b.id)
    Vue.set(state.ticks, poolId, ticks)
  },
}

export const actions = {
  init({ state, dispatch, rootState, commit }) {
    // FIXME !!!! TESTS!!!

    // setInterval(() => {
    //   commit('setPools', [...state.pools])
    // }, 5000)

    dispatch('fetchPools')
    dispatch('fetchPoolsStats')

    this.$socket.on('account:update-positions', (positions) => {
      console.log('account:update-positions!!!')
      // TODO Handle positions id's
      dispatch('fetchPositions')
      dispatch('fetchPositionsHistory')
    })

    let poolUpdateQueue = []
    let updateTimeout = null
    this.$socket.on('swap:pool:update', (data) => {
      // Накопление данных
      poolUpdateQueue.push(...data)

      // Устанавливаем таймер для выполнения батчевого обновления
      if (!updateTimeout) {
        updateTimeout = setTimeout(() => {
          // Выполняем обновление всех накопленных пулов разом
          commit('updatePools', poolUpdateQueue)

          // Сбрасываем очередь и таймер
          poolUpdateQueue = []
          updateTimeout = null
        }, 2500) // Обновляем раз в 2 секунды
      }
    })

    // this.$socket.on('swap:pool:update', (data) => {
    //   data.forEach((pool) => {
    //     console.log('update pool notification')
    //     commit('updatePool', pool)
    //   })
    // })

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

  async fetchPoolsStats({ dispatch, state, commit }) {
    const { data: pools } = await this.$axios.get('/v2/swap/pools')
    commit('setPoolsStats', pools)

    setTimeout(() => dispatch('farms/setFarmPoolsWithAPR', {}, { root: true }), 1)
  },

  async fetchPositions({ state, commit, rootState, dispatch }) {
    const owner = rootState.user?.name

    commit('setLastPositionsLoadingStatus', 'loading')
    try {
      const { data: positions } = await this.$axios.get('/v2/account/' + owner + '/positions')

      commit('setLastPositionsLoadingStatus', 'loaded')
      commit('setPositions', positions)
      dispatch('farms/loadUserStakes', {}, { root: true })
      setTimeout(() => dispatch('farms/setFarmPoolsWithAPR', {}, { root: true }), 1)
    } catch (e) {
      this._vm.$notify({ type: 'error', title: 'Positions loading ERROR', message: e })
      commit('setLastPositionsLoadingStatus', 'failed')
    }
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
          limit: ITEMS_PER_PAGE,
        },
      }),
      this.$axios.get('/v2/account/' + owner + '/swap-history', {
        params: {
          skip,
          limit: ITEMS_PER_PAGE,
        },
      }),
    ])
    const merged = [...position.data, ...swap.data.map((item) => ({ ...item, type: 'swap' }))]
    commit('setHistory', page == 1 ? merged : [...merged, ...state.history])

    // To check on LoadMore
    return merged
  },

  async fetchTicksOfPool({ commit, rootState }, poolId) {
    if (isNaN(poolId)) return

    // TODO use backend for it may be

    const ticks = await fetchAllRows(this.$rpc, { code: rootState.network.amm.contract, scope: poolId, table: 'ticks' })
    commit('setTicks', { poolId, ticks })
  },

  async fetchPools({ state, commit, rootState, dispatch }) {
    //console.log('fetchPools')
    // TODO Redo with api (if it will work safely)
    // and load ticks with single api call

    const { network } = rootState

    const rows = await fetchAllRows(this.$rpc, {
      code: network.amm.contract,
      scope: network.amm.contract,
      table: 'pools',
    })

    commit(
      'setPools',
      rows
      // rows.filter(
      //   (p) =>
      //     !rootState.network.SCAM_CONTRACTS.includes(p.tokenA.contract) &&
      //     !rootState.network.SCAM_CONTRACTS.includes(p.tokenB.contract)
      // )
    )

    dispatch('setMarketsRelatedPool', {}, { root: true })
    dispatch('setAllTokens')
    setTimeout(() => dispatch('farms/setFarmPoolsWithAPR', {}, { root: true }), 1)
  },

  setAllTokens({ state, commit, rootState }) {
    const tokens = []
    const tokenIds = new Set()

    const scamContractsSet = new Set(rootState.network.SCAM_CONTRACTS)
    rootState.amm.pools.forEach((p) => {
      const tokenA = parseExtendedAssetPlain(p.tokenA)
      const tokenB = parseExtendedAssetPlain(p.tokenB)

      if (!scamContractsSet.has(tokenA.contract) && !tokenIds.has(tokenA.id)) {
        if (rootState.network.SCAM_TOKENS.includes(tokenA.id)) return
        if (rootState.network.SCAM_TOKENS.includes(tokenB.id)) return

        tokenIds.add(tokenA.id)
        tokens.push(tokenA)
      }

      if (!scamContractsSet.has(tokenB.contract) && !tokenIds.has(tokenB.id)) {
        tokenIds.add(tokenB.id)
        tokens.push(tokenB)
      }
    })

    commit('setAllTokens', tokens)
  },
}

export const getters = {
  slippage: ({ slippage }) => new Percent((!isNaN(slippage) ? slippage : DEFAULT_SLIPPAGE) * 100, 10000),

  tokensMap(state) {
    return new Map(state.allTokens.map((t) => [t.id, new Token(t.contract, t.decimals, t.symbol)]))
  },

  poolStatsMap(state) {
    return new Map(state.poolsStats.map((p) => [p.id, p]))
  },

  poolStatsWithoutScam(state, getters, rootState) {
    const scamContractsSet = new Set(rootState.network.SCAM_CONTRACTS)
    const scam_tokens = rootState.network.SCAM_TOKENS

    return state.poolsStats.filter((pool) => {
      return (
        !scamContractsSet.has(pool.tokenA.contract) &&
        !scamContractsSet.has(pool.tokenB.contract) &&
        !scam_tokens.includes(pool.tokenA.id) &&
        !scam_tokens.includes(pool.tokenB.id)
      )
    })
  },

  positions(state) {
    const poolMap = new Map(state.pools.map((pool) => [pool.id, pool]))

    return state.positions
      .map((position) => {
        const pool = poolMap.get(position.pool)
        return pool ? constructPosition(constructPoolInstance(pool), position) : null
      })
      .filter((position) => position !== null)
  },

  positionsByPool(state) {
    const positionsMap = new Map()
    state.positions.forEach((position) => {
      const poolId = position.pool
      if (!positionsMap.has(poolId)) {
        positionsMap.set(poolId, [])
      }
      positionsMap.get(poolId).push(position)
    })
    return positionsMap
  },

  poolsPlainWithStatsAndUserData(state, getters, rootState) {
    const scamContractsSet = new Set(rootState.network.SCAM_CONTRACTS)
    const poolStatsMap = getters.poolStatsMap
    const positionsByPool = getters.positionsByPool

    return state.pools
      .filter((pool) => !scamContractsSet.has(pool.tokenA.contract) && !scamContractsSet.has(pool.tokenB.contract))
      .map((pool) => ({
        ...pool,
        poolStats: poolStatsMap.get(pool.id),
        positions: positionsByPool.get(pool.id) || [], // Берем готовый массив или пустой, если позиций нет
      }))
  },

  poolsMapWithStatsAndUserData(state, getters, rootState) {
    const scamContractsSet = new Set(rootState.network.SCAM_CONTRACTS)
    const poolStatsMap = getters.poolStatsMap

    const poolsMap = new Map()

    state.pools
      .filter((pool) => {
        return (
          !scamContractsSet.has(pool.tokenA.contract) &&
          !scamContractsSet.has(pool.tokenB.contract) &&
          !rootState.network.SCAM_TOKENS.includes(pool.tokenA.id) &&
          !rootState.network.SCAM_TOKENS.includes(pool.tokenB.id)
        )
      })
      .forEach((pool) => {
        poolsMap.set(pool.id, {
          ...pool,
          poolStats: poolStatsMap.get(pool.id),
          positions: state.positions.filter((p) => p.pool === pool.id),
        })
      })

    return poolsMap
  },
}
