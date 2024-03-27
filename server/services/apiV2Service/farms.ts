import bigInt from 'big-integer'
import { cacheSeconds } from 'route-cache'
import { Router } from 'express'
import { getChainRpc, fetchAllRows } from '../../../utils/eosjs'
import { parseAsset } from '../../../utils'

export const farms = Router()

function formatIncentive(incentive) {
  const rewardAsset = parseAsset(incentive.reward.quantity)

  incentive.durationInDays = incentive.rewardsDuration / 86400
  incentive.isFinished = incentive.periodFinish <= new Date().getTime() / 1000
  incentive.daysRemain = Math.ceil(
    incentive.isFinished ? 0 : (incentive.periodFinish - new Date().getTime() / 1000) / 86400
  )

  incentive.rewardPerDay =
    bigInt(incentive.rewardRateE18)
      .times(60 * 60 * 24)
      .divide(bigInt(10).pow(18).minus(1))
      .toJSNumber() /
    10 ** rewardAsset.symbol.precision

  const totalReward =
    (incentive.rewardPerDay * incentive.durationInDays).toFixed(rewardAsset.symbol.precision) +
    ' ' +
    rewardAsset.symbol.symbol

  incentive.reward = { ...incentive.reward, ...parseAsset(totalReward) }

  return incentive
}

async function getIncentives(network) {
  const rpc = getChainRpc(network.name)

  const incentives = await fetchAllRows(rpc, {
    code: network.amm.contract,
    scope: network.amm.contract,
    table: 'incentives',
  })

  incentives.forEach(i => formatIncentive(i))

  return incentives
}

//async function loadUserStakes() {
//  const positions = rootState.amm.positions

//  const positionIds = rootState.amm.positions.map(p => Number(p.id))

//  const stakingpos_requests = positionIds.map(posId => {
//    return fetchAllRows(this.$rpc, {
//      code: rootState.network.amm.contract,
//      scope: rootState.network.amm.contract,
//      table: 'stakingpos',
//      lower_bound: posId,
//      upper_bound: posId
//    })
//  })

//  const rows = (await Promise.all(stakingpos_requests)).flat(1)

//  //const rows = stakingpos_requests.flat(2)
//  //console.log({ rows })
//  // const rows = await fetchAllRows(this.$rpc, {
//  //   code: rootState.network.amm.contract,
//  //   scope: rootState.network.amm.contract,
//  //   table: 'stakingpos',
//  //   lower_bound: Math.min(positionIds),
//  //   upper_bound: Math.max(positionIds)
//  // })

//  const farmPositions = []
//  const stakedPositions = rows.filter(i => positionIds.includes(i.posId))

//  for (const sp of stakedPositions) {
//    const position = positions.find(p => p.id == sp.posId)
//    position.incentiveIds = sp.incentiveIds

//    farmPositions.push(position)
//  }

//  const userUnicueIncentives = [...new Set(farmPositions.map(p => p.incentiveIds).flat(1))]

//  // Fetching stakes amounts of positions
//  const userStakes = []
//  for (const incentiveScope of userUnicueIncentives) {
//    const rows = await fetchAllRows(this.$rpc, {
//      code: rootState.network.amm.contract,
//      scope: incentiveScope,
//      table: 'stakes',
//      lower_bound: Math.min(positionIds),
//      upper_bound: Math.max(positionIds)
//    })

//    const stakes = rows.filter(r => positionIds.includes(r.posId)).map(r => {
//      r.incentiveId = incentiveScope
//      r.incentive = state.incentives.find(i => i.id == incentiveScope)
//      r.pool = positions.find(p => p.id == r.posId).pool
//      r.poolStats = positions.find(p => p.id == r.posId).pool
//      return r
//    })

//    userStakes.push(...stakes)
//  }

//  commit('setPlainUserStakes', userStakes)
//  dispatch('calculateUserStakes')
//}


farms.get('/incentives', cacheSeconds(1, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')

  const incentives = await getIncentives(network)

  res.json(incentives)
})
