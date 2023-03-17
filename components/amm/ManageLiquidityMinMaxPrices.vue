<template lang="pug">
.d-flex.gap-8
  InputStepCounter.flex-1(:readOnly='true', :value='(tokensInverted ? priceLower.invert() : priceLower).toSignificant(5)')
    template(#top)
      .fs-12.text-center Min Price
    .fs-12.text-center {{ tokenB.symbol }} per {{ tokenA.symbol }}
    .fs-12.text-center.disable Your position {{ composedPercent('w') }}% composed of {{ tokenA.symbol }} at this price
  InputStepCounter.flex-1(:readOnly='true', :value='(tokensInverted ? priceUpper.invert() : priceUpper).toSignificant(5)')
    template(#top)
      .fs-12.text-center Max Price
    .fs-12.text-center {{ tokenB.symbol }} per {{ tokenA.symbol }}
    .fs-12.text-center.disable Your position {{ composedPercent('e') }}% composed of {{ tokenB.symbol }} at this price
</template>

<script>
// TODO Composed percents
import InputStepCounter from '~/components/amm/InputStepCounter'
export default {
  name: 'ManageLiquidityMinMaxPrices',
  components: { InputStepCounter },
  props: ['priceLower', 'priceUpper', 'tokensInverted', 'position', 'composedPercent'],

  computed: {
    tokenA() {
      return this.tokensInverted ? this.position.pool.tokenB : this.position.pool.tokenA
    },

    tokenB() {
      return this.tokensInverted ? this.position.pool.tokenA : this.position.pool.tokenB
    }
  },
}
</script>

<style scoped lang="scss">
.flex-1{
  flex: 1;
}
</style>
