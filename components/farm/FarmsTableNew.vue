<template lang="pug">
.farms-table
  .table-header.farm-item
    .header-item Pair
    .header-item Total Staked
    .header-item.sortable
      span(@click="toggleSort('apr')") APR
      Sorter(sortBy="apr" :activeSort="{ key: sortKey, route: sortDirection }" @change="handleSort")
    .header-item Total Reward
    .header-item Daily Rewards
    .header-item.sortable
      span(@click="toggleSort('time')") Rem. Time
      Sorter(sortBy="time" :activeSort="{ key: sortKey, route: sortDirection }" @change="handleSort")
    .header-item
    .header-item
  DynamicScroller(ref="scroller" :pageMode="true" class="recycle-scroller table-items" :minItemSize="isMobile ? 410 : 82" listTag="div" :items="sortedItems")
    template(#default="{ item: farm, index, active }")
      DynamicScrollerItem(
        :item="farm"
        :active="active"
        :data-index="index"
        :size-dependencies="[farm.incentives.length, farm.expanded]"
      )
        FarmItemNew(
          :farm="farm"
          :finished="finished"
          @claimAll="claimAll"
          @stakeAll="stakeAll"
          @unstakeAll="unstakeAll"
          @claim="claim"
          @stake="stake"
          @unstake="unstake"
          @expandChange="handleExpandChange"
          :expanded="farm.expanded"
      )
  //- .table-items
  //-   FarmItemNew(
  //-     v-for="farm in sortedItems"
  //-     :key="farm.id"
  //-     :farm="farm"
  //-     :finished="finished"
  //-     @claimAll="claimAll"
  //-     @stakeAll="stakeAll"
  //-     @unstakeAll="unstakeAll"
  //-     @claim="claim"
  //-     @stake="stake"
  //-     @unstake="unstake"
  //-   )
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
import Sorter from '~/components/Sorter.vue'

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
    Sorter,
  },

  props: ['noClaim', 'finished', 'farmPools'],

  data: () => {
    return {
      expandedItems: [],
      sortKey: 'apr',
      sortDirection: null,
    }
  },

  computed: {
    sortedItems() {
      const farms = [
        ...(this.farmPools?.map((item) => ({
          ...item,
          expanded: this.expandedItems.includes(item.id),
        })) || []),
      ]

      const isTimeSort = this.sortKey === 'time'
      const isAprSort = this.sortKey === 'apr'

      if (isAprSort) {
        const aprSorted = farms.sort((a, b) => {
          return b.avgAPR > a.avgAPR ? -1 : 1
        })

        if (this.sortDirection === 1) return aprSorted
        if (this.sortDirection === 0) return aprSorted.reverse()
      }

      if (isTimeSort) {
        const timeSorted = farms.sort((a, b) => {
          const avgA = a.incentives.reduce((sum, incentive) => sum + incentive.daysRemain, 0) / a.incentives.length
          const avgB = b.incentives.reduce((sum, incentive) => sum + incentive.daysRemain, 0) / b.incentives.length

          return avgA - avgB
        })

        if (this.sortDirection === 1) return timeSorted
        if (this.sortDirection === 0) return timeSorted.reverse()
      }

      return this.farmPools.map((item) => ({
        ...item,
        expanded: this.expandedItems.includes(item.id),
      }))
    },
  },

  methods: {
    handleExpandChange(id) {
      if (this.expandedItems.includes(id)) {
        this.expandedItems = this.expandedItems.filter((item) => item !== id)

        // Fix for when item is closed sometimes keeps the gap.
        this.$refs.scroller.forceUpdate()
        return
      }
      this.expandedItems.push(id)
    },
    handleSort(newSort) {
      console.log({ newSort })

      if (this.sortKey == newSort.key && this.sortDirection == newSort.route) {
        this.sortKey = null
        this.sortDirection = null
        return
      }

      this.sortDirection = newSort.route
      this.sortKey = newSort.key
    },

    // Clicking on text instead of arrows
    toggleSort(newKey) {
      if (this.sortKey === newKey) {
        if (this.sortDirection === null) this.sortDirection = 1
        else if (this.sortDirection === 1) this.sortDirection = 0
        else this.sortDirection = null
      } else {
        this.sortKey = newKey
        this.sortDirection = 1
      }
    },

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
  .header-item {
    display: flex;
    align-items: center;
    gap: 4px;
    &.sortable {
      cursor: pointer;
    }
  }
}
.table-header {
  color: #909399;
  font-weight: 500;
  font-size: 14px;
}

// .table-items {
//   display: flex;
//   flex-direction: column;
//   gap: 8px;
// }

.recycle-scroller {
  height: 100%;
}

@media only screen and (max-width: 900px) {
  .table-header {
    display: flex;
    justify-content: flex-end;
    .header-item:not(.all-stake-actions) {
      display: none;
    }
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
