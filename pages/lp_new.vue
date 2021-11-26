<template lang="pug">
.lp-new
  .main-card.alcor-card
    .card-title Add Liquidity
    .section
      .section-header
        .title Select pair
        .actions
          el-button(type='text', @click='onClearTokens') Clear All
      .pair-select-container
        PairSelectItem.first-pair(
          @click='onSelectToken("firstToken")',
          :token='firstToken'
        )
        PairSelectItem.second-pair(
          @click='onSelectToken("secondToken")',
          :token='secondToken'
        )
    Spacer(low)
    .section(:class='{ deactive: !isSelectPoolActive }')
      .section-header
        .title Select Pool
      .desc Select a pool type based on your preferred liquidity provider fee.
      .pool-select-container
        PoolSelectItem(
          v-model='selectedPool',
          :value='0.05',
          title='0.05% fee',
          description='Test 0.05%'
        )
        PoolSelectItem(
          v-model='selectedPool',
          :value='0.1',
          title='0.1% fee',
          description='Test 0.1%'
        )
        PoolSelectItem(
          v-model='selectedPool',
          :value='1',
          title='1% fee',
          description='Test 1%'
        )
    Spacer(low)
    .section(:class='{ deactive: !isSettingPriceActive }')
      .section-header
        .title Set Price Range
        .actions.range-actions
          .item.first(
            @click='selectedRangeToken = "first"',
            :class='{ active: selectedRangeToken === "first" }'
          ) {{ firstToken.symbol }} price
          .item.second(
            @click='selectedRangeToken = "second"',
            :class='{ active: selectedRangeToken === "second" }'
          ) {{ secondToken.symbol }} price
      .desc Select a pool type based on your preferred liquidity provider fee.Your liquidity will only earn fees when the market price of the pair is within your range.
      .ranges
        PriceRangeItem.max-card(
          title='Max Price',
          :percentage='selectedPool',
          v-model='maxPrice',
          :selectedRangeToken='selectedRangeToken',
          :firstToken='firstToken',
          :secondToken='secondToken'
        )
        PriceRangeItem.min-card(
          title='Min Price',
          :percentage='selectedPool',
          v-model='minPrice',
          :selectedRangeToken='selectedRangeToken',
          :firstToken='firstToken',
          :secondToken='secondToken'
        )
      CurrentPrice(
        price='9999.8',
        :selectedRangeToken='selectedRangeToken',
        :firstToken='firstToken',
        :secondToken='secondToken'
      )
    Spacer(low)
    .section(:class='{ deactive: !isDepositAmountsActive }')
      .section-header
        .title Deposit Amounts
        pre {{firstAmount}}
      DepositAmountItem(v-model='firstAmount', :token='firstToken')
      SSpacer
      DepositAmountItem(v-model='secondAmount', :token='secondToken')
    Spacer(low)
    .submit-container
      AlcorButton.submit(round) Submit Test
  TokenSelectDialog(ref='tokenSelect')
</template>

<script>
import LPCard from '@/components/lp_new/LPCard.vue'
import PairSelectItem from '@/components/lp_new/PairSelectItem.vue'
import PoolSelectItem from '@/components/lp_new/PoolSelectItem.vue'
import PriceRangeItem from '@/components/lp_new/PriceRangeItem.vue'
import CurrentPrice from '@/components/lp_new/CurrentPrice.vue'
import DepositAmountItem from '@/components/lp_new/DepositAmountItem.vue'
import TokenSelectDialog from '@/components/lp_new/TokenSelectDialog.vue'
import AlcorButton from '@/components/AlcorButton.vue'
import Spacer from '@/components/Spacer.vue'
import SSpacer from '@/components/SSpacer.vue'
export default {
  name: 'LPNew',
  components: {
    PairSelectItem,
    PoolSelectItem,
    PriceRangeItem,
    CurrentPrice,
    DepositAmountItem,
    TokenSelectDialog,
    AlcorButton,
    LPCard,
    Spacer,
    SSpacer
  },
  data: () => ({
    selectedRangeToken: 'first',
    firstToken: {},
    secondToken: {},
    selectedPool: 0,
    maxPrice: 0,
    minPrice: 0,
    firstAmount: 0.0,
    secondAmount: 0.0
  }),
  computed: {
    isSelectPoolActive() {
      return this.firstToken.symbol && this.secondToken.symbol
    },
    isSettingPriceActive() {
      return this.isSelectPoolActive && this.selectedPool
    },
    isDepositAmountsActive() {
      return (
        this.isSelectPoolActive &&
        this.isSettingPriceActive &&
        this.minPrice &&
        this.maxPrice &&
        // TODO: This will check whethere the price is valid or not
        true
      )
    }
  },
  methods: {
    onSelectToken(index) {
      this.$refs.tokenSelect.openDialog({
        onSelect: (token) => {
          this[index] = token
        }
      })
    },
    onClearTokens() {
      this.firstToken = {}
      this.secondToken = {}
      this.selectedPool = null
      this.maxPrice = 0.0
      this.minPrice = 0.0
    }
  }
}
</script>

<style scoped lang="scss">
.main-card {
  width: 100%;
  max-width: 480px;
  margin: auto;
  border-radius: var(--radius-2);
  padding: 14px;
  background: var(--bg-big-card);
}
.card-title {
  text-align: center;
}
.section {
  &.deactive {
    opacity: 0.6;
    pointer-events: none;
  }
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.desc {
  opacity: 0.6;
  font-size: 0.9rem;
  margin-bottom: 8px;
}
.pair-select-container {
  display: flex;
  align-items: center;
  > * {
    flex: 1;
  }
  .first-pair {
    margin-right: 4px;
  }
  .second-pair {
    margin-left: 4px;
  }
}
.pool-select-container {
  display: flex;
  > * {
    flex: 1;
    margin: 2px;
  }
}
.range-actions {
  display: flex;
  padding: 2px;
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  .item {
    border-radius: var(--radius);
    padding: 2px 4px;
    font-size: 0.8rem;
    cursor: pointer;
    user-select: none;
    transition: all 0.3s;
    &.second {
      margin-left: 2px;
    }
    &.active {
      background: var(--hover);
    }
  }
}
.ranges {
  display: flex;
  margin-bottom: 16px;
}
.min-card {
  margin-left: 8px;
}
.max-card {
  margin-right: 8px;
}

.submit {
  width: 100%;
}
</style>
