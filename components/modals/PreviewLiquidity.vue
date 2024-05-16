<template lang="pug">
.preview-liquidity-component
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-4
    i.el-icon-circle-plus-outline
    span Confirmation
  .d-flex.justify-content-between.gap-32.w-100
    .d-flex.flex-column.gap-8.w-100
      .fs-14.disable Selected Pair
      .pairs.p-3.d-flex.flex-column.gap-16
        .d-flex.align-items-center.justify-content-between
          .d-flex.align-items-center.gap-4
            token-image(:src="$tokenLogo(context.inputToken.symbol, context.inputToken.contract)" height="25")
            .fs-24.contrast {{ context.inputToken.symbol }}
          .fs-20 {{ context.inputAmount | commaFloat }}
        .d-flex.align-items-center.justify-content-between
          .d-flex.align-items-center.gap-4
            token-image(:src="$tokenLogo(context.outputToken.symbol, context.outputToken.contract)" height="25")
            .fs-24.contrast {{ context.outputToken.symbol }}
          .fs-20 {{ context.outputAmount | commaFloat }}
        .line
        .d-flex.align-items-center.justify-content-between
          .fs-24.contrast Fee Tier
          .d-flex.gap-16
            .tag {{ context.fees[context.selectedFee].selectedPercent }}% Selected
            .fs-20 {{ context.fees[context.selectedFee].value }}%
        .d-flex.align-items-center.justify-content-between
          .fs-24.contrast Range Status
          .fs-20(:class="{ 'color-green': context.inRange }") {{ context.inRange ? 'In Range' : 'Out Range' }}
      .fs-14.disable Selected Range
      .d-flex.gap-16
        .grey-border.d-flex.flex-column.gap-20.p-2.br-4.w-50
          .fs-12.text-center Min Price
          .fs-24.text-center {{ context.minPrice }}
          .fs-12.text-center {{ context.inputToken.symbol }} per {{ context.outputToken.symbol }}
        .grey-border.d-flex.flex-column.gap-20.p-2.br-4.w-50
          .fs-12.text-center Max Price
          .fs-24.text-center {{ context.maxPrice }}
          .fs-12.text-center {{ context.inputToken.symbol }} per {{ context.outputToken.symbol }}
      .grey-border.d-flex.flex-column.gap-20.p-2.br-4.w-100
        .fs-12.text-center Current Price
        .fs-24.text-center 15.8956
        .fs-12.text-center {{ context.inputToken.symbol }} per {{ context.outputToken.symbol }}
  alcor-button.w-100.mt-2(access big) Add Liquidity

</template>

<script>
import { mapState, mapActions } from 'vuex'
import TokenSelect from '~/components/TokenSelect'
import AlcorButton from '~/components/AlcorButton'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: { TokenSelect, AlcorButton, TokenImage },

  data: () => ({
    minPrice: 2.2,
    maxPrice: 12.421,
    selectedFee: 0,
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
      {
        value: 0.05,
        desc: 'Best for very high liquidity tokens',
        selectedPercent: 0
      },
      { value: 0.3, desc: 'Best for most pairs', selectedPercent: 44 },
      { value: 1, desc: 'Best for low liqudity pairs', selectedPercent: 56 }
    ]
  }),
  computed: {
    ...mapState('modal', ['context'])
  },
  methods: {
    ...mapActions('modal', ['previewLiquidity']),
    openAddLiqidityModal() {
      const {
        outputToken,
        inputToken,
        inputAmount,
        outputAmount,
        selectedFee,
        maxPrice,
        minPrice
      } = this

      this.previewLiquidity({
        inputToken,
        outputToken,
        inputAmount,
        outputAmount,
        selectedFee,
        maxPrice,
        minPrice
      })
    }
  }
}
</script>

<style lang="scss">
.preview-liquidity-component {
  width: 518px;
  .pairs {
    background: var(--bg-alter-1);
    border-radius: 4px;
  }
  .line {
    width: 100%;
    height: 1px;
    background-color: var(--border-color);
  }
  .tag {
    border: var(--border-1);
    background: var(--bg-alter-2);
    font-size: 10px;
    line-height: 12px;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
  }
}
</style>
