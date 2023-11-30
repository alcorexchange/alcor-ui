<template lang="pug">
.farms-table
  .table-header.farm-item
    .header-item Pair
    .header-item Total Staked
    .header-item APR
    .header-item Total Reward
    .header-item Daily Rewards
    .header-item Rem. Time
    .header-item
    .header-item.stake-actions
      el-badge(v-if="finished && stakedStakes.length != 0" type="success" :value="stakedStakes.length")
        el-tooltip(content="Unstake your finished farms to free account RAM")
          AlcorButton.pulse-animation(@click="unstakeAllFarms") Claim & Unstake All
      el-badge(v-if="!finished && unstakedStakes.length != 0" type="warning" :value="unstakedStakes.length")
        GradientBorder.gradient-border
          AlcorButton.pulse-animation(@click="stakeAllFarms") Stake All Positions
  .table-items
    FarmItemNew(
      v-for="farm in farmPools"
      :farm="farm"
      :finished="finished"
      @claimAll="claimAll"
      @stakeAll="stakeAll"
      @unstakeAll="unstakeAll"
      @claim="claim"
      @stake="stake"
      @unstake="unstake"
    )
</template>

<script>
import PairIcons from '@/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'
import StakingStatus from '~/components/farm/StakingStatus'
import FarmsTableActions from '~/components/farm/FarmsTableActions'
import IncentiveItem from '~/components/farm/IncentiveItem.vue'
import AuthOnly from '~/components/AuthOnly.vue'
import FarmItemNew from '~/components/farm/FarmItemNew.vue'
export default {
  name: 'FarmsTable',
  components: {
    PairIcons,
    TokenImage,
    AlcorButton,
    StakingStatus,
    FarmsTableActions,
    AuthOnly,
    IncentiveItem,
    FarmItemNew,
  },

  props: ['noClaim', 'finished', 'farmPools'],

  data: () => {
    return {
      extendedRow: null,
    }
  },

  computed: {
    userStakes() {
      // TODO что то теперь состояние стейкед не обновляет
      const pool = this.farmPools.find((fp) => fp.id == this.extendedRow.id)

      return pool.incentives
    },

    stakedStakes() {
      const stakes = []
      this.$store.getters['farms/farmPools']
        // pools
        .forEach((p) =>
          p.incentives
            .filter((i) => i.isFinished && i.stakeStatus != 'notStaked' && i.incentiveStats.length > 0)
            //incentives
            .forEach((i) =>
              i.incentiveStats
                .filter((i) => i.staked)
                // staked stats
                .forEach((s) => stakes.push(s))
            )
        )

      return stakes
    },

    unstakedStakes() {
      const stakes = []
      this.$store.getters['farms/farmPools']
        // pools
        .forEach((p) =>
          p.incentives
            .filter((i) => !i.isFinished && i.stakeStatus != 'staked' && i.incentiveStats.length > 0)
            //incentives
            .forEach((i) =>
              i.incentiveStats
                .filter((i) => !i.staked)
                // staked stats
                .forEach((s) => stakes.push(s))
            )
        )

      return stakes
    },
  },

  methods: {
    addLiquidity(row) {
      this.$router.push({
        path: '/positions/new',
        query: {
          left: row.tokenA.quantity.split(' ')[1].toLowerCase() + '-' + row.tokenA.contract,
          right: row.tokenB.quantity.split(' ')[1].toLowerCase() + '-' + row.tokenB.contract,
        },
      })
    },

    async unstakeAllFarms() {
      try {
        await this.$store.dispatch('farms/stakeAction', {
          stakes: this.stakedStakes,
          action: 'unstake',
        })
        setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
      } catch (e) {
        this.$notify({ type: 'Error', title: 'Stake', message: e.message })
      }
    },

    async stakeAllFarms() {
      try {
        await this.$store.dispatch('farms/stakeAction', {
          stakes: this.unstakedStakes,
          action: 'stake',
        })
        setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
      } catch (e) {
        this.$notify({ type: 'Error', title: 'Stake', message: e.message })
      }
    },

    async claimAll(incentive) {
      const stakes = incentive.incentiveStats.filter((i) => i.staked)
      try {
        await this.$store.dispatch('farms/stakeAction', {
          stakes,
          action: 'getreward',
        })
        setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
      } catch (e) {
        this.$notify({
          title: 'Error',
          message: e.message || e,
          type: 'error',
        })
      }
    },

    async stakeAll(incentive) {
      try {
        const stakes = incentive.incentiveStats.filter((i) => !i.staked)
        await this.$store.dispatch('farms/stakeAction', {
          stakes,
          action: 'stake',
        })
        setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
      } catch (e) {
        this.$notify({
          title: 'Error',
          message: e.message || e,
          type: 'error',
        })
      }
    },

    async unstakeAll(incentive) {
      try {
        const stakes = incentive.incentiveStats.filter((i) => i.staked)
        await this.$store.dispatch('farms/stakeAction', {
          stakes,
          action: 'unstake',
        })
        setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
      } catch (e) {
        this.$notify({
          title: 'Error',
          message: e.message || e,
          type: 'error',
        })
      }
    },

    async claim(stake) {
      try {
        await this.$store.dispatch('farms/stakeAction', {
          stakes: [stake],
          action: 'getreward',
        })
        setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
      } catch (e) {
        this.$notify({
          title: 'Error',
          message: e.message || e,
          type: 'error',
        })
      }
    },

    async unstake(stake) {
      try {
        await this.$store.dispatch('farms/stakeAction', {
          stakes: [stake],
          action: 'unstake',
        })
        setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
      } catch (e) {
        this.$notify({
          title: 'Error',
          message: e.message || e,
          type: 'error',
        })
      }
    },

    async stake(stake) {
      try {
        await this.$store.dispatch('farms/stakeAction', {
          stakes: [stake],
          action: 'stake',
        })
        setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 1000)
      } catch (e) {
        this.$notify({
          title: 'Error',
          message: e.message || e,
          type: 'error',
        })
      }
    },
  },
}
</script>

<style lang="scss">
.farm-item {
  display: grid;
  grid-template-columns: 21% 16% 8% 14% 14% 10% 1fr auto;
  & > * {
    padding: 14px 10px;
  }
}

.icon-and-value {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.farm-stake-button {
  color: var(--main-action-green) !important;
  border: 1px solid var(--btn-default) !important;
  &:hover {
    background: var(--main-action-green) !important;
    color: black !important;
  }
}
// .farm-unstake-button {
//   &:hover {
//     background: var(--main-action-red) !important;
//   }
// }
.farm-claim-button {
  color: var(--text-theme) !important;
  &:hover {
    background: var(--main-green) !important;
  }
}
</style>

<style scoped lang="scss">
.farms-table {
  display: flex;
  flex-direction: column;
  // background: var(--table-background);
  margin-top: 12px;
  border-radius: 6px;
  overflow: hidden;
}
.table-header {
  color: #909399;
  font-weight: 500;
  font-size: 14px;
}

.table-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media only screen and (max-width: 900px) {
  .table-header {
    display: none;
  }
}

.pulse-animation {
  animation: pulse 1.8s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0px var(--main-action-green);
  }
  70% {
    box-shadow: 0 0 0 6px transparent;
  }
  100% {
    box-shadow: 0 0 0 transparent;
  }
}
</style>
