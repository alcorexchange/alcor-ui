<template lang="pug">
  el-table(:data="farmPools" class="farms-table" row-key="id" ref="table" @row-click="onRowClick" @expand-change="onExpand" row-class-name="pointer")
    el-table-column(label="Pair" min-width="100%")
      template(slot-scope='{ row }')
        .token-container
          PairIcons(
            :token1="{contract: row.tokenA.contract, symbol: row.tokenA.quantity.split(' ')[1]}"
            :token2="{contract: row.tokenB.contract, symbol: row.tokenB.quantity.split(' ')[1]}"
          )
          .token-container-info
            .token-names {{ row.tokenA.quantity.split(' ')[1] }}/{{ row.tokenB.quantity.split(' ')[1] }}
            .token-contracts.muted {{ row.tokenA.contract }}/{{ row.tokenB.contract }}

    el-table-column(label="Total Staked")
      template(slot-scope='{ row }')
        .icon-and-value
          TokenImage(:src="$tokenLogo(row.tokenA.quantity.split(' ')[1], row.tokenA.contract)" width="14px" height="14px")
          span {{ row.tokenA.quantity }}

        .icon-and-value
          TokenImage(:src="$tokenLogo(row.tokenB.quantity.split(' ')[1], row.tokenB.contract)" width="14px" height="14px")
          span {{ row.tokenB.quantity }}

    // TODO APR
    el-table-column(label="Total Reward")
      template(slot-scope='{ row }')
        .icon-and-value(v-for="incentive in row.incentives")
          TokenImage(:src="$tokenLogo(incentive.reward.quantity.split(' ')[1], incentive.reward.contract)" width="14px" height="14px")
          .apr {{ incentive.reward.quantity }}

    el-table-column(label="Daily Rewards")
      template(slot-scope='{ row }')
        .icon-and-value(v-for="incentive in row.incentives")
          TokenImage(:src="$tokenLogo(incentive.reward.quantity.split(' ')[1], incentive.reward.contract)" width="14px" height="14px")
          span {{ incentive.rewardPerDay }} {{ incentive.reward.quantity.split(' ')[1] }}

    el-table-column(label="Remaining Time")
      template(slot-scope='{ row }')
        .icon-and-value(v-for="incentive in row.incentives")
          TokenImage(:src="$tokenLogo(incentive.reward.quantity.split(' ')[1], incentive.reward.contract)" width="14px" height="14px")
          span {{ incentive.daysRemain }} Days

    el-table-column(align="right")
      template(slot-scope='{ row }')
        div(v-for="incentive in row.incentives")
          .claim-rewards-container(v-if="$store.state.user")
            StakingStatus(:status="incentive.stakeStatus" :finished="finished")
            //AlcorButton(access compact v-if="!noClaim") Claim Rewards

    el-table-column(type="expand")
      template(slot-scope='{ row }')
        AuthOnly.auth-only
          .incentive-list(v-if="hasPosition(row.incentives)")
            // TODO Make it separete computed to make it reactive
            // FIXME: MAY BE WE DO NOT NEED IT HERE
            //.incentive-item(v-for="incentive in userStakes")
            IncentiveItem(v-for="incentive in row.incentives" :incentive="incentive" :poolFee="row.fee" :finished="finished" @stakeAll="stakeAll" @claimAll="claimAll" @unstakeAll="unstakeAll")
              template(#actions="{ stat }")
                FarmsTableActions(:row="stat" :staked="stat.staked" :finished="finished" @stake="stake" @claim="claim" @unstake="unstake")
          .add-liquidity(v-else)
            AlcorButton(access @click="addLiquidity(row)") Add Liquidity

</template>

<script>
import PairIcons from '@/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'
import StakingStatus from '~/components/farm/StakingStatus'
import FarmsTableActions from '~/components/farm/FarmsTableActions'
import IncentiveItem from '~/components/farm/IncentiveItem.vue'
import AuthOnly from '~/components/AuthOnly.vue'
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
      await this.$store.dispatch('farms/stakeAction', {
        stakes,
        action: 'getreward',
      })
      setTimeout(
        () => this.$store.dispatch('farms/updateStakesAfterAction'),
        500
      )
    },

    async stakeAll(incentive) {
      const stakes = incentive.incentiveStats.filter((i) => !i.staked)
      await this.$store.dispatch('farms/stakeAction', {
        stakes,
        action: 'stake',
      })
      setTimeout(
        () => this.$store.dispatch('farms/updateStakesAfterAction'),
        500
      )
    },

    async unstakeAll(incentive) {
      const stakes = incentive.incentiveStats.filter((i) => i.staked)
      await this.$store.dispatch('farms/stakeAction', {
        stakes,
        action: 'unstake',
      })
      setTimeout(
        () => this.$store.dispatch('farms/updateStakesAfterAction'),
        500
      )
    },

    async claim(stake) {
      await this.$store.dispatch('farms/stakeAction', {
        stakes: [stake],
        action: 'getreward',
      })
      setTimeout(
        () => this.$store.dispatch('farms/updateStakesAfterAction'),
        500
      )
    },

    async unstake(stake) {
      await this.$store.dispatch('farms/stakeAction', {
        stakes: [stake],
        action: 'unstake',
      })
      setTimeout(
        () => this.$store.dispatch('farms/updateStakesAfterAction'),
        500
      )
    },

    async stake(stake) {
      await this.$store.dispatch('farms/stakeAction', {
        stakes: [stake],
        action: 'stake',
      })
      setTimeout(
        () => this.$store.dispatch('farms/updateStakesAfterAction'),
        1000
      )
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

<style scoped lang="scss">
.token-container {
  margin-left: 10px;
  display: flex;
  gap: 12px;
  align-items: center;
}
.token-container-info {
  display: flex;
  flex-direction: column;
  // gap: 8px;
  .token-contracts {
    font-size: 0.8rem;
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
