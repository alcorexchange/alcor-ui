<template lang="pug">
.farm-item-container
  .farm-item(@click="onItemClick")
    .token-container
      PairIcons(
        :token1="{contract: farm.tokenA.contract, symbol: farm.tokenA.quantity.split(' ')[1]}"
        :token2="{contract: farm.tokenB.contract, symbol: farm.tokenB.quantity.split(' ')[1]}"
      )
      .token-container-info
        .token-names {{ farm.tokenA.quantity.split(' ')[1] }}/{{ farm.tokenB.quantity.split(' ')[1] }}
        .token-contracts.muted {{ farm.tokenA.contract }}/{{ farm.tokenB.contract }}

    .total-staked-section
      .icon-and-value
        TokenImage(:src="$tokenLogo(farm.tokenA.quantity.split(' ')[1], farm.tokenA.contract)" width="14px" height="14px")
        span {{ farm.tokenA.quantity }}

      .icon-and-value
        TokenImage(:src="$tokenLogo(farm.tokenB.quantity.split(' ')[1], farm.tokenB.contract)" width="14px" height="14px")
        span {{ farm.tokenB.quantity }}

    .total-reward-section
      .icon-and-value(v-for="item in farm.incentives")
        TokenImage(:src="$tokenLogo(item.reward.quantity.split(' ')[1], item.reward.contract)" width="14px" height="14px")
        span {{ item.reward.quantity }}

    .daily-rewards-section
      .icon-and-value(v-for="item in farm.incentives")
        TokenImage(:src="$tokenLogo(item.reward.quantity.split(' ')[1], item.reward.contract)" width="14px" height="14px")
        span {{ item.rewardPerDay }} {{ item.reward.quantity.split(' ')[1] }}

    .remaining-time-section
      .icon-and-value(v-for="item in farm.incentives")
        TokenImage(:src="$tokenLogo(item.reward.quantity.split(' ')[1], item.reward.contract)" width="14px" height="14px")
        span {{ item.daysRemain }} Days

    .actions-section
      .status status here
      .arrow
        i.el-icon-arrow-down
  AuthOnly.auth-only.farm-item-expand(v-if="expanded")
    template(v-if="hasPosition")
      FarmItemExpandSimple(:farm="farm" v-if="$store.state.farms.view === 'SIMPLE'")
      FarmItemExpandAdvanced(:farm="farm" v-else)
    .add-liquidity(v-else)
      AlcorButton(access @click="") Add Liquidity
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

  props: ['farm'],

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

    onItemClick() {
      this.expanded = !this.expanded
    },
  },
}
</script>

<style scoped lang="scss">
.farm-item {
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

.total-staked-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.total-reward-section,
.daily-rewards-section,
.remaining-time-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
  align-items: flex-start;
}

.minimized {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 2px 4px;
  .icons {
    display: flex;
    align-items: center;
    position: relative;
    .icon:not(:first-child) {
      position: relative;
      transform: translateX(-4px);
      z-index: 2;
    }
  }
}
.actions-section {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  .arrow {
    cursor: pointer;
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
</style>
