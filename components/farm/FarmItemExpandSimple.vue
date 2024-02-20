<template lang="pug">
.farm-item-expand-simple
  table.fs-14
    thead
      tr
        th Your Total Stake
        th Reward Share
        th Daily Earn
        th Total Earned
        th
    tbody
      tr
        td
          .d-flex.flex-column
            .icon-and-value
              span {{ row.amountA | nFormat }}
              span.color-grey-thirdly {{ farm.tokenA.quantity.split(' ')[1] }}
            .icon-and-value
              span {{ row.amountB | nFormat }}
              span.color-grey-thirdly {{ farm.tokenB.quantity.split(' ')[1] }}
        td
          span {{ row.aggregatedPoolShare }}%
        //- TODO: daily earned or incentives
        td
          .d-flex.flex-column.gap-2
            .icon-and-value(v-for="reward in dailyRewards")
              span {{ reward.amount | commaFloat }}
              span.color-grey-thirdly {{ reward.symbol }}
        td
          .d-flex.flex-column.gap-2
            .icon-and-value(v-for="reward in farmedRewards")
              span {{ reward.amount | commaFloat }}
              span.color-grey-thirdly {{ reward.symbol }}
        td
          .actions
            template(v-if="!finished")
              AlcorButton(compact access @click="claimAllIncentives" v-if="canClaim").farm-claim-button Claim
              AlcorButton(compact @click="stakeAllIncentives" v-if="canStake").farm-stake-button Stake
              AlcorButton(bordered danger compact @click="unstakeAllIncentives" v-if="canUnstake || finished").danger.farm-unstake-button Unstake

            AlcorButton(compact access @click="unstakeAllIncentives" v-else).farm-claim-button Claim And Unstake
  //.left
    .item
      .title.muted.fs-14.mb-1 Farmed Rewards
      .rewards
        .icon-and-value(v-for="reward in farmedRewards")
          TokenImage(:src="$tokenLogo(reward.symbol, reward.contract)" width="14px" height="14px")
          span {{ reward.amount | commaFloat }} {{ reward.symbol }}
    .item.fs-14
      .muted.mb-1 Reward Share
      span {{ aggregatedPoolShare }}%
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
      return !this.finished && this.canUnstake
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
      return this.getReward('farmed')
    },

    dailyRewards() {
      // Aggregated reward
      return this.getReward('daily')
    },

    aggregatedStakes() {
      const allStats = []
      this.farm.incentives.forEach(({ incentiveStats }) => {
        incentiveStats.forEach((stat) => allStats.push(stat))
      })

      return allStats
    },

    // TODO Estimated reward
    row() {
      // AVG Share by staked to incentive
      const row = {}

      const sharesByIncentive = []
      let amountA = 0
      let amountB = 0

      this.farm.positions.forEach((p) => {
        amountA += parseFloat(p.amountA)
        amountB += parseFloat(p.amountB)
      })

      this.farm.incentives.forEach((incentive) => {
        let poolShare = 0

        incentive.incentiveStats.forEach((stat) => {
          if (stat.userSharePercent) poolShare += stat.userSharePercent
        })
        sharesByIncentive.push(poolShare)
      })

      return {
        aggregatedPoolShare:
          Math.round((sharesByIncentive.reduce((a, b) => a + b) / sharesByIncentive.length) * 100) / 100,
        amountA,
        amountB,
      }
    },
  },

  methods: {
    getReward(mode) {
      const reward = {}

      const precisions = {}
      this.farm.incentives.forEach((incentive) => {
        incentive.incentiveStats
          .filter((s) => s.staked)
          .forEach((s) => {
            const [amount, symbol] = s[mode === 'daily' ? 'dailyRewards' : 'farmedReward'].split(' ')
            precisions[symbol] = getPrecision(incentive.reward.quantity.split(' ')[0])

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
  padding: 0 var(--amm-space-3);
  overflow: auto;
  &::-webkit-scrollbar {
    height: 2px;
  }
}
.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}
table {
  width: 100%;
  min-width: 600px;
  thead tr {
    border-bottom: 1px solid var(--border-1-color);
  }
  th,
  td {
    padding: 8px;
    border-bottom: none;

    &:first-child {
      padding-left: 0;
    }
    &:last-child {
      padding-right: 0;
    }
  }
  tr,
  td {
    background: transparent !important;
    &:hover {
      background: transparent !important;
    }
  }

  th {
    font-weight: 400;
    white-space: nowrap;
  }
}

@media only screen and(max-width: 640px) {
}
</style>
