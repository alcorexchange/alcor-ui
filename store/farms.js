import { Asset } from '@wharfkit/antelope'

import { fetchAllRows } from '~/utils/eosjs'
import { parseAsset } from '~/utils'
import { sqrt } from '~/utils/bigint'

function formatIncentive(incentive) {
  const rewardAsset = Asset.fromString(incentive.reward.quantity)

  incentive.durationInDays = incentive.rewardsDuration / 86400
  incentive.isFinished = incentive.periodFinish <= Math.floor(Date.now() / 1000)

  incentive.daysRemain = Math.ceil(
    incentive.isFinished ? 0 : (incentive.periodFinish - Math.floor(Date.now() / 1000)) / 86400
  )

  const rewardPerDay = (BigInt(incentive.rewardRateE18) * BigInt(60 * 60 * 24)) / (BigInt('1000000000000000000') - BigInt(1))
  const totalReward = rewardPerDay * BigInt(incentive.durationInDays)

  incentive.rewardPerDay = Asset.fromUnits(rewardPerDay, rewardAsset.symbol).toString().split(' ')[0]

  incentive.reward = {
    ...incentive.reward,
    ...parseAsset(Asset.fromUnits(totalReward, rewardAsset.symbol).toString()),
  }

  return incentive
}

export const state = () => ({
  incentives: [],
  farmPoolsWithAPR: [],
  plainUserStakes: [],
  farmPools: [],
  view: 'SIMPLE',
  stakedOnly: false,
  hideZeroAPR: true
})

export const mutations = {
  setPlainUserStakes: (state, stakes) => state.plainUserStakes = stakes,
  setIncentives: (state, incentives) => state.incentives = incentives,
  setFarmPools: (state, farmPools) => state.farmPools = farmPools,
  toggleView: (state) => state.view = state.view === 'SIMPLE' ? 'ADVANCED' : 'SIMPLE',
  setStakedOnly: (state, value) => state.stakedOnly = value,
  setHideZeroAPR: (state, value) => state.hideZeroAPR = value,
  setFarmPoolsWithAPR: (state, value) => state.farmPoolsWithAPR = value,
}

export const actions = {
  init({ state, commit, dispatch, rootState, getters }) {
    dispatch('loadIncentives') //We do it after all tokens fetched
  },

  setFarmPoolsWithAPR({ commit, state, rootState, rootGetters }) {
    const { incentives } = state
    const poolsPlainWithStatsAndUserData = rootGetters['amm/poolsPlainWithStatsAndUserData']

    const r = poolsPlainWithStatsAndUserData.map((pool) => {
      const poolIncentives = incentives
        .filter((incentive) => incentive.poolId === pool.id)
        .map((incentive) => {
          return { ...incentive, apr: getAPR(incentive, pool.poolStats, rootState.tokens) }
        })

      return {
        ...pool,
        poolStats: pool.poolStats,
        incentives: poolIncentives,
        positions: pool.positions,
        avgAPR: getAverageAPR(poolIncentives)
      }
    })

    commit('setFarmPoolsWithAPR', r)
  },

  async loadIncentives({ rootState, commit }) {
    if (!['eos', 'wax', 'proton'].includes(rootState.network.name)) return

    const incentives = await fetchAllRows(this.$rpc, {
      code: rootState.network.amm.contract,
      scope: rootState.network.amm.contract,
      table: 'incentives',
    })

    commit(
      'setIncentives',
      incentives.map((i) => formatIncentive(i))
    )
  },

  async stakeAction({ dispatch, rootState }, { stakes, action }) {
    const actions = stakes.map((s) => {
      const { incentiveId, posId } = s

      return {
        account: rootState.network.amm.contract,
        name: action,
        authorization: [rootState.user.authorization],
        data: {
          incentiveId,
          posId,
        },
      }
    })

    if (actions.length == 0) return console.error('NOT ACTION TO SUBMIT')

    return await dispatch('chain/sendTransaction', actions, { root: true })
  },

  async updateStakesAfterAction({ dispatch }) {
    await dispatch('loadIncentives')
    await dispatch('loadUserStakes')
  },

  async loadUserStakes({ state, commit, dispatch, rootState }) {
    const { positions } = rootState.amm
    const positionIds = positions.map((p) => Number(p.id))

    // Fetch staking positions for each position ID and flatten the responses
    const stakingposRequests = positionIds.map(async (posId) => {
      const response = await fetchAllRows(this.$rpc, {
        code: rootState.network.amm.contract,
        scope: rootState.network.amm.contract,
        table: 'stakingpos',
        lower_bound: posId,
        upper_bound: posId,
      })
      return response.flat()
    })
    const stakedPositions = (await Promise.all(stakingposRequests)).flat()

    // Extract unique incentive IDs
    const userUniqueIncentives = [...new Set(stakedPositions.map((sp) => sp.incentiveIds).flat())]

    // Fetch stakes amounts of positions for each unique incentive
    const userStakes = []
    for (const incentiveScope of userUniqueIncentives) {
      const rows = await fetchAllRows(this.$rpc, {
        code: rootState.network.amm.contract,
        scope: incentiveScope,
        table: 'stakes',
        lower_bound: Math.min(...positionIds),
        upper_bound: Math.max(...positionIds),
      })

      const stakes = rows
        .filter((r) => positionIds.includes(r.posId))
        .map((r) => ({
          ...r,
          incentiveId: incentiveScope,
          incentive: state.incentives.find((i) => i.id == incentiveScope),
          pool: positions.find((p) => p.id == r.posId).pool,
          poolStats: positions.find((p) => p.id == r.posId).poolStats,
        }))

      userStakes.push(...stakes)
    }

    // Commit user stakes and calculate
    commit('setPlainUserStakes', userStakes)
  },
}

