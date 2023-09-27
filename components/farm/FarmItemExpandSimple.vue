<template lang="pug">
.farm-item-expand-simple
  .left
    .title.muted.fs-14.mb-1 Farmed Rewards
    .rewards
      .icon-and-value(v-for="reward in farmedRewards")
        TokenImage(:src="$tokenLogo(reward.symbol, reward.contract)" width="14px" height="14px")
        span {{ reward.amount }} {{ reward.symbol }}

  .actions
    AlcorButton(access).farm-claim-button Claim
    AlcorButton(bordered access).farm-stake-button Stake
    AlcorButton(bordered danger).farm-unstake-button UnStake
</template>

<script>
import { getPrecision } from '~/utils'
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'
export default {
  name: 'FarmItemExpand',
  components: {
    TokenImage,
    AlcorButton,
  },

  props: ['farm'],

  computed: {
    farmedRewards() {
      // Aggregated reward
      const reward = {}

      const precisions = {}
      this.farm.incentives.forEach(incentive => {
        incentive.incentiveStats.filter(s => s.staked).forEach(s => {
          const [amount, symbol] = s.farmedReward.split(' ')
          precisions[symbol] = getPrecision(incentive.reward.quantity.split(' ')[0])

          if (reward[symbol]) {
            reward[symbol] = reward[symbol].amount + parseFloat(amount)
          } else {
            reward[symbol] = {
              symbol,
              amount: parseFloat(amount),
              precision: getPrecision(incentive.reward.quantity.split(' ')[0]),
              contract: incentive.reward.contract
            }
          }
        })
      })

      return Object.values(reward).map(r => {
        return {
          amount: r.amount.toFixed(r.precision),
          ...r
        }
      })
    }
  }
}
</script>

<style scoped lang="scss">
.farm-item-expand-simple {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
