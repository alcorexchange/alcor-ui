<template lang="pug">
.analytics-pool-header.mb-3
  .start
    ReturnLink.return-link.p-2
    .name-and-image
      PairIcons.pair-icons(
        size="22"
        offset="20%"
        :token1="{contract: pool.tokenA.contract, symbol: pool.tokenA.symbol}"
        :token2="{contract: pool.tokenB.contract, symbol: pool.tokenB.symbol}"
      )
      .name.fs-32 {{ pool.tokenA.symbol }} / {{ pool.tokenB.symbol }}
    Tag.ml-1 {{ pool.fee / 10000 }}%
  .end
    AlcorButton(tag="nuxt-link" to="/swap") Swap
    AlcorButton(tag="nuxt-link" to="/markets") Trade on Spot
    AlcorButton(tag="nuxt-link" to="/positions/new") Add Liquidity
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
import PairIcons from '@/components/PairIcons'
import Tag from '~/components/elements/Tag.vue'
import ReturnLink from '~/components/ReturnLink.vue'
export default {
  name: 'AnalyticsTokenHeader',

  props: ['pool'],

  components: {
    AlcorButton,
    PairIcons,
    ReturnLink,
    Tag,
  },
}
</script>

<style scoped lang="scss">
.analytics-pool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.start {
  display: flex;
  gap: 8px;
  align-items: center;
  .name-and-image {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .contract {
    color: var(--text-disable);
    margin: 0 4px;
  }
  .name,
  .price {
    line-height: 1.2;
  }
}
.end {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
