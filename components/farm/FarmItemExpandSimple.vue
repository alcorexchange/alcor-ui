<template lang="pug">
.farm-item-expand-simple
  .left
    .title.muted.fs-14.mb-1 Farmed Rewards
    .rewards
      .icon-and-value(v-for="reward in farmedRewards")
        TokenImage(:src="$tokenLogo('WAX', 'eosio.token')" width="14px" height="14px")
        span {{ reward }}

  .actions
    AlcorButton(access).farm-claim-button Claim All
    AlcorButton(bordered access).farm-stake-button Stake All
    AlcorButton(bordered danger).farm-unstake-button UnStake All
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
          const [amount, key] = s.farmedReward.split(' ')
          precisions[key] = getPrecision(incentive.reward.quantity.split(' ')[0])

          if (reward[key]) {
            reward[key] = reward[key] + parseFloat(amount)
          } else {
            reward[key] = parseFloat(amount)
          }
        })
      })

      return Object.entries(reward).map(([symbol, amount]) => {
        return `${amount.toFixed(precisions[symbol])} ${symbol}`
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
