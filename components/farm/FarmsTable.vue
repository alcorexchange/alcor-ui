<template lang="pug">
  el-table(:data="famPools" class="farms-table")
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

    el-table-column(label="APR")
      template(slot-scope='{ row }')
        .icon-and-value(v-for="incentive in row.incentives")
          .apr {{ `${10.00}%` }} TODO

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
          AlcorButton(v-if="false" access) Stake
          //- VIEW 2
          .claim-rewards-container(v-else)
            StakingStatus
            //AlcorButton(access compact v-if="!noClaim") Claim Rewards

    //- DETAILS START
    el-table-column(type="expand")
      //- VIEW 1
      el-table(:data="[0]" class="details-table")
        el-table-column(label="Your Stake" )
          .icon-and-value(v-for="x in 2")
            TokenImage(:src="$tokenLogo('usdt', 'usdt.alcor')" width="14px" height="14px")
            span 484.86K
        el-table-column(label="Pool Share")
          span 0.84%
        el-table-column(label="Daily Rewards")
          .icon-and-value(v-for="x in 2")
            TokenImage(:src="$tokenLogo('usdt', 'usdt.alcor')" width="14px" height="14px")
            span 484.86K
        el-table-column(label="Your Farmed Rewards")
          .icon-and-value(v-for="x in 2")
            TokenImage(:src="$tokenLogo('usdt', 'usdt.alcor')" width="14px" height="14px")
            span 484.86K
        el-table-column(align="right" min-width="200px")
          .detail-table-actions
            AlcorButton(access) Claim Rewards
            AlcorButton() Manage LP Positions
            AlcorButton(bordered danger) Unstake

      //- VIEW 2
      .table-detail-container(v-if="false")
        AlcorButton(access) Add Liquidity to Stake In This Farm

      //- VIEW 3
      .table-detail-container(v-if="false")
        AlcorButton(access bordered style="color: var(--main-green)") You have existing LP Positions and can stake them in this farm

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

  props: ['noClaim'],

  computed: {
    famPools() {
      console.log(this.$store.getters['farms/farmPools'])
      return this.$store.getters['farms/farmPools']
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
