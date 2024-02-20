<template lang="pug">
.farm-item-container
  .owned-farm-item(@click="onItemClick")
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

    .detail-toggle-section
      .toggle-button(:class="{ expanded }")
        span.fs-14.color-green Details
        i.fs-12(:class="expanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'")
  .farm-item-expand(v-if="expanded")
    OwnedFarmExpand(:farm="farm" @extend="$emit('extend', $event)")
</template>

<script>
import PairIcons from '@/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'
import Tag from '~/components/elements/Tag.vue'
import OwnedFarmExpand from '~/components/owned-farm/OwnedFarmExpand.vue'

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
.owned-farm-item {
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
