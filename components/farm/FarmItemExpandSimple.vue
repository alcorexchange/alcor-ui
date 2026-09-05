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
              span {{ positions.amountA | nFormat }}
              span.color-grey-thirdly {{ farm.tokenA.quantity.split(' ')[1] }}
            .icon-and-value
              span {{ positions.amountB | nFormat }}
              span.color-grey-thirdly {{ farm.tokenB.quantity.split(' ')[1] }}
        td
          span {{ positions.aggregatedPoolShare }}%
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
</template>

<script>
import { calculateUserStake } from '~/utils/farms.ts'
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'

export default {
  name: 'FarmItemExpand',
  components: {
    TokenImage,
    AlcorButton,
  },

  props: ['farm', 'finished'],

  data() {
    return {
      incentiveStats: [],
      interval: null,
    }
  },

  computed: {
    farmedRewards() {
      return this.getAggregated()
    },

    dailyRewards() {
      return this.getAggregated('daily')
    },

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

    aggregatedStakes() {
      const allStats = []
      this.farm.incentives.forEach(({ incentiveStats }) => {
        incentiveStats.forEach((stat) => allStats.push(stat))
      })

      return allStats
    },

    positions() {
      const sharesByIncentive = []
      let amountA = 0
      let amountB = 0

      this.farm.positions.forEach((p) => {
        amountA += parseFloat(p.amountA)
        amountB += parseFloat(p.amountB)
      })

      let poolShare = 0

      this.incentiveStats.forEach((stat) => {
        if (stat.userSharePercent) poolShare += calculateUserStake(stat).userSharePercent
      })
      sharesByIncentive.push(poolShare)

      return {
        aggregatedPoolShare:
          Math.round((sharesByIncentive.reduce((a, b) => a + b) / sharesByIncentive.length) * 100) / 100,
        amountA,
        amountB,
      }
    },
  },

  mounted() {
    this.setIncentiveStats()
    this.interval = setInterval(() => {
      this.setIncentiveStats()
    }, 1000)
  },

  beforeDestroy() {
    clearInterval(this.interval)
  },

  methods: {
    setIncentiveStats() {
      const incentiveStats = []

      for (const incentive of this.farm.incentives) {
        for (const incentiveStat of incentive.incentiveStats) {
          if (!incentiveStat.staked) continue

          const staked = calculateUserStake(incentiveStat)
          if (staked == null) continue

          incentiveStats.push(staked)
        }
      }

      this.incentiveStats = incentiveStats
    },

    getAggregated(field) {
      const reward = {}
      const precisions = {}

      for (const staked of this.incentiveStats) {
        const symbol = staked.farmedReward.symbol.name
        const amount = staked[field === 'daily' ? 'dailyRewards' : 'farmedReward']

        precisions[symbol] = staked.farmedReward.symbol.precision

        if (reward[symbol]) {
          reward[symbol].amount = reward[symbol].amount + parseFloat(amount)
        } else {
          reward[symbol] = {
            symbol,
            amount: parseFloat(amount),
            precision: precisions[symbol],
          }
        }
      }

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

@media only screen and (max-width: 640px) {
}
</style>
