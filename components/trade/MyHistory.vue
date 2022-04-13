<template lang="pug">
el-table.my-order-history(v-if='sorted_asks', :data='deals', max-height='245')
  el-table-column(label='Time', v-if='!isMobile')
    template(slot-scope='scope')
      span {{ scope.row.time | moment("YYYY-MM-DD HH:mm") }}
  el-table-column(label='Pair', v-if='!isMobile')
    template(slot-scope='scope')
      span {{ quote_token.symbol.name }}/{{ base_token.symbol.name }}
  el-table-column(label='Side', width='60')
    template.text-success(slot-scope='scope')
      span.text-success(v-if='scope.row.type == "buy"') BUY
      span.text-danger(v-else) SELL
  el-table-column(label='Price')
    template(slot-scope='scope')
      span {{ scope.row.unit_price | commaFloat(6) }}
  el-table-column(label='Amount')
    template(slot-scope='scope')
      span(v-if='scope.row.type == "sell"') {{ getAmount(scope.row.ask, scope.row.type) | humanFloat(quote_token.symbol.precision) }}
      span {{ getAmount(scope.row.bid, scope.row.type) | humanFloat(quote_token.symbol.precision) }}
  el-table-column(label='Total(WAX)')
    template(slot-scope='scope')
      span {{ (scope.row.unit_price * getAmount(scope.row.bid, scope.row.type)) | humanFloat(quote_token.symbol.precision) }}
  el-table-column(label='Status')
    template(slot-scope='scope')
      span.text-success {{ getTokenStatus(scope.row) }}
  el-table-column(label='View Transations', align='right')
    template(slot-scope='scope')
      a(
        size='mini',
        type='text',
        :href='monitorTx(scope.row.trx_id)',
        target='_blank'
      ) View

  //el-table-column(label='Manage' align="right")
    template(slot-scope='scope')
      el-button(size="mini" type="text")
        a(:href="monitorTx(scope.row.trx_id)" target="_blank").a-reset view

  template(slot='append')
    infinite-loading(
      @infinite='infiniteHandler',
      spinner='spiral',
      force-use-infinite-wrapper='.my-order-history .el-table__body-wrapper'
    )
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import InfiniteLoading from 'vue-infinite-loading'
import { trade } from '~/mixins/trade'

export default {
  mixins: [trade],
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
    ...mapState(['network', 'user', 'userOrders']),
    ...mapState(['user', 'markets_obj']),
    ...mapState('market', ['base_token', 'quote_token', 'id', 'deals']),
    ...mapGetters('market', ['price']),
    ...mapGetters(['user']),

    //deals() {
    //  return this.userDeals.filter(d => d.market == this.id)
    //}
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
    getAmount(ask, side) {
      for (const o of this.userOrders.filter((o) => o.market_id !== this.id)) {
        if (ask != parseInt(o.unit_price) && side !== o.type)
          return o.ask.amount
        else return 1111
      }
    },
    getTokenStatus(row) {
      // console.log('tata', row.trx_id, this.markets_obj[row.market], row.market)
      const usermarketid = row.market.id
      const m_deal = this.userOrders.filter((o) => o.market_id == usermarketid)
      if (m_deal.length == 0) return 'Filled'
      else return 'Active'
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
      console.log('skipnext', this.deals)
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

.my-order-history {
  table {
    width: 100% !important;
  }

  .el-table__append-wrapper {
    //overflow: auto;
  }
}
</style>
