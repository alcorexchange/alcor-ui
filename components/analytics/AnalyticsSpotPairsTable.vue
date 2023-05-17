<template lang="pug">
el-table(:data="tableData").analytics-table.analytics-spot-pairs-table
  el-table-column(label="Pair" min-width="140")
    template(#default="{ row }")
      .token-container
        span.rank #1
        PairIcons.pair-icons(
          size="18"
          :token1="{contract: row.quote_token.contract, symbol: row.quote_token.symbol.name}"
          :token2="{contract: row.base_token.contract, symbol: row.base_token.symbol.name}"
        )
        span.name {{ row.quote_token.symbol.name }}/{{ row.base_token.symbol.name }}
        span.tag.fs-12 0.3%
  el-table-column(label="Network")
    template(#default="")
      .d-flex.align-items-center.gap-4
        img.network-img(:src="require(`~/assets/icons/${network.name}.png`)")
        span {{ network.name.toUpperCase() }}
  el-table-column(label="Price")
    template(#default="") $558,001.05
  el-table-column(label="Volume 24h")
    template(#default="") $558,001.05
  el-table-column(label="Volume 7d")
    template(#default="") $558,001.05
  el-table-column(label="Spread" width="80")
    template(#default="") 2%
  el-table-column(label="Depth")
    template(#default="") $558,001.05$
  el-table-column(label="Action" align="right" width="80")
    template(#default="")
      AlcorButton Trade
  template(#append)
    .d-flex.justify-content-center.p-2
      el-pagination.pagination(:total="length" :page-size="10" layout="prev, pager, next" :current-page.sync="page" @current-change="$emit('pageChange', $event)")
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
import PairIcons from '@/components/PairIcons'
import { mapState } from 'vuex'
export default {
  name: 'AnalyticsTopTokensTable',
  components: {
    AlcorButton,
    PairIcons
  },
  props: ['tableData', 'length'],
  data: () => ({
    page: 1
  }),
  computed: {
    ...mapState(['network'])
  }
}
</script>

<style scoped lang="scss">
.token-container {
  display: flex;
  align-items: center;
  gap: 8px;
  // white-space: nowrap;
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
