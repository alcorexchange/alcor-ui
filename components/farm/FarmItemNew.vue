<template lang="pug">
.pb-2
  .farm-item-container
    .farm-item(@click="onItemClick" :class="{ isExpandable }")
      .token-container
        PairIcons(
          :token1="{contract: farm.tokenA.contract, symbol: farm.tokenA.quantity.split(' ')[1]}"
          :token2="{contract: farm.tokenB.contract, symbol: farm.tokenB.quantity.split(' ')[1]}"
        )
        .token-container-info
          .token-names
            span {{ farm.tokenA.quantity.split(' ')[1] }}/{{ farm.tokenB.quantity.split(' ')[1] }}
            Tag {{ farm.fee / 10000 }} %
            //span {{ farm.poolStats.tvlUSD }}
          .fs-12.muted {{ farm.tokenA.contract }}/{{ farm.tokenB.contract }}

      .total-staked-section
        span.mobile-only.muted.fs-14 Total Staked
        .icon-and-value
          //- TokenImage(:src="$tokenLogo(farm.tokenA.quantity.split(' ')[1], farm.tokenA.contract)" width="14px" height="14px")
          span {{ farm.tokenA.quantity.split(' ')[0] | nFormat }}
          span.color-grey-thirdly {{ farm.tokenA.quantity.split(' ')[1] }}

        .icon-and-value
          //- TokenImage(:src="$tokenLogo(farm.tokenB.quantity.split(' ')[1], farm.tokenB.contract)" width="14px" height="14px")
          span {{ farm.tokenB.quantity.split(' ')[0] | nFormat }}
          span.color-grey-thirdly {{ farm.tokenB.quantity.split(' ')[1] }}

      .total-reward-section
        span.mobile-only.muted.fs-14 APR
        .icon-and-value(v-for="item in farm.incentives")
          //- TokenImage(:src="$tokenLogo(item.reward.quantity.split(' ')[1], item.reward.contract)" width="14px" height="14px")
          span {{ item.apr }}%

      .total-reward-section
        span.mobile-only.muted.fs-14 Total Reward
        .icon-and-value(v-for="item in farm.incentives")
          TokenImage(:src="$tokenLogo(item.reward.quantity.split(' ')[1], item.reward.contract)" width="14px" height="14px")
          span {{ item.reward.quantity.split(' ')[0] | nFormat(3) }}
          span.color-grey-thirdly {{ item.reward.quantity.split(' ')[1] }}

      .daily-rewards-section
        span.mobile-only.muted.fs-14 Daily Rewards
        .icon-and-value(v-for="item in farm.incentives")
          //TokenImage(:src="$tokenLogo(item.reward.quantity.split(' ')[1], item.reward.contract)" width="14px" height="14px")
          span {{ item.rewardPerDay | nFormat(3) }}
          span.color-grey-thirdly {{ item.reward.symbol.symbol }}

      .remaining-time-section
        span.mobile-only.muted.fs-14 Remaining Time
        .icon-and-value(v-for="item in farm.incentives")
          //- TokenImage(:src="$tokenLogo(item.reward.quantity.split(' ')[1], item.reward.contract)" width="14px" height="14px")
          span {{ item.daysRemain }} Days

      .actions-section
        .statuses.fs-14
          StakingStatus(v-for="incentive in farm.incentives" :status="incentive.stakeStatus" :finished="finished" )
      .detail-toggle-section
        template(v-if="isExpandable")
          .toggle-button(:class="{ expanded: expanded }")
            span.fs-14.color-green Details
            i.fs-12(:class="expanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'")
    AuthOnly.auth-only.farm-item-expand(v-if="expanded")
      template(v-if="hasPosition")
        FarmItemExpandSimple(
          :farm="farm"
          :finished="finished"
          v-if="$store.state.farms.view === 'SIMPLE'"
          @claimAll="$emit('claimAll', $event)"
          @stakeAll="$emit('stakeAll', $event)"
          @unstakeAll="$emit('unstakeAll', $event)"
        )
        FarmItemExpandAdvanced(
          :farm="farm"
          :finished="finished"
          @claimAll="$emit('claimAll', $event)"
          @stakeAll="$emit('stakeAll', $event)"
          @unstakeAll="$emit('unstakeAll', $event)"
          @claim="$emit('claim', $event)"
          @stake="$emit('stake', $event)"
          @unstake="$emit('unstake', $event)"
          v-else
        )
      .add-liquidity(v-if="!finished && !hasPosition")
        .d-flex.gap-8
          img(src="@/assets/icons/farmer.svg")
          span Establish a Liquidity Pool position to start staking and earning rewards.
        AlcorButton.fw-bold(access @click="addLiquidity") Add Liquidity
