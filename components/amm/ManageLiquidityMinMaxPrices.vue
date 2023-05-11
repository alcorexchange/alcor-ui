<template lang="pug">
.d-flex.gap-8
  InputStepCounter.flex-1(:readOnly='true', :value='leftPrice')
    template(#top)
      .fs-12.text-center Min Price
    .fs-12.text-center {{ tokenB.symbol }} per {{ tokenA.symbol }}
    .fs-12.text-center.disable Your position 100% composed of {{ tokenA.symbol }} at this price
  InputStepCounter.flex-1(:readOnly='true', :value='rightPrice')
    template(#top)
      .fs-12.text-center Max Price
    .fs-12.text-center {{ tokenB.symbol }} per {{ tokenA.symbol }}
    .fs-12.text-center.disable Your position 100% composed of {{ tokenB.symbol }} at this price
</template>

<script>
// TODO Composed percents
import InputStepCounter from '~/components/amm/InputStepCounter'
export default {
  name: 'ManageLiquidityMinMaxPrices',
  components: { InputStepCounter },
  props: ['priceLower', 'priceUpper', 'tokensInverted', 'position', 'ticksAtLimit'],

  computed: {
    tokenA() {
      return this.tokensInverted ? this.position.pool.tokenB : this.position.pool.tokenA
    },

    tokenB() {
      return this.tokensInverted ? this.position.pool.tokenA : this.position.pool.tokenB
    },

    leftPrice() {
      const { tokensInverted, ticksAtLimit, priceLower } = this
      const price = tokensInverted ? priceLower.invert() : priceLower

      return ticksAtLimit.LOWER ? '0' : price?.toSignificant(5) ?? ''
    },

    rightPrice() {
      const { tokensInverted, ticksAtLimit, priceUpper } = this
      const price = tokensInverted ? priceUpper.invert() : priceUpper

      return ticksAtLimit.LOWER ? '∞' : price?.toSignificant(5) ?? ''
    },
  },
}
</script>

<style scoped lang="scss">
.flex-1{
  flex: 1;
}
</style>
