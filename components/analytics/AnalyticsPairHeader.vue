<template lang="pug">
.header-container
  .analytics-pair-header
    .name-and-image
      PairIcons.pair-icons(
        size="24"
        :token1="{contract: 'eosio.token', symbol: 'WAX'}"
        :token2="{contract: 'usdt.alcor', symbol: 'USDT'}"
      )
      .name.fs-32 WAX/USDT
    span.tag.fs-14 0.3%
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
import PairIcons from '@/components/PairIcons'
export default {
  name: 'AnalyticsPairHeader',
  components: {
    AlcorButton,
    PairIcons
  },
}
</script>

<style scoped lang="scss">
.analytics-pair-header {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 0;
  .pair-icons {
    width: 32px !important;
    height: 32px !important;
  }
  .name-and-image {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  // .name {
  //   line-height: 1.2;
  // }
  .tag {
    background: var(--background-color-third);
    padding: 4px 4px;
    border-radius: 4px;
    display: flex;
    line-height: 1rem;
  }
}
</style>
