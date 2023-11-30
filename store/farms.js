import { Big } from 'big.js'
import bigInt from 'big-integer'
import { asset } from 'eos-common'

import { fetchAllRows } from '~/utils/eosjs'
import { parseAsset, assetToAmount } from '~/utils'

const PrecisionMultiplier = bigInt('1000000000000000000')

function formatIncentive(incentive) {
  incentive.durationInDays = incentive.rewardsDuration / 86400
  incentive.isFinished = incentive.periodFinish <= new Date().getTime() / 1000
  incentive.daysRemain = Math.ceil(incentive.isFinished ? 0 : (incentive.periodFinish - new Date().getTime() / 1000) / 86400)
  incentive.rewardPerDay = parseFloat(incentive.reward.quantity) / incentive.durationInDays

  incentive.reward = { ...incentive.reward, ...parseAsset(incentive.reward.quantity) }

  return incentive
}

const getLastTimeRewardApplicable = periodFinish => {
  const currentTime = Math.floor(Date.now() / 1000)
  return currentTime < periodFinish ? currentTime : periodFinish
}

const getRewardPerToken = incentive => {
  const totalStakingWeight = bigInt(incentive.totalStakingWeight)
  const rewardPerTokenStored = bigInt(incentive.rewardPerTokenStored)
  const periodFinish = incentive.periodFinish
  const lastUpdateTime = bigInt(incentive.lastUpdateTime)
  const rewardRateE18 = bigInt(incentive.rewardRateE18)

  if (totalStakingWeight.eq(0)) {
    return rewardPerTokenStored
  }

  return rewardPerTokenStored.add(
    bigInt(getLastTimeRewardApplicable(periodFinish)).subtract(lastUpdateTime)
      .multiply(rewardRateE18).divide(totalStakingWeight)
  )
}

export const state = () => ({
  incentives: [],
  userStakes: [],
  plainUserStakes: [],
  farmPools: [],
  view: 'SIMPLE',
  stakedOnly: false,
})

export const mutations = {
  setUserStakes: (state, stakes) => state.userStakes = stakes,
  setPlainUserStakes: (state, stakes) => state.plainUserStakes = stakes,
  setIncentives: (state, incentives) => state.incentives = incentives,
  setFarmPools: (state, farmPools) => state.farmPools = farmPools,
  toggleView: (state) => state.view = state.view === 'SIMPLE' ? 'ADVANCED' : 'SIMPLE',
  setStakedOnly: (state, value) => state.stakedOnly = value
}

export const actions = {
  async init({ state, commit, dispatch, rootState, getters }) {
    dispatch('loadIncentives') //We do it after all tokens fetched

    setInterval(() => {
      // Recelculate rewards
      if (this._vm.$nuxt.$route.name && this._vm.$nuxt.$route.name.includes('farm')) {
        dispatch('calculateUserStakes')
      }
    }, 1000)
  },

  async loadIncentives({ rootState, commit }) {
    if (!['eos', 'wax', 'proton'].includes(rootState.network.name)) return

    const incentives = await fetchAllRows(this.$rpc, {
      code: rootState.network.amm.contract,
      scope: rootState.network.amm.contract,
      table: 'incentives',
    })

    commit('setIncentives', incentives.map(i => formatIncentive(i)))
  },

  async stakeAction({ dispatch, rootState }, { stakes, action }) {
    const actions = stakes.map(s => {
      const { incentiveId, posId } = s

      return {
        account: rootState.network.amm.contract,
        name: action,
        authorization: [rootState.user.authorization],
        data: {
          incentiveId,
          posId
        }
      }
    })

    if (actions.length == 0) return console.error('NOT ACTION TO SUBMIT')

    return await dispatch('chain/sendTransaction', actions, { root: true })
  },

  calculateUserStakes({ state, commit, dispatch, rootState, getters }) {
    //console.log('calculateUserStakes..')
    // We need this method to trigger to recalculate user rewards (that depends on time)
    const userStakes = []

    for (const r of state.plainUserStakes) {
      const totalStakingWeight = r.incentive.totalStakingWeight
      const stakingWeight = bigInt(r.stakingWeight)
      const userRewardPerTokenPaid = bigInt(r.userRewardPerTokenPaid)
      const rewards = bigInt(r.rewards)

      //console.log(stakingWeight.toString(), totalStakingWeight.toString())

      const reward = stakingWeight.multiply(
        getRewardPerToken(r.incentive).subtract(userRewardPerTokenPaid)).divide(PrecisionMultiplier).add(rewards)

      const rewardToken = asset(r.incentive.reward.quantity)

      rewardToken.set_amount(reward)
      r.farmedReward = rewardToken.to_string()

      //r.userSharePercent = stakingWeight.multiply(100).divide(bigInt.max(totalStakingWeight, 1)).toJSNumber()
      r.userSharePercent = Math.round(parseFloat(stakingWeight) * 100 / bigInt.max(totalStakingWeight, 1).toJSNumber() * 10000) / 10000
      r.dailyRewards = r.incentive.isFinished ? 0 : r.incentive.rewardPerDay * r.userSharePercent / 100
      r.dailyRewards = this._vm.$options.filters.commaFloat(r.dailyRewards, rewardToken.symbol.precision())
      r.dailyRewards += ' ' + r.incentive.reward.quantity.split(' ')[1]

      userStakes.push(r)
    }

    commit('setUserStakes', userStakes)
  },

  async updateStakesAfterAction({ dispatch }) {
    await dispatch('loadIncentives')
    await dispatch('loadUserStakes')
  },

  async loadUserStakes({ state, commit, dispatch, rootState, getters }) {
    // console.log('loadUserStakes...')
    // TODO Refactor table calls
    const positions = rootState.amm.positions

    const positionIds = rootState.amm.positions.map(p => Number(p.id))

    const stakingpos_requests = positionIds.map(posId => {
      return fetchAllRows(this.$rpc, {
        code: rootState.network.amm.contract,
        scope: rootState.network.amm.contract,
        table: 'stakingpos',
        lower_bound: posId,
        upper_bound: posId
      })
    })

    const rows = (await Promise.all(stakingpos_requests)).flat(1)

    //const rows = stakingpos_requests.flat(2)
    //console.log({ rows })
    // const rows = await fetchAllRows(this.$rpc, {
    //   code: rootState.network.amm.contract,
    //   scope: rootState.network.amm.contract,
    //   table: 'stakingpos',
    //   lower_bound: Math.min(positionIds),
    //   upper_bound: Math.max(positionIds)
    // })

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
        r.pool = positions.find(p => p.id == r.posId).pool
        r.poolStats = positions.find(p => p.id == r.posId).pool
        return r
      })

      userStakes.push(...stakes)
    }

    commit('setPlainUserStakes', userStakes)
    dispatch('calculateUserStakes')
  }
}

