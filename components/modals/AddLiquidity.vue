<template lang="pug">
.add-liquidity-component
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-4
    i.el-icon-circle-plus-outline
    span Add Liquidity
  .d-flex.justify-content-between.gap-32
    .d-flex.flex-column.gap-8.left
      .fs-14.disable Select Pair and deposit amounts
      token-select(:token.sync='inputToken' :amount.sync="inputAmount")
      .d-flex.justify-content-end Balance: 1,000 WAX

      .fs-14.disable Select Pair and deposit amounts
      token-select(:token.sync='outputToken' :amount.sync="outputAmount")
      .d-flex.justify-content-end Balance: 1,000 WAX

      .fs-14.disable Select Fee
      .d-flex.gap-16
        .fee.d-flex.flex-column.gap-16(v-for="({ value, desc, selectedPercent }, idx) in fees" @click="selectedFee = idx" :class="{ active: selectedFee == idx }")
          .fs-24 {{ value }}
          .fs-14.disable {{ desc }}
          .d-flex.gap-4
            span {{ selectedPercent }}
            span Selected

    .d-flex.flex-column.gap-16
      .fs-14.disable Select Price Range
      .d-flex.gap-8
        .grey-border.d-flex.flex-column.gap-20.p-2.br-4
          .fs-12.text-center Min Price
          el-input-number(v-model="minPrice" :precision="2" :step="0.1" :max="100")
          .fs-12.text-center BLK per WAX
        .grey-border.d-flex.flex-column.gap-20.p-2.br-4
          .fs-12.text-center Max Price
          el-input-number(v-model="maxPrice" :precision="2" :step="0.1" :max="100")
          .fs-12.text-center BLK per WAX
      alcor-button.w-100(@click="openPreviewLiqidityModal" access big) Preview

</template>

<script>
import { mapActions } from 'vuex'
import TokenSelect from '~/components/TokenSelect'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { TokenSelect, AlcorButton },

  data: () => ({
    minPrice: 2.20,
    maxPrice: 12.421,
    selectedFee: 0,
    inRange: true,
    inputToken: {
      symbol: 'BRWL',
      contract: 'brawlertoken'
    },
    inputAmount: 100,
    outputToken: {
      symbol: 'BRWL',
      contract: 'brawlertoken'
    },
    outputAmount: 100,
    fees: [
      { value: 0.05, desc: 'Best forvery high liquidity tokens', selectedPercent: 0 },
      { value: 0.3, desc: 'Best for most pairs', selectedPercent: 44 },
      { value: 1, desc: 'Best for low liqudity pairs', selectedPercent: 56 }
    ]
  }),
  methods: {
    ...mapActions('modal', ['previewLiquidity']),
    openPreviewLiqidityModal() {
      const { outputToken, inputToken, inputAmount, outputAmount, selectedFee, maxPrice, minPrice, fees, inRange } = this

      this.previewLiquidity({
        inputToken,
        outputToken,
        inputAmount,
        outputAmount,
        selectedFee,
        maxPrice,
        minPrice,
        fees,
        inRange
      })
    }
  }
}
</script>

<style lang="scss">
.add-liquidity-component {
  .left {
    width: 587px;
  }

  .fee {
    width: 185px;
    height: 156px;
    padding: 16px 24px;
    cursor: pointer;

    background: rgba(60, 60, 67, 0.36);

    border: 1px solid rgba(120, 120, 135, 0.36);
    border-radius: 4px;

    &.active {
      border: 1px solid #67C23A;
      background: #161617;
    }
  }
}
</style>
