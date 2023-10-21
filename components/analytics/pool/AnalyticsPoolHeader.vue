<template lang="pug">
.analytics-pool-header.mb-3
  .start
    ReturnLink.return-link.p-2
    .name-and-image
      PairIcons.pair-icons(
        size="22"
        offset="20%"
        :token1="{contract: 'usdt.alcor', symbol: 'USDT'}"
        :token2="{contract: 'usdt.alcor', symbol: 'USDT'}"
      )
      .name.fs-32 USDT / USDT
    Tag 0.3%
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
