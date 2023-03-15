<template lang="pug">
.d-flex.gap-8
  InputStepCounter.flex-1(:readOnly='true', :value='(tokensInverted ? priceLower.invert() : priceLower).toSignificant(5)')
    template(#top)
      .fs-12.text-center Min Price
    .fs-12.text-center {{ tokenA.symbol }} per {{ tokenB.symbol }}
    .fs-12.text-center.disable Your position {{ getTokenComposedPercent('w') }}% composed of {{ tokenB.symbol }} at this price
  InputStepCounter.flex-1(:readOnly='true', :value='(tokensInverted ? priceUpper.invert() : priceUpper).toSignificant(5)')
    template(#top)
      .fs-12.text-center Max Price
    .fs-12.text-center {{ tokenA.symbol }} per {{ tokenB.symbol }}
    .fs-12.text-center.disable Your position {{ getTokenComposedPercent('b') }}% composed of {{ tokenB.symbol }} at this price
</template>

<script>
// TODO Composed percents
import InputStepCounter from '~/components/amm/InputStepCounter'
export default {
  name: 'ManageLiquidityMinMaxPrices',
  components: { InputStepCounter },
  props: ['priceLower', 'priceUpper', 'tokensInverted', 'position'],

  computed: {
    tokenA() {
      return this.tokensInverted ? this.position.pool.tokenB : this.position.pool.tokenA
    },

    tokenB() {
      return this.tokensInverted ? this.position.pool.tokenA : this.position.pool.tokenB
    }
  },
  methods: {
    getTokenComposedPercent(side) {
      const amountA = parseFloat(this.position.amountA.toFixed())
      const amountB = parseFloat(this.position.amountB.toFixed())
      const total = amountA + amountB

      const aPercent = ((100 * amountA) / total).toFixed(0)
      const bPercent = ((100 * amountB) / total).toFixed(0)

      return side === 'w' ? aPercent : bPercent
    }
  }
}
</script>

<style scoped lang="scss">
.flex-1{
  flex: 1;
}
</style>
