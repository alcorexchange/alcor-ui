import { fetchAllRows } from '~/utils/eosjs'
import { constructPoolInstance } from '~/utils/amm'


export const state = () => ({
  incentives: []
})

export const mutations = {
  setIncentives: (state, incentives) => state.incentives = incentives
}

export const actions = {
  async init({ state, commit, dispatch, rootState, getters }) {
    const incentives = await fetchAllRows(this.$rpc, {
      code: rootState.network.amm.contract,
      scope: rootState.network.amm.contract,
      table: 'incentives',
    })

    commit('setIncentives', incentives)
  }
}

function formatIncentive(incentive) {
  incentive.durationInDays = incentive.rewardsDuration / 86400
  incentive.isFinished = incentive.periodFinish <= new Date().getTime() / 1000
  incentive.daysRemain = incentive.isFinished ? 0 : (incentive.periodFinish - new Date().getTime() / 1000) / 86400
  incentive.rewardPerDay = (parseFloat(incentive.reward.quantity) / incentive.durationInDays).toFixed(2)

  console.log({ incentive })
  return incentive
}

export const getters = {
  farmPools(state, getters, rootState) {
    const pools = []

    for (const pool of rootState.amm.pools) {
      const incentives = state.incentives.filter(i => i.poolId == pool.id)
      if (incentives.length == 0) continue

      pools.push({
        ...pool,
        incentives: incentives.map(i => formatIncentive(i))
      })
    }

    return pools
  },

  // incentives(state, getters, rootState) {
  //   // TODO perfomance check on swap pool update
  //   console.log('incentives calculation')
  //   const incentives = []

  //   for (const i of state.incentives) {
  //     const pool = rootState.amm.pools.find(p => p.id == i.poolId)

  //     if (!pool) continue

  //     incentives.push({
  //       ...i,
  //       pool
  //     })
  //   }

  //   return incentives
  // },
}