function tokenToUSD(amount, symbol, contract, tokens) {
  const parsed = parseFloat(amount)
  amount = (!amount || isNaN(parsed)) ? 0 : parsed
  const id = symbol.toLowerCase() + '-' + contract

  const price = tokens.find(t => t.id == id)
  return (parseFloat(amount) * (price ? price.usd_price : 0)).toLocaleString('en', { maximumFractionDigits: 2 })
}

// TODO: This function is being duplicated in FarmItemNew and here. Need to reuse.
function getAPR(incentive, poolStats, tokens) {
  if (!poolStats) return null

  const tokenA = Asset.fromFloat(poolStats.tokenA.quantity, Asset.Symbol.fromParts(poolStats.tokenA.symbol, poolStats.tokenA.decimals))
  const tokenB = Asset.fromFloat(poolStats.tokenB.quantity, Asset.Symbol.fromParts(poolStats.tokenB.symbol, poolStats.tokenB.decimals))

  const absoluteTotalStaked = sqrt(BigInt(tokenA.units.toString()) * BigInt(tokenB.units.toString())) || 1n

  const stakedPercent_bn = (BigInt(incentive.totalStakingWeight) * BigInt(100) * BigInt(1000)) / absoluteTotalStaked
  const stakedPercent = Number(stakedPercent_bn) / 1000

  const tvlUSD = poolStats.tvlUSD * (stakedPercent / 100)
  const dayRewardInUSD = parseFloat(
    tokenToUSD(parseFloat(incentive.rewardPerDay), incentive.reward.symbol.symbol, incentive.reward.contract, tokens)
  )

  const r = ((dayRewardInUSD / tvlUSD) * 365 * 100)

  return isNaN(r) ? 0 : r.toFixed()
}

function getAverageAPR(incentives) {
  const result = incentives.reduce(
    (acc, incentive) => {
      const apr = incentive.apr
      if (apr !== null) {
        const parsedApr = parseInt(apr)
        acc.sum += parsedApr
        acc.count++
      }
      return acc
    },
    { sum: 0, count: 0 }
  )

  // Handling division by zero case
  if (result.count === 0) return 0

  return result.sum / result.count
}

export const getters = {
  farmPools(state) {
    return state.farmPoolsWithAPR.map((pool) => {
      const poolIncentives = pool.incentives.map((incentive) => {
        const incentiveStats = pool.positions.map((position) => {
          const stake = state.plainUserStakes.find(
            (s) => s.incentiveId === incentive.id && s.pool === pool.id && s.posId === position.id
          )

          return {
            staked: Boolean(stake),
            incentive,
            ...stake,
            incentiveId: incentive.id,
            posId: position.id,
            position,
          }
        })

        const stakeStatus = getStakeStatus(incentiveStats.map((i) => i.staked))

        return { ...incentive, incentiveStats, stakeStatus }
      })

      return {
        ...pool,
        incentives: poolIncentives,
      }
    })
  },
}

function getStakeStatus(stakingStatuses) {
  if (stakingStatuses.length === 0) return null
  if (stakingStatuses.every(Boolean)) return 'staked'
  if (stakingStatuses.includes(true)) return 'partiallyStaked'
  return 'notStaked'
}
