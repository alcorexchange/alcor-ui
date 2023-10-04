<template lang="pug">
.farm-item-container
  .farm-item(@click="onItemClick" :class="{ isExpandable }")
    .token-container
      PairIcons(
        :token1="{contract: farm.tokenA.contract, symbol: farm.tokenA.quantity.split(' ')[1]}"
        :token2="{contract: farm.tokenB.contract, symbol: farm.tokenB.quantity.split(' ')[1]}"
      )
      .token-container-info
        .token-names {{ farm.tokenA.quantity.split(' ')[1] }}/{{ farm.tokenB.quantity.split(' ')[1] }}
        .token-contracts.muted {{ farm.tokenA.contract }}/{{ farm.tokenB.contract }}

    .total-staked-section
      span.mobile-only.muted.fs-14 Total Staked
      .icon-and-value
        TokenImage(:src="$tokenLogo(farm.tokenA.quantity.split(' ')[1], farm.tokenA.contract)" width="14px" height="14px")
        span {{ farm.tokenA.quantity }}

      .icon-and-value
        TokenImage(:src="$tokenLogo(farm.tokenB.quantity.split(' ')[1], farm.tokenB.contract)" width="14px" height="14px")
        span {{ farm.tokenB.quantity }}

    .total-reward-section
      span.mobile-only.muted.fs-14 Total Reward
      .icon-and-value(v-for="item in farm.incentives")
        TokenImage(:src="$tokenLogo(item.reward.quantity.split(' ')[1], item.reward.contract)" width="14px" height="14px")
        span {{ item.reward.quantity }}

    .daily-rewards-section
      span.mobile-only.muted.fs-14 Daily Rewards
      .icon-and-value(v-for="item in farm.incentives")
        TokenImage(:src="$tokenLogo(item.reward.quantity.split(' ')[1], item.reward.contract)" width="14px" height="14px")
        span {{ item.rewardPerDay }} {{ item.reward.quantity.split(' ')[1] }}

    .remaining-time-section
      span.mobile-only.muted.fs-14 Remaining Time
      .icon-and-value(v-for="item in farm.incentives")
        TokenImage(:src="$tokenLogo(item.reward.quantity.split(' ')[1], item.reward.contract)" width="14px" height="14px")
        span {{ item.daysRemain }} Days

    .actions-section
      .statuses.fs-14
        StakingStatus(v-for="incentive in farm.incentives" :status="incentive.stakeStatus" :finished="finished" )
    .detail-toggle-section
      template(v-if="isExpandable")
        span.mobile-only.fs-14.details-text View Details
        .arrow
          i.el-icon-arrow-down
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
      )\
    .add-liquidity(v-if="!finished && !hasPosition")
      AlcorButton(access @click="addLiquidity") Add Liquidity
</template>

<script>
import PairIcons from '@/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'
import StakingStatus from '~/components/farm/StakingStatus'
import FarmsTableActions from '~/components/farm/FarmsTableActions'
import IncentiveItem from '~/components/farm/IncentiveItem.vue'
import AuthOnly from '~/components/AuthOnly.vue'
import FarmItemExpandSimple from '~/components/farm/FarmItemExpandSimple.vue'
import FarmItemExpandAdvanced from '~/components/farm/FarmItemExpandAdvanced.vue'
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
  },

  props: ['farm', 'finished'],

  data: () => {
    return {
      expanded: false,
    }
  },

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
          left:
            this.farm.tokenA.quantity.split(' ')[1].toLowerCase() +
            '-' +
            this.farm.tokenA.contract,
          right:
            this.farm.tokenB.quantity.split(' ')[1].toLowerCase() +
            '-' +
            this.farm.tokenB.contract,
        },
      })
    },

    onItemClick() {
      if (!this.isExpandable) return
      this.expanded = !this.expanded
    },
  },
}
</script>

<style scoped lang="scss">
.farm-item-container {
  &:not(:last-child) {
    border-bottom: 1px solid var(--light-border-color);
  }
}
.farm-item.isExpandable {
  cursor: pointer;
  &:hover {
    background: var(--hover);
  }
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
  .token-contracts {
    font-size: 0.8rem;
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
.detail-toggle-section {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
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

.farm-item-expand {
  background: var(--hover);
  padding: 14px;
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
  justify-content: center;
  padding: 14px;
  ::v-deep {
    .alcor-button .inner {
      font-weight: 500;
      font-size: 16px !important;
    }
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
