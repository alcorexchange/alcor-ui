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
      span.text-success(v-if='scope.row.side == "buy"') BUY
      span.text-danger(v-else) SELL
  el-table-column(label='Amount', v-if='!isMobile')
    template(slot-scope='{ row }')
      span {{ row.amount | commaFloat }}

  el-table-column(:label="'Total ( ' + base_token.symbol.name + ' )'")
    template(slot-scope='{ row }')
      span {{ row.total | commaFloat }}

  el-table-column(label='Price' width=100)
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

export default {
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
    ...mapState('market', ['base_token', 'quote_token', 'id'])
  },

  watch: {
    id (to, from) {
      if (to == from) return

      this.reload()
    },

    user(to, from) {
      if (from == null) {
        this.reload()
      }
    },

    onlyCurrentPair() {
      this.reload()
    }
  },

  mounted() {
    this.reload()
  },

  methods: {
    reload() {
      this.deals = []
      this.skip = 0

      // Initial fill
      this.infiniteHandler({
        loaded: () => {},
        complete: () => {}
      })
    },

    rowClick(row) {
      this.openInNewTab(this.monitorTx(row.trx_id))
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
          d.side = this.user.name == d.bidder ? 'buy' : 'sell'
          d.market_symbol = this.markets_obj[d.market].symbol

          d.amount = (d.type == 'sellmatch' ? d.bid : d.ask) + ' ' + this.markets_obj[d.market].quote_token.symbol.name
          d.total = (d.type == 'sellmatch' ? d.ask : d.bid) + ' ' + this.markets_obj[d.market].base_token.symbol.name
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
}
</style>
