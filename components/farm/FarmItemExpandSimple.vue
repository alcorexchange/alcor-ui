<template lang="pug">
.farm-item-expand-simple
  .left
    .item
      .title.muted.fs-14.mb-1 Farmed Rewards
      .rewards
        .icon-and-value(v-for="reward in farmedRewards")
          TokenImage(:src="$tokenLogo(reward.symbol, reward.contract)" width="14px" height="14px")
          span {{ reward.amount | commaFloat }} {{ reward.symbol }}
    .item.fs-14
      .muted.mb-1 Reward Share
      span {{ aggregatedPoolShare }}%
  .actions
    template(v-if="!finished")
      AlcorButton(access @click="claimAllIncentives" v-if="canClaim").farm-claim-button Claim
      AlcorButton(bordered access @click="stakeAllIncentives" v-if="canStake").farm-stake-button Stake
      AlcorButton(bordered danger @click="unstakeAllIncentives" v-if="canUnstake || finished").farm-unstake-button Unstake

    AlcorButton(access @click="unstakeAllIncentives" v-else).farm-claim-button Claim And Unstake
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

  props: ['farm', 'finished'],

  computed: {
    canClaim() {
      return !this.finished
    },
    canStake() {
      if (this.finished) return false
      return !!this.farm.incentives.find((incentive) => {
        return !!incentive.incentiveStats.find((stat) => !stat.staked)
      })
    },
    canUnstake() {
      return !!this.farm.incentives.find((incentive) => {
        return !!incentive.incentiveStats.find((stat) => stat.staked)
      })
    },

    farmedRewards() {
      // Aggregated reward
      const reward = {}

      const precisions = {}
      this.farm.incentives.forEach((incentive) => {
        incentive.incentiveStats
          .filter((s) => s.staked)
          .forEach((s) => {
            const [amount, symbol] = s.farmedReward.split(' ')
            precisions[symbol] = getPrecision(
              incentive.reward.quantity.split(' ')[0]
            )

            if (reward[symbol]) {
              reward[symbol].amount = reward[symbol].amount + parseFloat(amount)
            } else {
              reward[symbol] = {
                symbol,
                amount: parseFloat(amount),
                precision: precisions[symbol],
                contract: incentive.reward.contract,
              }
            }
          })
      })

      return Object.values(reward).map((r) => {
        return {
          ...r,
          amount: r.amount?.toFixed(r.precision),
        }
      })
    },

    aggregatedStakes() {
      const allStats = []
      this.farm.incentives.forEach(({ incentiveStats }) => {
        incentiveStats.forEach((stat) => allStats.push(stat))
      })

      return allStats
    },

    // TODO Estimated reward
    aggregatedPoolShare() {
      // AVG Share by staked to incentive
      const sharesByIncentive = []
      this.farm.incentives.forEach((incentive) => {
        let poolShare = 0
        incentive.incentiveStats.forEach((stat) => {
          if (stat.userSharePercent) poolShare += stat.userSharePercent
        })
        sharesByIncentive.push(poolShare)
      })

      return Math.round((sharesByIncentive.reduce((a, b) => a + b) / sharesByIncentive.length) * 100) / 100
    },
  },

  methods: {
    claimAllIncentives() {
      this.$emit('claimAll', { incentiveStats: this.aggregatedStakes })
    },
    stakeAllIncentives() {
      this.$emit('stakeAll', { incentiveStats: this.aggregatedStakes })
    },
    unstakeAllIncentives() {
      this.$emit('unstakeAll', { incentiveStats: this.aggregatedStakes })
    },
  },
}
</script>

<style scoped lang="scss">
.farm-item-expand-simple {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.left {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}
.actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.farm-stake-button {
  color: var(--main-action-green) !important;
  &:hover {
    background: var(--main-action-green) !important;
    color: black !important;
  }
}
.farm-unstake-button {
  color: var(--main-action-red);
  &:hover {
    background: var(--main-action-red) !important;
    color: black !important;
  }
}
.farm-claim-button {
  color: var(--text-theme) !important;
  &:hover {
    background: var(--main-green) !important;
  }
}
@media only screen and(max-width: 640px) {
  .farm-item-expand-simple {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }
  .left {
    width: 100%;
    & > * {
      flex: 1;
    }
  }
  .actions {
    align-self: flex-end;
  }
}
</style>
