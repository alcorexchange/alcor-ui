<template lang="pug">
.d-flex.gap-8
  InputStepCounter(:readOnly='true', :value='priceLower.toSignificant(5)')
    template(#top)
      .fs-12.text-center Min Price
    .fs-12.text-center {{ pool.tokenA.symbol }} per {{ pool.tokenB.symbol }}
    .fs-12.text-center.disable Your position will be 100% composed of {{ pool.tokenB.symbol }} at this price
  InputStepCounter(:readOnly='true', :value='priceUpper.toSignificant(5)')
    template(#top)
      .fs-12.text-center Max Price
    .fs-12.text-center {{ pool.tokenA.symbol }} per {{ pool.tokenB.symbol }}
    .fs-12.text-center.disable Your position will be 100% composed of {{ pool.tokenB.symbol }} at this price
</template>

<script>
import InputStepCounter from '~/components/amm/InputStepCounter'
export default {
  name: 'ManageLiquidityMinMaxPrices',
  props: ['pool', 'priceLower', 'priceUpper'],
  components: {
    InputStepCounter,
  },
}
</script>

<style>
</style>
