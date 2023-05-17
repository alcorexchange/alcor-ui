<template lang="pug">
el-table(:data="tableData").analytics-table.analytics-pools-table
  el-table-column(label="Pool" width="160")
    template(#default="")
      .token-container
        span.rank #1
        PairIcons.pair-icons(
          size="18"
          :token1="{contract: 'eosio.token', symbol: 'WAX'}"
          :token2="{contract: 'usdt.alcor', symbol: 'USDT'}"
        )
        span.name WAX
        span.tag.fs-12 0.3%
  el-table-column(label="Network")
    template(#default="")
      .d-flex.align-items-center.gap-4
        img.network-img(src="~/assets/icons/wax.png")
        span WAX
  el-table-column(label="Volume 24h")
    template(#default="") $558,001.05
  el-table-column(label="TVL")
    template(#default="") $558,001.05
  el-table-column(label="Tick/TVL")
    template(#default="") $558,001.05
  el-table-column(label="Imp. Volatility")
    template(#default="") $558,001.05
  el-table-column(label="IV rank 90d")
    template(#default="") $558,001.05
  el-table-column(label="Action" align="right" width="100")
    template(#default="")
      AlcorButton Details
  template(#append)
    .d-flex.justify-content-center.p-2
      el-pagination.pagination(:total="100" :page-size="10" layout="prev, pager, next" v-model="page" @current-change="$emit('pageChange', $event)")
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
import PairIcons from '@/components/PairIcons'
export default {
  name: 'AnalyticsPoolsTable',
  components: {
    AlcorButton,
    PairIcons
  },
  props: ['tableData'],
  data: () => ({
    page: 1
  })
}
</script>

<style scoped lang="scss">
.token-container {
  display: flex;
  align-items: center;
  gap: 8px;
  .rank {
    color: var(--text-disable);
    white-space: nowrap;
  }
  .tag {
    background: var(--background-color-base);
    padding: 2px 4px;
    border-radius: 4px;
    display: flex;
    line-height: 1rem;
  }
}
.network-img {
  width: 24px;
}
.pair-icons {
  width: 28px !important;
  height: 28px !important;
}
</style>
