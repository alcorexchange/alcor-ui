<template lang="pug">
.position-fee-and-share.d-flex.flex-column.gap-2.fs-14
  //.item.d-flex
  .item.d-flex.justify-content-between
    .title.disable Estimated Fees (24H) / Fees Share:
    .value ${{ estimatedFees }} / {{ poolShare }}%

    //span
      .title.disable Current Pool Share
      .value 0 %
  //.item.d-flex.justify-content-between
</template>

<script>
import JSBI from 'jsbi'
import { Fraction } from '~/assets/libs/swap-sdk'

export default {
  props: ['pool', 'positionLiquidity'],

  computed: {
    poolFee() {
      return this.position.pool.fee / 10000
    },

    poolShare() {
      const { positionLiquidity, pool } = this

      if (!positionLiquidity || !pool || positionLiquidity == '' || JSBI.equal(pool.liquidity, JSBI.BigInt('0'))) return '0'

      return (parseFloat(new Fraction(JSBI.BigInt(positionLiquidity), JSBI.add(JSBI.BigInt(positionLiquidity), JSBI.BigInt(pool.liquidity))).toFixed(6)) * 100).toFixed(2)
    },

    estimatedFees() {
      const { pool } = this

      if (!pool) return '0.0000'

      const poolStats = this.$store.state.amm.poolsStats.find(p => p.id == pool.id)
      if (!poolStats) return '0.0000'

      const volume24 = poolStats.volumeUSD24 || 0
      const poolFee = pool.fee / 10000

      return (volume24 * (poolFee / 100) * (this.poolShare / 100)).toFixed(4)
    },
  }
}
</script>

<style scoped lang="scss">
</style>
