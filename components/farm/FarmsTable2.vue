<template lang="pug">
  el-table(:data="[ 1, 2 ]" class="farms-table" @row-click="onRowClick" row-key="item" ref="table")
    el-table-column(label="Pair" min-width="100%")
      template(slot-scope='{ row }')
        .token-container
          PairIcons(
            :token1="{contract: 'wax.eosio', symbol: 'WAX'}"
            :token2="{contract: 'usdt.wax', symbol: 'WAX'}"
          )
          .token-container-info
            .token-names {{ 'WAX' }}/{{ 'USDT' }}
            .token-contracts.muted {{ 'wax' }}/{{ 'usdt' }}

    el-table-column(label="Total Staked")
      template(slot-scope='{ row }')
        .icon-and-value
          TokenImage(:src="$tokenLogo('wax.eosio', 'WAX')" width="14px" height="14px")
          span {{ '0' }}

        .icon-and-value
          TokenImage(:src="$tokenLogo('wax.eosio', 'WAX')" width="14px" height="14px")
          span {{ '0' }}

    el-table-column(label="APR")
      template(slot-scope='{ row }')
        .icon-and-value(v-for="incentive in 2")
          .apr {{ `${10.00}%` }} TODO

    el-table-column(label="Daily Rewards")
      template(slot-scope='{ row }')
        .icon-and-value(v-for="incentive in 2")
          TokenImage(:src="$tokenLogo('', '')" width="14px" height="14px")
          span {{ 4 }} {{ '' }}

    el-table-column(label="Remaining Time")
      template(slot-scope='{ row }')
        .icon-and-value(v-for="incentive in 2")
          TokenImage(:src="$tokenLogo('', '')" width="14px" height="14px")
          span {{ 4 }} Days

    el-table-column(align="right")
      template(slot-scope='{ row }')
        div(v-for="incentive in 3")
          //- VIEW 1
          AlcorButton(v-if="false" access) Stake
          //- VIEW 2
          .claim-rewards-container(v-else)
            StakingStatus(status="partiallyStaked")
            //AlcorButton(access compact v-if="!noClaim") Claim Rewards

    el-table-column(type="expand")
      template(#default="{row}")
        .incentive-list
          .incentive-item(v-for="x in 2")
            .incentive-header
              .left
                .key-value
                  span.key.muted Daily Reward
                  .icon-and-value
                    TokenImage(:src="$tokenLogo('usdt', 'usdt.alcor')" width="14px" height="14px")
                    span 484.86K
                span.muted •
                .key-value
                  span.muted Remaining Time
                  span 3 Days
              .right
                AlcorButton(access compact @click="") Claim All Rewards
                AlcorButton(access compact @click="") Stake All
                AlcorButton(bordered danger compact @click="") Unstake All
            .incentive-content
              table.fs-14
                thead
                  tr
                    th
                    th Pool Share
                    th Daily Reward
                    th Farmed Reward
                    th
                tbody
                  tr(v-for="x in 2")
                    td #1
                    td 25%
                    td
                      .icon-and-value
                        TokenImage(:src="$tokenLogo('usdt', 'usdt.alcor')" width="14px" height="14px")
                        span 484.86K
                    td
                      .icon-and-value
                        TokenImage(:src="$tokenLogo('usdt', 'usdt.alcor')" width="14px" height="14px")
                        span 484.86K
                    td
                      FarmsTableActions



    //- DETAILS START
    //- el-table-column(type="expand")
      //- VIEW 1
      template(slot-scope='{ row }')
        el-table(:data="getFamrs(row.id)" class="details-table")
          el-table-column(label="PositionID" )
            span {{ row.posId }}
            //.icon-and-value(v-for="x in 2")
              TokenImage(:src="$tokenLogo('usdt', 'usdt.alcor')" width="14px" height="14px")
              span 484.86K
          el-table-column(label="Pool Share")
            template(slot-scope='{ row }')
              span {{ row.userSharePercent }}%
          el-table-column(label="Daily Rewards")
            template(slot-scope='{ row }')
              .icon-and-value
                TokenImage(:src="$tokenLogo(row.incentive.reward.quantity.split(' ')[1], row.incentive.reward.contract)" width="14px" height="14px")
                span {{ row.dailyRewards }}
          el-table-column(label="Your Farmed Rewards")
            template(slot-scope='{ row }')
              .icon-and-value
                TokenImage(:src="$tokenLogo(row.incentive.reward.quantity.split(' ')[1], row.incentive.reward.contract)" width="14px" height="14px")
                span {{ row.farmedReward }}
          el-table-column(align="right" min-width="200px")
            template(slot-scope='{ row }')
              .detail-table-actions
                AlcorButton(access @click="claim(row)") Claim Rewards
                AlcorButton() Manage LP Positions
                AlcorButton(bordered danger) Unstake

</template>

<script>
import PairIcons from '@/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'
import StakingStatus from '~/components/farm/StakingStatus'
import FarmsTableActions from '~/components/farm/FarmsTableActions'
export default {
  name: 'FarmsTable',
  components: {
    PairIcons,
    TokenImage,
    AlcorButton,
    StakingStatus,
    FarmsTableActions,
  },

  props: ['noClaim', 'finished'],

  computed: {
    famPools() {
      console.log(this.$store.getters['farms/farmPools'])
      return this.$store.getters['farms/farmPools']
    },
  },

  methods: {
    getFamrs(poolId) {
      const stakes = this.$store.state.farms.userStakes

      return stakes.filter((s) => s.pool == poolId)
    },

    async claim(stake) {
      await this.$store.dispatch('farms/getReward', stake)
    },

    onRowClick(row, col) {
      console.log(row, col)
      this.$refs.table.toggleRowExpansion(row)
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

.key-value {
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon-and-value {
  display: flex;
  align-items: center;
  gap: 4px;
  span {
    font-size: 0.8rem;
  }
}

.incentive-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--amm-space-1);
  background: var(--table-background) !important;
}

.incentive-item {
  border-radius: var(--radius);
  padding: var(--amm-space-1);
  border: 1px solid var(--border-color);
}

.incentive-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 6px;
  .left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .right {
    display: flex;
    align-items: center;
    gap: 4px;
    // ::v-deep {
    //   .access {
    //     color: var(--main-green) !important;
    //   }
    // }
  }
}

.incentive-content {
  table {
    width: 100%;
    th,
    td {
      padding: 2px 0;
      border-bottom: none;
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
    }
  }
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
