<template lang="pug">
.farms-table
  .table-header.farm-item
    .header-item Pair
    .header-item Total Staked
    .header-item Total Reward
    .header-item Daily Rewards
    .header-item Remaining Time
    .header-item Actions
  .table-items
    FarmItemNew(v-for="farm in farmPools" :farm="farm")
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
    shouldMinimize(incentives) {
      return incentives.length > 2
    },
    firstReward: (incentives) => incentives[0],

    addLiquidity(row) {
      this.$router.push({
        path: '/positions/new',
        query: {
          left:
            row.tokenA.quantity.split(' ')[1].toLowerCase() +
            '-' +
            row.tokenA.contract,
          right:
            row.tokenB.quantity.split(' ')[1].toLowerCase() +
            '-' +
            row.tokenB.contract,
        },
      })
    },

    onRowClick(row) {
      this.$refs.table.toggleRowExpansion(row)
    },

    onExpand(row) {
      this.extendedRow = row
    },

    async claimAll(incentive) {
      const stakes = incentive.incentiveStats.filter((i) => i.staked)
      try {
        await this.$store.dispatch('farms/stakeAction', {
          stakes,
          action: 'getreward',
        })
        setTimeout(
          () => this.$store.dispatch('farms/updateStakesAfterAction'),
          500
        )
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
        setTimeout(
          () => this.$store.dispatch('farms/updateStakesAfterAction'),
          500
        )
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
        setTimeout(
          () => this.$store.dispatch('farms/updateStakesAfterAction'),
          500
        )
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
        setTimeout(
          () => this.$store.dispatch('farms/updateStakesAfterAction'),
          500
        )
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
        setTimeout(
          () => this.$store.dispatch('farms/updateStakesAfterAction'),
          500
        )
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
        setTimeout(
          () => this.$store.dispatch('farms/updateStakesAfterAction'),
          1000
        )
      } catch (e) {
        this.$notify({
          title: 'Error',
          message: e.message || e,
          type: 'error',
        })
      }
    },

    hasPosition(incentives) {
      let hasChildren = false
      incentives.forEach(({ incentiveStats }) => {
        if (incentiveStats.length) hasChildren = true
      })
      return hasChildren
    },
  },
}
</script>

<style lang="scss">
.farm-item {
  display: grid;
  grid-template-columns: 20% 15% 15% 15% 15% 1fr;
  & > * {
    padding: 10px;
  }
}
</style>

<style scoped lang="scss">
.farms-table {
  flex-direction: column;
  background: var(--table-background);
  margin-top: 12px;
  border-radius: 6px;
}
.farm-item {
  display: grid;
  grid-template-columns: 20% 15% 15% 15% 15% 1fr;
  & > * {
    padding: 10px;
  }
}
.table-header {
  color: #909399;
  font-weight: 500;
  font-size: 14px;
}

.add-liquidity {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  ::v-deep {
    .alcor-button .inner {
      font-weight: 500;
      font-size: 16px !important;
    }
  }
}

.auth-only::v-deep {
  .auth-only-button {
    padding: 8px;
    .connect {
      width: auto;
      padding: 12px 18px;
    }
  }
}

.incentive-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--amm-space-1);
  background: var(--table-background) !important;
}

.farms-table::v-deep {
  .el-table__expanded-cell {
    padding: 0 !important;
  }
}

.details-table::v-deep {
  .el-table__cell {
    background: var(--btn-active) !important;
  }
}
.detail-table-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.claim-rewards-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4;
  .stacking-status {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--main-green);
  }
  .the-dot {
    background: var(--main-green);
    width: 4px;
    height: 4px;
    border-radius: 4px;
  }
}

.table-detail-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
}
</style>
