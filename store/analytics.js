import { constructPoolInstance } from '~/utils/amm'

export const state = () => ({
  poolId: undefined,
  positions: [],
})

export const mutations = {
  setPoolId: (state, id) => state.poolId = id,
  setPositions: (state, positions) => state.positions = positions,
}

export const actions = {
  async getChart({ state, getters }, { period }) { },
  async getPositions({ commit, state }, { id }) {
    if (id == state.poolId) return
    else commit('setPositions', [])

    commit('setPoolId', id)
    const { data } = await this.$axios.get(`/v2/swap/pools/${id}/positions`)
    commit('setPositions', data)
  },
}

export const getters = {
  pool(state, getters, rootState) {
    const _pool = rootState.amm.pools.find((p) => p.id == state.poolId)
    if (!_pool) return

    return constructPoolInstance(_pool)
  },
  stats(state, getters, rootState) {
    return rootState.amm.poolsStats.find((p) => p.id == state.poolId)
  },
}