export const getters = {
  farmPools(state, getters, rootState, rootGetters) {
    const incentives = state.incentives
    const userStakes = state.userStakes

    const poolsPlainWithStatsAndUserData = rootGetters['amm/poolsPlainWithStatsAndUserData']

    const pools = []
    for (const pool of poolsPlainWithStatsAndUserData) {
      const _incentives = incentives.filter(i => i.poolId == pool.id)
      if (!_incentives) continue

      const poolStats = pool.poolStats
      const positions = pool.positions

      const farmIncentives = []
      for (const incentive of _incentives) {
        const incentiveStats = []

        for (const position of positions) {
          const stake = userStakes.find(s => s.incentiveId == incentive.id && s.pool == pool.id && s.posId == position.id)

          if (!stake) {
            incentiveStats.push({ staked: false, incentive, incentiveId: incentive.id, posId: position.id, position })
          } else {
            incentiveStats.push({ staked: true, incentive, ...stake, incentiveId: incentive.id, posId: position.id, position })
          }
        }

        const stakingStatuses = incentiveStats.map(i => i.staked)

        let stakeStatus = 'notStaked'

        if (stakingStatuses.length == 0) {
          stakeStatus = null
        } else if (stakingStatuses.every(Boolean)) {
          stakeStatus = 'staked'
        } else if (stakingStatuses.includes(true)) {
          stakeStatus = 'partiallyStaked'
        }

        farmIncentives.push({ ...incentive, incentiveStats, stakeStatus })
      }

      // let stakedUsdValue = 0

      if (poolStats) {
        // _incentives.forEach(i => {
        //   const absoluteTotalStaked = assetToAmount(poolStats.tokenA.quantity,
        //     poolStats.tokenA.decimals).times(assetToAmount(poolStats.tokenB.quantity, poolStats.tokenB.decimals)).sqrt().round(0)

        //   const stakedPercent = Math.min(100, parseFloat(new Big(i.totalStakingWeight).div(absoluteTotalStaked.div(100)).toString()))
        // })
        // console.log({ _incentives })
        //const price = rootState.tokens.find(t => t.id == id)
        //return (parseFloat(amount) * (price ? price.usd_price : 0)).toLocaleString('en', { maximumFractionDigits: 2 })

        // const absoluteTotalStaked = assetToAmount(poolStats.tokenA.quantity,
        //   poolStats.tokenA.decimals).times(assetToAmount(poolStats.tokenB.quantity, poolStats.tokenB.decimals)).sqrt().round(0)

        // const stakedPercent = Math.min(100, parseFloat(new Big(incentive.totalStakingWeight).div(absoluteTotalStaked.div(100)).toString()))

        // const tvlUSD = poolStats.tvlUSD * (stakedPercent / 100)
        // const dayRewardInUSD = parseFloat(this.$tokenToUSD(
        //   parseFloat(incentive.rewardPerDay),
        //   incentive.reward.symbol.symbol,
        //   incentive.reward.contract)
        // )

        // return (dayRewardInUSD / tvlUSD * 365 * 100).toFixed()
      }

      pools.push({
        ...pool,
        poolStats,
        // TODO APR,
        incentives: farmIncentives,
        positions
      })
    }

    return pools
  },
}
