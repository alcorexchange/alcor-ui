<template lang="pug">
//el-table.my-funds(:data='balances' row-class-name='pointer' @row-click='rowClick' style="height: calc(100vh - 5px);overflow: auto;")
el-table.my-funds(:data='balances' row-class-name='pointer' @row-click='rowClick')
  el-table-column(:label="'Token (' + balances.length + ')'", v-if='!isMobile' width=50)
    template(slot-scope='{ row }')
      span {{ row.currency }}
  el-table-column(label='Total Amount', v-if='!isMobile' width=300)
    template(slot-scope='{ row }')
      .d-flex
        span.amount {{ row.amount | commaFloat(4) }}
        span.green.ml-auto (${{ row.usd_value | commaFloat }})
  //el-table-column(label='Available', width='60')
    template.text-success(slot-scope='scope')
      span.text-success(v-if='scope.row.type == "buy"') BUY
      span.text-danger(v-else) SELL
  //el-table-column(label='In orders', v-if='!isMobile')
  //  template(slot-scope='{ row }')
  //    span {{ row.ask | commaFloat }} {{ getAskSymbol(row) }}

  //el-table-column(label='Value in WAX')
  //  template(slot-scope='{ row }')
  //    span {{ row.bid | commaFloat }} {{ getBidSymbol(row) }}

  //el-table-column(label='Manage' align="right")
    template(slot-scope='scope')
      el-button(size="mini" type="text")
        a(:href="monitorTx(scope.row.trx_id)" target="_blank").a-reset view
</template>

<script>
import { mapState } from 'vuex'
import InfiniteLoading from 'vue-infinite-loading'

export default {
  props: ['onlyCurrentPair'],

  components: {
    InfiniteLoading,
  },

  data() {
    return {
      orders: [],
      deals: [],
      skip: 0,
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapState(['user', 'markets_obj']),
    ...mapState('market', ['base_token', 'quote_token', 'id']),

    balances() {
      if (!this.user) return []
      if (!this.user.balances) return []

      return this.user.balances
        .filter((b) => {
          if (this.onlyCurrentPair) {
            if (b.contract == this.base_token.contract || b.contract == this.quote_token.contract) return true

            return false
          }

          return true
        })
        .sort((a, b) => {
          if (a.contract == this.network.baseToken.contract) return -1

          if (a.usd_value > b.usd_value) return -1
          if (a.usd_value < b.usd_value) return 1

          return 0
        })
    }
  },

  watch: {
    user(to, from) {
      if (from == null) {
        this.deals = []
        this.skip = 0

        // Initial fill
        this.infiniteHandler({
          loaded: () => {},
          complete: () => {},
        })
      }
    },
  },

  mounted() {
    // Initial fill
    this.infiniteHandler({
      loaded: () => {},
      complete: () => {},
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
      console.log('try loading')
      if (!this.user || !this.user.name) return
      console.log('start loading')

      const { data: deals } = await this.$axios.get(
        `/account/${this.user.name}/deals`,
        {
          params: {
            limit: 100,
            skip: this.skip,
            market: this.id,
          },
        }
      )

      this.skip += deals.length

      if (deals.length) {
        deals.map((d) => {
          d.type = this.user.name == d.bidder ? 'buy' : 'sell'
          //if ((this.user.name == d.bidder && d.type != 'buymatch') || (this.user.name != d.bidder && d.type == 'buymatch')) [d.ask, d.bid] = [d.bid, d.ask]
          //if ((this.user.name == d.bidder && d.type != 'buymatch')) {
          //if ((this.user.name == d.bidder && d.type != 'buymatch')) {
          //  [d.ask, d.bid] = [d.bid, d.ask]
          //  console.log('change bid/ask', d.ask, d.bid)
          //}
        })

        this.deals.push(...deals)
        $state.loaded()
        console.log('loaded')
      } else {
        $state.complete()
        console.log('complete')
      }
    },
  },
}
</script>

<style lang="scss">
.market-row div {
  font-size: 13px;
}

.my-funds {
  table {
    width: 100% !important;
  }

  .el-table__append-wrapper {
    //overflow: auto;
  }
}
</style>
