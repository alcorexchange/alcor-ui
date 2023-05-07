<template lang="pug">
el-table(:data="tableData").analytics-top-token-table
  el-table-column(label="Token")
    template(#default="")
      .token-container
        span.rank #1
        img(src="~/assets/icons/wax.png")
        span.name WAX
  el-table-column(label="Price")
    template(#default="") $558,001.05
  el-table-column(label="Network")
    template(#default="")
      .networks
        img.network(src="~/assets/icons/wax.png" v-for="x in 4")
  el-table-column(label="Swap Volume 24h")
    template(#default="") $558,001.05
  el-table-column(label="Spot Volume 24h")
    template(#default="") $558,001.05
  el-table-column(label="TVL")
    template(#default="") $558,001.05
  el-table-column(label="Action" align="right")
    template(#default="")
      AlcorButton Details
  template(#append)
    .d-flex.justify-content-center.p-2
      el-pagination.pagination(:total="100" :page-size="10" layout="prev, pager, next")
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
export default {
  name: 'AnalyticsTopTokensTable',
  components: {
    AlcorButton
  },
  props: ['tableData'],
}
</script>

<style scoped lang="scss">
.analytics-top-token-table {
  border-radius: 8px;
  ::v-deep th {
    font-weight: 400;
  }
}
.token-container {
  display: flex;
  align-items: center;
  gap: 8px;
  .rank {
    color: var(--text-disable);
  }
}
img {
  width: 24px;
}
.networks {
  display: flex;
  .network {
    border: 1px solid var(--table-background);
    border-radius: 50%;
    &:not(:first-child) {
      margin-left: -8px;
    }
  }
}
.pagination::v-deep li {
  &.active, &:hover {
    color: var(--main-green)
  }
}
</style>
