<template lang="pug">
div
  AnalyticsSectionHeader.mb-2(:title="title")
    template(#afterTitle)
      el-input.search-input(size='small' placeholder='Search' v-model="search" prefix-icon='el-icon-search')
  div.table-container
    el-table(:data="paginatedPools" @row-click="openPool" row-class-name="pointer").analytics-table.analytics-pools-table
      el-table-column(label="Pool" width="300")
        template(slot-scope='scope')
          nuxt-link.a-reset(:to="'/analytics/pools/' + scope.row.id")
            .token-container
              span.rank # {{ (page - 1) * 10 + scope.$index + 1 }}
              PairIcons.pair-icons(
                size="18"
                :token1="{contract: scope.row.tokenA.contract, symbol: scope.row.tokenA.symbol}"
                :token2="{contract: scope.row.tokenB.contract, symbol: scope.row.tokenB.symbol}"
              )
              span.name {{ scope.row.tokenA.symbol }} / {{ scope.row.tokenB.symbol }}
              span.tag.fs-12 {{ scope.row.fee / 10000 }}%

      el-table-column(label="Liquidity A" minWidth="140")
        template(slot-scope="{row}") {{ row.tokenA.quantity | commaFloat(0) }} {{ row.tokenA.symbol }}

      el-table-column(label="Liquidity B" minWidth="140")
        template(slot-scope="{row}") {{ row.tokenB.quantity | commaFloat(0) }} {{ row.tokenB.symbol }}

      el-table-column(label="Volume 24h" width=150)
        template(slot-scope="{row}") $ {{ row.volumeUSD24 | commaFloat(2) }}

      el-table-column(label="Volume 7D" width=150)
        template(slot-scope="{row}") $ {{ row.volumeUSDWeek | commaFloat(2) }}

      el-table-column(label="Volume 30D")
        template(slot-scope="{row}") $ {{ row.volumeUSDMonth | commaFloat(2) }}

      //- el-table-column(label="TVL")
      //-   template(#default="") $558,001.05
      //- el-table-column(label="Tick/TVL")
      //-   template(#default="") $558,001.05
      //- el-table-column(label="Imp. Volatility")
      //-   template(#default="") $558,001.05
      //- el-table-column(label="IV rank 90d")
      //-   template(#default="") $558,001.05

      //- el-table-column(label="Action" align="right" width="100")
      //-   template(#default="")
      //-     AlcorButton Details
      template(#append)
        .d-flex.justify-content-center.p-2
          el-pagination.pagination(:total="total" :pager-count="5" :page-size="10" layout="prev, pager, next" :current-page.sync="page")
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
import PairIcons from '@/components/PairIcons'
import AnalyticsSectionHeader from '@/components/analytics/AnalyticsSectionHeader'

export default {
  name: 'AnalyticsPoolsTable',
  components: {
    AlcorButton,
    PairIcons,
    AnalyticsSectionHeader,
  },

  props: ['title', 'pools'],

  data: () => ({
    page: 1,
    search: '',
  }),

  computed: {
    total() {
      return this.filteredPools ? this.filteredPools.length : 0
    },

    filteredPools() {
      return this.pools?.filter(({ tokenA, tokenB }) => {
        return `${tokenA.id}${tokenB.id}`.includes(this.search.toLowerCase())
      })
    },

    paginatedPools() {
      const chunk = [...this.filteredPools]
      chunk.sort((a, b) => b.volumeUSDMonth - a.volumeUSDMonth)
      const offset = (this.page - 1) * 10

      return chunk.slice(offset, offset + 10)
    },
  },
  watch: {
    search() {
      this.page = 1
    },
  },

  methods: {
    openPool(row) {
      this.$router.push('/analytics/pools/' + row.id)
    },
  },
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
.search-input {
  width: 100% !important;
  max-width: 280px;
}
.network-img {
  width: 24px;
}
.pair-icons {
  width: 28px !important;
  height: 28px !important;
}
</style>
