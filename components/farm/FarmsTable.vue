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
          //- VIEW 1
          AlcorButton(v-if="false" access @click="stake(row)") Stake
          //- VIEW 2
          .claim-rewards-container(v-else)
            StakingStatus(:status="incentive.stakeStatus" :finished="finished")
            //AlcorButton(access compact v-if="!noClaim") Claim Rewards

    el-table-column(type="expand")
      template(slot-scope='{ row }')
        .incentive-list
          // TODO Make it separete computed to make it reactive
          // FIXME MAY BE WE DO NOT NEED IT HERE
          //.incentive-item(v-for="incentive in userStakes")
          .incentive-item(v-for="incentive in row.incentives")
            .incentive-header
              .left
                .key-value
                  span.key.muted Daily Reward
                  .icon-and-value
                    TokenImage(:src="$tokenLogo(incentive.reward.quantity.split(' ')[1], incentive.reward.contract)" width="14px" height="14px")
                    span {{ incentive.rewardPerDay }} {{ incentive.reward.quantity.split(' ')[1] }}
                span.muted •
                .key-value
                  span.muted Remaining Time
                  span {{ incentive.daysRemain }} Days
              .right(v-if="incentive.incentiveStats.length > 0")
                AlcorButton(access compact @click="claimAll(incentive)" v-if="!finished") Claim All Rewards
                AlcorButton(access compact @click="stakeAll(incentive)" v-if="!finished") Stake All
                AlcorButton(:class="finished ? 'access' : 'danger bordered'" compact @click="unstakeAll(incentive)") {{ finished ? 'Claim & Unstake All' : 'Unstake All' }}
            .incentive-content
              table.fs-14
                thead
                  tr
                    th Position ID
                    th Pool Share
                    th Your Daily Reward
                    th Farmed Reward
                    th
                tbody
                  template(v-for="stat in incentive.incentiveStats")
                    tr(v-if="stat.staked")
                      td # {{ stat.posId }}
                      td {{ stat.userSharePercent }}%
                      td
                        .icon-and-value
                          TokenImage(:src="$tokenLogo(incentive.reward.quantity.split(' ')[1], incentive.reward.contract)" width="14px" height="14px")
                          span {{ stat.dailyRewards }}
                      td
                        .icon-and-value
                          TokenImage(:src="$tokenLogo(incentive.reward.quantity.split(' ')[1], incentive.reward.contract)" width="14px" height="14px")
                          span {{ stat.farmedReward }}
                      td
                        FarmsTableActions(:row="stat" :staked="true" :finished="finished" @stake="stake" @claim="claim" @unstake="unstake")
                    tr(v-else)
                      td # {{ stat.posId }}
                      td Not Staked
                      td
                      td
                      td
                        FarmsTableActions(:row="stat" :staked="false" :finished="finished" @stake="stake" @claim="claim" @unstake="unstake")

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

  data: () => {
    return {
      extendedRow: null
    }
  },

  computed: {
    farmPools() {
      return this.$store.getters['farms/farmPools'].map(p => {
        const incentives = p.incentives.filter(i => {
          if (this.finished) {
            return i.isFinished && i.stakeStatus != 'notStaked'
          } else {
            return i.isFinished == false
          }
        })
        return { ...p, incentives }
      }).filter(p => p.incentives.length > 0)
    },

    userStakes() {
      // TODO что то теперь состояние стейкед не обновляет
      const pool = this.farmPools.find(fp => fp.id == this.extendedRow.id)

      return pool.incentives
    }
  },

  methods: {
    onRowClick(row) {
      this.$refs.table.toggleRowExpansion(row)
    },

    onExpand(row) {
      this.extendedRow = row
    },

    async claimAll(incentive) {
      const stakes = incentive.incentiveStats.filter(i => i.staked)
      await this.$store.dispatch('farms/stakeAction', { stakes, action: 'getreward' })
      setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
    },

    async stakeAll(incentive) {
      const stakes = incentive.incentiveStats.filter(i => !i.staked)
      await this.$store.dispatch('farms/stakeAction', { stakes, action: 'stake' })
      setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
    },

    async unstakeAll(incentive) {
      const stakes = incentive.incentiveStats.filter(i => i.staked)
      await this.$store.dispatch('farms/stakeAction', { stakes, action: 'unstake' })
      setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
    },

    async claim(stake) {
      await this.$store.dispatch('farms/stakeAction', { stakes: [stake], action: 'getreward' })
      setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
    },

    async unstake(stake) {
      await this.$store.dispatch('farms/stakeAction', { stakes: [stake], action: 'unstake' })
      setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
    },

    async stake(stake) {
      await this.$store.dispatch('farms/stakeAction', { stakes: [stake], action: 'stake' })
      setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 1000)
    }
  }
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
