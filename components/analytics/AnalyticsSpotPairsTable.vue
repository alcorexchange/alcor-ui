<template lang="pug">
el-table(:data="spotPairs").analytics-table.analytics-spot-pairs-table
  el-table-column(label="Pair" min-width="140")
    template(#default="{ row }")
      .token-container(v-if="row")
        span.rank #1
        PairIcons.pair-icons(
          size="18"
          :token1="{contract: row.base_token.contract, symbol: row.base_token.symbol.name}"
          :token2="{contract: row.quote_token.contract, symbol: row.quote_token.symbol.name}"
        )
        span.name {{ row.quote_token.symbol.name }}/{{ row.base_token.symbol.name }}
        span.tag.fs-12 0.3%
  el-table-column(label="Price")
    template(slot-scope="{ row }") $ {{ $systemToUSD(row.last_price, 8, 8, row.base_name == 'USDT') }}

  el-table-column(label="Volume 24h")
    template(slot-scope="{row}") $ {{ $systemToUSD(row.volume24) }}
  el-table-column(label="Volume 7d")
    template(slot-scope="{row}") $ {{ $systemToUSD(row.volumeWeek) }}
  el-table-column(label="Volume 30D")
    template(slot-scope="{row}") $ {{ $systemToUSD(row.volumeMonth) }}

  el-table-column(label="Spread" width="80")
    template(slot-scope="{ row: { ask, bid } }") {{ Math.round((ask - bid) / ask * 100 * 100) / 100 }}%

  //- el-table-column(label="Depth")
  //-   template(#default="") $558,001.05$
  //- el-table-column(label="Action" align="right" width="80")
  //-   template(#default="")
  //-     AlcorButton Trade

  template(#append)
    .d-flex.justify-content-center.p-2
      el-pagination.pagination(:total="basePairs.length" :page-size="10" layout="prev, pager, next" :current-page.sync="page")
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

  data: () => ({
    page: 1
  }),

  computed: {
    ...mapState(['network', 'markets']),

    basePairs() {
      return this.markets.filter(
        i => i.base_token.symbol.name == this.network.baseToken.symbol ||
        this.network.USD_TOKEN == i.base_token.str
      ).sort((a, b) => b.volumeMonth - a.volumeMonth)
    },

    spotPairs() {
      const chunk = this.basePairs

      chunk.sort((a, b) => b.volumeUSDMonth - a.volumeUSDMonth)
      const offset = (this.page - 1) * 10

      return chunk.slice(offset, offset + 10)
    }
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
