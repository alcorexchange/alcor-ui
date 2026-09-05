import { Asset } from '@wharfkit/antelope'

const PRECISION_MULTIPLIER = BigInt('1000000000000000000')

function getRewardPerToken(incentive) {
  const lastTimeRewardApplicable = (periodFinish) => {
    const currentTime = Math.floor(Date.now() / 1000)
    return Math.min(currentTime, periodFinish)
  }

  if (BigInt(incentive.totalStakingWeight) === 0n) {
    return BigInt(incentive.rewardPerTokenStored)
  }

  const periodFinish = BigInt(incentive.periodFinish)
  const lastUpdateTime = BigInt(incentive.lastUpdateTime)
  const rewardRateE18 = BigInt(incentive.rewardRateE18)
  const totalStakingWeight = BigInt(incentive.totalStakingWeight)

  const timeDifference = BigInt(lastTimeRewardApplicable(Number(periodFinish))) - lastUpdateTime
  return BigInt(incentive.rewardPerTokenStored) + (timeDifference * rewardRateE18) / totalStakingWeight
}

export function calculateUserStake(plainUserStake) {
  const userStake = { ...plainUserStake }
  const {
    incentive,
    stakingWeight: stakingWeightStr,
    userRewardPerTokenPaid: userRewardPerTokenPaidStr,
    rewards: rewardsStr,
  } = userStake

  if (!stakingWeightStr) return null

  const {
    totalStakingWeight: totalStakingWeightStr,
    reward: { quantity: rewardQuantity },
    rewardPerDay,
    isFinished,
  } = incentive

  const totalStakingWeight = BigInt(totalStakingWeightStr)
  const stakingWeight = BigInt(stakingWeightStr)
  const userRewardPerTokenPaid = BigInt(userRewardPerTokenPaidStr)
  const rewards = BigInt(rewardsStr)

  const rewardPerToken = getRewardPerToken(incentive)
  const earnedAmount = stakingWeight * (rewardPerToken - userRewardPerTokenPaid)
  const reward = earnedAmount / PRECISION_MULTIPLIER + rewards

  userStake.farmedReward = Asset.fromUnits(reward.toString(), Asset.fromString(rewardQuantity).symbol)

  const userSharePercent = (stakingWeight * 100n * 1000n) / totalStakingWeight
  userStake.userSharePercent = Number(userSharePercent) / 1000

  userStake.dailyRewards = isFinished ? 0 : (rewardPerDay * userStake.userSharePercent) / 100

  return userStake
}
