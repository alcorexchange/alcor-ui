<template lang="pug">
.d-flex.flex-column.gap-4
  .d-flex.align-items-center.gap-4
    token-image(:src='$tokenLogo(position.tokenA.symbol, position.tokenB.contract)' height="12")

    .fs-12.earn.d-flex.gap-4
      span {{ position.feesA }}
  .d-flex.align-items-center.gap-4
    token-image(:src='$tokenLogo(position.tokenB.symbol, position.tokenB.contract)' height="12")

    .fs-12.earn.d-flex.gap-4
      span {{ position.feesA }}

</template>

<script>
import TokenImage from '~/components/elements/TokenImage'

export default {
  props: ['position'],
  data: () => ({ fees: {} }),
  components: { TokenImage },
  mounted() {
    this.calcFees()
  },
  methods: {
    async calcFees() {
      // TODO
      // const r = await this.position.getFees()
      // console.log('rrrrr', r)
    },
  }
}
</script>
