<template lang="pug">
.farm-item-container
  .farm-item(@click="onItemClick")
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
        span {{ getAPR(item) }}%

    .total-reward-section
      span.mobile-only.muted.fs-14 Total Reward
      .icon-and-value(v-for="item in farm.incentives")
        TokenImage(:src="$tokenLogo(item.reward.quantity.split(' ')[1], item.reward.contract)" width="14px" height="14px")
        span {{ item.reward.quantity.split(' ')[0] | nFormat(item.reward.symbol.precision) }}
        span.color-grey-thirdly {{ item.reward.quantity.split(' ')[1] }}

    .daily-rewards-section
      span.mobile-only.muted.fs-14 Daily Rewards
      .icon-and-value(v-for="item in farm.incentives")
        //TokenImage(:src="$tokenLogo(item.reward.quantity.split(' ')[1], item.reward.contract)" width="14px" height="14px")
        span {{ item.rewardPerDay | commaFloat(item.reward.symbol.precision) | nFormat(item.reward.symbol.precision) }}
        span.color-grey-thirdly {{ item.reward.symbol.symbol }}

    .remaining-time-section
      span.mobile-only.muted.fs-14 Remaining Time
      .icon-and-value(v-for="item in farm.incentives")
        //- TokenImage(:src="$tokenLogo(item.reward.quantity.split(' ')[1], item.reward.contract)" width="14px" height="14px")
        span {{ item.daysRemain }} Days

    .actions-section
      .statuses.fs-14
    .detail-toggle-section
      .toggle-button(:class="{ expanded }")
        span.fs-14.color-green Details
        i.fs-12(:class="expanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'")
  .farm-item-expand(v-if="expanded")
    OwnedFarmExpand(:farm="farm")
</template>

<script>
import { Big } from 'big.js'

import PairIcons from '@/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'
import Tag from '~/components/elements/Tag.vue'
import OwnedFarmExpand from '~/components/owned-farm/OwnedFarmExpand.vue'

import { assetToAmount } from '~/utils'

export default {
  name: 'FarmsTable',
  components: {
    PairIcons,
    TokenImage,
    AlcorButton,
    OwnedFarmExpand,
    Tag,
  },

  props: ['farm'],

  data: () => {
    return {
      expanded: false,
    }
  },

  computed: {},

  methods: {
    getAPR(incentive) {
      // TODO Move to farms store
      const poolStats = this.farm.poolStats
      if (!poolStats) return null

      const absoluteTotalStaked = assetToAmount(poolStats.tokenA.quantity, poolStats.tokenA.decimals)
        .times(assetToAmount(poolStats.tokenB.quantity, poolStats.tokenB.decimals))
        .sqrt()
        .round(0)

      const stakedPercent = Math.max(
        1,
        Math.min(100, parseFloat(new Big(incentive.totalStakingWeight).div(absoluteTotalStaked.div(100)).toString()))
      )

      const tvlUSD = poolStats.tvlUSD * (stakedPercent / 100)
      const dayRewardInUSD = parseFloat(
        this.$tokenToUSD(parseFloat(incentive.rewardPerDay), incentive.reward.symbol.symbol, incentive.reward.contract)
      )

      return ((dayRewardInUSD / tvlUSD) * 365 * 100).toFixed()
    },

    onItemClick() {
      this.expanded = !this.expanded
    },
  },
}
</script>

<style scoped lang="scss">
.farm-item-container {
  background: var(--table-background);
  border-radius: 8px;
  overflow: hidden;
  &:not(:last-child) {
    border-bottom: 1px solid var(--background-color-base);
  }
}
.farm-item {
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
