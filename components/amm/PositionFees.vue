<template lang="pug">
.d-flex.flex-column
  .d-flex.align-items-center.gap-4
    token-image(:src='$tokenLogo(position.tokenA.symbol, position.tokenA.contract)' height="12")

    .fs-12.earn.d-flex.gap-4
      span {{ position.feesA }}
  .d-flex.align-items-center.gap-4
    token-image(:src='$tokenLogo(position.tokenB.symbol, position.tokenB.contract)' height="12")

    .fs-12.earn.d-flex.gap-4
      span {{ position.feesB }}

</template>

<script>
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: { TokenImage },
  props: ['position'],
}
</script>
