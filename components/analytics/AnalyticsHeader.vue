<template lang="pug">
.analytics-header
  .left
  .right
    el-select(v-model="selectedNetwork").select
      el-option(v-for="item in networks" :value="item.id" :label="item.name")
    AlcorButton Swap
    AlcorButton Trade on Spot
    AlcorButton Add Liquidity
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
export default {
  name: 'AnalyticsHeader',
  components: {
    AlcorButton
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
.select::v-deep {
  width: 140px;
  .el-input__inner {
    padding-left: 14px;
  }
}
</style>
