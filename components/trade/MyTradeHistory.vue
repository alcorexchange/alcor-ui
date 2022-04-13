<template lang="pug">
el-table.my-trade-history(
  :data='deals',
  row-class-name='pointer',
  @row-click='rowClick'
)
  el-table-column(label='Time', v-if='!isMobile')
    template(slot-scope='scope')
      span {{ scope.row.time | moment("YYYY-MM-DD HH:mm") }}
  el-table-column(label='Pair', v-if='!isMobile')
    template(slot-scope='{ row }')
      span {{ row.market_symbol }}
  el-table-column(label='Side', width='60')
    template.text-success(slot-scope='scope')
      span.text-success(v-if='scope.row.type == "buy"') BUY
      span.text-danger(v-else) SELL
  el-table-column(label='Bid', v-if='!isMobile')
    template(slot-scope='{ row }')
      span {{ row.ask | commaFloat }} {{ getAskSymbol(row) }}

  el-table-column(label='Ask')
    template(slot-scope='{ row }')
      span {{ row.bid | commaFloat }} {{ getBidSymbol(row) }}

  el-table-column(label='Price')
    template(slot-scope='scope')
      span {{ scope.row.unit_price | commaFloat(6) }}

  template(slot='append')
    infinite-loading(
      @infinite='infiniteHandler',
      spinner='spiral',
      force-use-infinite-wrapper='.my-trade-history .el-table__body-wrapper'
    )
</template>

<script>
import { mapState } from 'vuex'
import InfiniteLoading from 'vue-infinite-loading'

export default {
  components: {
    InfiniteLoading
  },

  props: ['onlyCurrentPair'],

  data() {
    return {
      orders: [],
      deals: [],
      skip: 0
    }
  },

  computed: {
    ...mapState(['user', 'markets_obj']),
    ...mapState('market', ['base_token', 'quote_token', 'id']),
  },

  watch: {
    user(to, from) {
      if (from == null) {
        this.deals = []
        this.skip = 0

        // Initial fill
        this.infiniteHandler({
          loaded: () => {},
          complete: () => {}
        })
      }
    },

    onlyCurrentPair() {
      this.deals = []
      this.skip = 0

      // Initial fill
      this.infiniteHandler({
        loaded: () => {},
        complete: () => {}
      })
    }
  },

  mounted() {
    // Initial fill
    this.infiniteHandler({
      loaded: () => {},
      complete: () => {}
    })
  },

  methods: {
    rowClick(row) {
      this.openInNewTab(this.monitorTx(row.trx_id))
    },

    getAskSymbol(deal) {
      const market = this.markets_obj[deal.market]

      return deal.type == 'buy'
        ? market.base_token.symbol.name
        : market.quote_token.symbol.name
    },

    getBidSymbol(deal) {
      const market = this.markets_obj[deal.market]

      return deal.type == 'buy'
        ? market.quote_token.symbol.name
        : market.base_token.symbol.name
    },

    async infiniteHandler($state) {
      if (!this.user || !this.user.name) return

      const params = {
        limit: 100,
        skip: this.skip
      }

      if (this.onlyCurrentPair) params.market = this.id

      const { data: deals } = await this.$axios.get(
        `/account/${this.user.name}/deals`,
        { params }
      )

      this.skip += deals.length

      if (deals.length) {
        deals.map((d) => {
          d.type = this.user.name == d.bidder ? 'buy' : 'sell'
          d.market_symbol = this.markets_obj[d.market].symbol
        })

        this.deals.push(...deals)
        $state.loaded()
        console.log('loaded')
      } else {
        $state.complete()
        console.log('complete')
      }
    }
  }
}
</script>

<style lang="scss">
.market-row div {
  font-size: 13px;
}

.my-order-history {
  table {
    width: 100% !important;
  }

  .el-table__append-wrapper {
    //overflow: auto;
  }
}
</style>
