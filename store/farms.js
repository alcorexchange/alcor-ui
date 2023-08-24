import bigInt from 'big-integer'
import { asset } from 'eos-common'

import { fetchAllRows } from '~/utils/eosjs'

const PrecisionMultiplier = bigInt('1000000000000000000')

const getLastTimeRewardApplicable = periodFinish => {
  const currentTime = Math.floor(Date.now() / 1000)
  return currentTime < periodFinish ? currentTime : periodFinish
}

const getRewardPerToken = incentive => {
  const totalStakedLiquidity = bigInt(incentive.totalStakedLiquidity)
  const rewardPerTokenStored = bigInt(incentive.rewardPerTokenStored)
  const periodFinish = incentive.periodFinish
  const lastUpdateTime = bigInt(incentive.lastUpdateTime)
  const rewardRateE18 = bigInt(incentive.rewardRateE18)

  if (totalStakedLiquidity.eq(0)) {
    return rewardPerTokenStored
  }

  return rewardPerTokenStored.add(
    bigInt(getLastTimeRewardApplicable(periodFinish)).subtract(lastUpdateTime)
      .multiply(rewardRateE18).divide(totalStakedLiquidity)
  )
}

export const state = () => ({
  incentives: [],
  userStakes: []
})

export const mutations = {
  setUserStakes: (state, stakes) => state.userStakes = stakes,
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
  },

  async stake({ dispatch, rootState }, { incentiveId, posId }) {
    const actions = [{
      account: rootState.network.amm.contract,
      name: 'stake',
      authorization: [rootState.user.authorization],
      data: {
        incentiveId,
        posId
      }
    }]

    return await dispatch('chain/sendTransaction', actions, { root: true })
  },

  async unstake({ dispatch, rootState }, { incentiveId, posId }) {
    const actions = [{
      account: rootState.network.amm.contract,
      name: 'unstake',
      authorization: [rootState.user.authorization],
      data: {
        incentiveId,
        posId
      }
    }]

    return await dispatch('chain/sendTransaction', actions, { root: true })
  },

  async getReward({ dispatch, rootState }, { incentiveId, posId }) {
    const actions = [{
      account: rootState.network.amm.contract,
      name: 'getreward',
      authorization: [rootState.user.authorization],
      data: {
        incentiveId,
        posId
      }
    }]

    return await dispatch('chain/sendTransaction', actions, { root: true })
  },

  async loadUserFarms({ state, commit, dispatch, rootState, getters }) {
    const positions = rootState.amm.positions

    const positionIds = rootState.amm.positions.map(p => Number(p.id))

    const rows = await fetchAllRows(this.$rpc, {
      code: rootState.network.amm.contract,
      scope: rootState.network.amm.contract,
      table: 'stakingpos',
      lower_bound: Math.min(positionIds),
      upper_bound: Math.max(positionIds)
    })

    const farmPositions = []
    const stakedPositions = rows.filter(i => positionIds.includes(i.posId))

    for (const sp of stakedPositions) {
      const position = positions.find(p => p.id == sp.posId)
      position.incentiveIds = sp.incentiveIds

      farmPositions.push(position)
    }

    const userUnicueIncentives = [...new Set(farmPositions.map(p => p.incentiveIds).flat(1))]

    // Fetching stakes amounts of positions
    const userStakes = []
    for (const incentiveScope of userUnicueIncentives) {
      const rows = await fetchAllRows(this.$rpc, {
        code: rootState.network.amm.contract,
        scope: incentiveScope,
        table: 'stakes',
        lower_bound: Math.min(positionIds),
        upper_bound: Math.max(positionIds)
      })

      const stakes = rows.filter(r => positionIds.includes(r.posId)).map(r => {
        r.incentiveId = incentiveScope
        r.incentive = state.incentives.find(i => i.id == incentiveScope)
        r.pool = positions.find(p => p.id = r.posId).pool

        const totalStakedLiquidity = bigInt(r.incentive.totalStakedLiquidity)
        const stakedLiquidity = bigInt(r.stakedLiquidity)
        const userRewardPerTokenPaid = bigInt(r.userRewardPerTokenPaid)
        const rewards = bigInt(r.rewards)

        r.userSharePercent = stakedLiquidity.multiply(100).divide(totalStakedLiquidity).toJSNumber()
        r.dailyRewards = r.incentive.isFinished ? 0 : parseFloat(r.incentive.rewardPerDay.split(' ')[0]) * r.userSharePercent / 100
        r.dailyRewards += ' ' + r.incentive.reward.quantity.split(' ')[1]

        const reward = stakedLiquidity.multiply(
          getRewardPerToken(r.incentive).subtract(userRewardPerTokenPaid)).divide(PrecisionMultiplier).add(rewards)

        const rewardToken = asset(r.incentive.reward.quantity)
        rewardToken.set_amount(reward)

        r.farmedReward = rewardToken.to_string()

        return r
      })

      userStakes.push(...stakes)
    }

    commit('setUserStakes', userStakes)
  }
}

function formatIncentive(incentive) {
  incentive.durationInDays = incentive.rewardsDuration / 86400
  incentive.isFinished = incentive.periodFinish <= new Date().getTime() / 1000
  incentive.daysRemain = Math.round(incentive.isFinished ? 0 : (incentive.periodFinish - new Date().getTime() / 1000) / 86400)
  incentive.rewardPerDay = (parseFloat(incentive.reward.quantity) / incentive.durationInDays).toFixed(2)

  //console.log({ incentive })
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
