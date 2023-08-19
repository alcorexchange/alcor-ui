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
          AlcorButton(v-if="false" access @click="stake(row)") Stake
          //- VIEW 2
          .claim-rewards-container(v-else)
            span {{ getStakingStatus(incentive) }}
            //StakingStatus
            //AlcorButton(access compact v-if="!noClaim") Claim Rewards

    //- DETAILS START
    el-table-column(type="expand")
      //- VIEW 1
      template(slot-scope='{ row }')
        el-table(:data="getFamrs(row.id)" class="details-table")
          el-table-column(label="PositionID" )
            template(slot-scope='{ row }')
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
                AlcorButton(bordered danger @click="unstake(row)") Unstake

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

  props: ['noClaim', 'finished'],

  computed: {
    famPools() {
      return this.$store.getters['farms/farmPools'].map(p => {
        const incentives = p.incentives.filter(i => i.isFinished == this.finished)

        return { ...p, incentives }
      })
    }
  },

  methods: {
    getFamrs(poolId) {
      const stakes = this.$store.state.farms.userStakes

      const filtered = stakes.filter(s => {
        return s.pool == poolId && s.incentive.isFinished == this.finished
      })

      return filtered
    },

    getStakingStatus(incentive) {
      const stakes = this.getFamrs(incentive.poolId)

      console.log('stakes', stakes)
      //const incentiveIds = row.incentives.map(i => i.id)

      //const statuses = []
      //stakes.forEach(s => statuses.push(incentiveIds.includes(s.incentiveId)))

      ////if (statuses.every(Boolean)) return 'Staking'

      //console.log({ row })
      // console.log({ stakes })
      //console.log({ statuses })

      return 'Staking'
    },

    // TODO Trycatch
    async claim(stake) {
      await this.$store.dispatch('farms/getReward', stake)
      this.$store.dispatch('farms/loadUserFarms', stake)
    },

    async unstake(stake) {
      await this.$store.dispatch('farms/unstake', stake)
      this.$store.dispatch('farms/loadUserFarms', stake)
    },

    async stake(stake) {
      await this.$store.dispatch('farms/stake', stake)
      this.$store.dispatch('farms/loadUserFarms', stake)
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
