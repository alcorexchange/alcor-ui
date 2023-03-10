<template lang="pug">
.d-flex.flex-column.gap-4
  .d-flex.align-items-center.gap-4
    token-image(:src='$tokenLogo(position.pool.tokenA.symbol, position.pool.tokenB.contract)' height="12")

    .fs-12.earn.d-flex.gap-4
      span 222
      span {{ position.pool.tokenA.symbol }}
  .d-flex.align-items-center.gap-4
    token-image(:src='$tokenLogo(position.pool.tokenB.symbol, position.pool.tokenB.contract)' height="12")

    .fs-12.earn.d-flex.gap-4
      span {{ fees }}
      span {{ position.pool.tokenB.symbol }}

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
