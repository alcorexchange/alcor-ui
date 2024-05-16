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

export async function getIncentives(network) {
  const rpc = getChainRpc(network.name)

  const incentives = await fetchAllRows(rpc, {
    code: network.amm.contract,
    scope: network.amm.contract,
    table: 'incentives',
  })

  incentives.forEach(i => formatIncentive(i))

  return incentives
}

// TODO add filter by finished
farms.get('/incentives', cacheSeconds(1, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')

  const incentives = await getIncentives(network)

  res.json(incentives)
})
