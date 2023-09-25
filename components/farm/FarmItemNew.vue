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
      .icon-and-value
        TokenImage(:src="$tokenLogo(firstIncentive.reward.quantity.split(' ')[1], firstIncentive.reward.contract)" width="14px" height="14px")
        span {{ firstIncentive.reward.quantity }}

      .icon-and-value(v-if="secondIncentive")
        TokenImage(:src="$tokenLogo(secondIncentive.reward.quantity.split(' ')[1], secondIncentive.reward.contract)" width="14px" height="14px")
        span {{ secondIncentive.reward.quantity }}

      .minimized(v-if="minimizedIncentives")
        .icons
          TokenImage.icon(v-for="token in minimizedIncentives.icons" :src="$tokenLogo(token.symbol, token.contract)" width="12px" height="12px")
        .text {{ minimizedIncentives.text }}
    .daily-rewards-section
      .icon-and-value
        TokenImage(:src="$tokenLogo(firstIncentive.reward.quantity.split(' ')[1], firstIncentive.reward.contract)" width="14px" height="14px")
        span {{ firstIncentive.rewardPerDay }} {{ firstIncentive.reward.quantity.split(' ')[1] }}

      .icon-and-value(v-if="secondIncentive")
        TokenImage(:src="$tokenLogo(secondIncentive.reward.quantity.split(' ')[1], secondIncentive.reward.contract)" width="14px" height="14px")
        span {{ secondIncentive.rewardPerDay }}

      .minimized(v-if="minimizedIncentives")
        .icons
          TokenImage.icon(v-for="token in minimizedIncentives.icons" :src="$tokenLogo(token.symbol, token.contract)" width="12px" height="12px")
        .text {{ minimizedIncentives.text }}

    .remaining-time-section
      .icon-and-value
        TokenImage(:src="$tokenLogo(firstIncentive.reward.quantity.split(' ')[1], firstIncentive.reward.contract)" width="14px" height="14px")
        span {{ firstIncentive.daysRemain }} Days

      .icon-and-value(v-if="secondIncentive")
        TokenImage(:src="$tokenLogo(secondIncentive.reward.quantity.split(' ')[1], secondIncentive.reward.contract)" width="14px" height="14px")
        span {{ secondIncentive.daysRemain }} Days

      .minimized(v-if="minimizedIncentives")
        .icons
          TokenImage.icon(v-for="token in minimizedIncentives.icons" :src="$tokenLogo(token.symbol, token.contract)" width="12px" height="12px")
        .text {{ minimizedIncentives.text }}

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
    firstIncentive() {
      return this.farm.incentives[0]
    },
    shouldMinimize() {
      return this.farm.incentives.length > 2
    },
    secondIncentive() {
      return this.shouldMinimize ? undefined : this.farm.incentives[1]
    },

    minimizedIncentives() {
      if (!this.shouldMinimize) return undefined
      const [first, ...rest] = this.farm.incentives
      const icons = rest.map((incentive) => ({
        symbol: incentive.reward.quantity.split(' ')[1],
        contract: incentive.reward.contract,
      }))
      return {
        count: rest.length,
        text: `+${rest.length} more`,
        icons,
      }
    },

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