</template>

<script>
import { Big } from 'big.js'
// import { IdState } from 'vue-virtual-scroller'

import PairIcons from '@/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'
import StakingStatus from '~/components/farm/StakingStatus'
import FarmsTableActions from '~/components/farm/FarmsTableActions'
import IncentiveItem from '~/components/farm/IncentiveItem.vue'
import AuthOnly from '~/components/AuthOnly.vue'
import FarmItemExpandSimple from '~/components/farm/FarmItemExpandSimple.vue'
import FarmItemExpandAdvanced from '~/components/farm/FarmItemExpandAdvanced.vue'
import Tag from '~/components/elements/Tag.vue'

import { assetToAmount } from '~/utils'

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
    FarmItemExpandSimple,
    FarmItemExpandAdvanced,
    Tag,
  },
  mixins: [
    // IdState({
    //   idProp: (vm) => vm.farm.id,
    // }),
  ],

  props: ['farm', 'finished', 'expanded'],

  // idState() {
  //   return {}
  // },

  computed: {
    hasPosition() {
      let hasChildren = false
      this.farm.incentives.forEach(({ incentiveStats }) => {
        if (incentiveStats.length) hasChildren = true
      })

      return hasChildren
    },

    userStakes() {
      // TODO что то теперь состояние стейкед не обновляет
      const pool = this.farmPools.find((fp) => fp.id == this.extendedRow.id)

      return pool.incentives
    },

    isExpandable() {
      return !this.finished || this.hasPosition
    },
  },

  methods: {
    addLiquidity() {
      this.$router.push({
        path: '/positions/new',
        query: {
          left: this.farm.tokenA.quantity.split(' ')[1].toLowerCase() + '-' + this.farm.tokenA.contract,
          right: this.farm.tokenB.quantity.split(' ')[1].toLowerCase() + '-' + this.farm.tokenB.contract,
        },
      })
    },

    onItemClick() {
      if (!this.isExpandable) return
      this.$emit('expandChange', this.farm.id)
    },
  },
}
</script>

<style scoped lang="scss">
.farm-item-container {
  background: var(--table-background);
  border-radius: 8px;
  overflow: hidden;
  // margin-bottom: 8px;
  &:not(:last-child) {
    border-bottom: 1px solid var(--background-color-base);
  }
}
.farm-item.isExpandable {
  cursor: pointer;
}

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
  .token-names {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.total-reward-section,
.daily-rewards-section,
.remaining-time-section,
.total-staked-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
  align-items: flex-start;
}
.actions-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;

  .statuses {
    display: flex;
    flex-direction: column;
  }
}

.detail-toggle-section {
  display: flex;
  align-items: center;
  .toggle-button {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--btn-active);
    border-radius: 6px;
    padding: 4px;
    &.expanded {
      box-shadow: 0 0 0 1px var(--border-2-color);
    }
  }
}

.farm-item-expand {
  background: var(--hover);
  border-radius: 8px;
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

.add-liquidity {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px;
  .alcor-button {
    margin-left: auto;
  }
}

.mobile-only {
  display: none;
}

@media only screen and (max-width: 900px) {
  .mobile-only {
    display: block;
  }
  .farm-item {
    grid-template-columns: 1fr 1fr;
  }
  .token-container,
  .total-staked-section,
  .detail-toggle-section {
    grid-column: 1 / 3;
  }
  .actions-section {
    align-items: flex-end;
  }

  .detail-toggle-section {
    justify-content: center;
  }
}
</style>

<style lang="scss">
// handle hovering using scroller
.hover .farm-item.isExpandable {
  background: var(--hover);
}
</style>
