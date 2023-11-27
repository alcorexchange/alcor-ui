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
    .header-item
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
  grid-template-columns: 21% 16% 8% 15% 15% 10% 1fr auto;
  & > * {
    padding: 10px;
  }
}

.icon-and-value {
  display: flex;
  align-items: center;
  gap: 4px;
  span {
    font-size: 0.8rem;
  }
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
</style>
