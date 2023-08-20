<template lang="pug">
  el-table(:data="[ 0, 0 ]" class="farms-table")
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
            StakingStatus
            //AlcorButton(access compact v-if="!noClaim") Claim Rewards

    el-table-column(type="expand")
      template(#default="{row}")
        div test


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
import StakingStatus from '~/components/farm/StakingStatus.vue'
export default {
  name: 'FarmsTable',
  components: {
    PairIcons,
    TokenImage,
    AlcorButton,
    StakingStatus,
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
