<template lang="pug">
.analytics-header
  .left
    AlcorLink(to="/analytics/" exact flat) Overview
    //- AlcorLink(to="/analytics/tokens" flat) Tokens
    //- AlcorLink(to="/analytics/pools" flat) Pools
    //- AlcorLink(to="/analytics/spots" flat) Spot Pairs
  .right
    //- el-select(v-model="selectedNetwork").select
    //-   el-option(v-for="item in networks" :value="item.id" :label="item.name")
    AlcorButton Swap
    AlcorButton Trade on Spot
    AlcorButton Add Liquidity
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
import AlcorLink from '@/components/AlcorLink'
export default {
  name: 'AnalyticsHeader',
  components: {
    AlcorButton,
    AlcorLink
  },
  // Accept urls and list of networks as props
  data: () => ({
    networks: [
      { name: 'All Networks', id: 1 },
      { name: 'WAX', id: 2 },
      { name: 'EOS', id: 3 },
    ],
    selectedNetwork: 1
  })
}
</script>

<style scoped lang="scss">
.analytics-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.left, .right {
  display: flex;
  gap: 10px;
}
.active {
  background: var(--btn-active) !important;
}
.select::v-deep {
  .el-input__inner {
    width: 120px;
    padding-left: 8px;
    height: 32px;
    line-height: 32px;
  }
  .el-input__suffix {
    display: flex;
    align-items: center;
  }
}
</style>
