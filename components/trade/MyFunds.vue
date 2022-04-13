<template lang="pug">
el-table.my-funds(
  :data='deals',
  max-height='245',
  row-class-name='pointer',
  @row-click='rowClick'
)
  el-table-column(label='Token', v-if='!isMobile')
    template(slot-scope='scope')
      span {{ scope.row.time | moment("YYYY-MM-DD HH:mm") }}
  el-table-column(label='Total Amount', v-if='!isMobile')
    template(slot-scope='scope')
      span {{ quote_token.symbol.name }}/{{ base_token.symbol.name }}
  el-table-column(label='Available', width='60')
    template.text-success(slot-scope='scope')
      span.text-success {{ getAvaliableValue() }}
  el-table-column(label='In orders', v-if='!isMobile')
    template(slot-scope='{ row }')
      span {{ row.ask | commaFloat }} {{ getAskSymbol(row) }}

  el-table-column(label='Value in WAX')
    template(slot-scope='{ row }')
      span {{ baseBalance | commaFloat }}

  //el-table-column(label='Manage' align="right")
    template(slot-scope='scope')
      el-button(size="mini" type="text")
        a(:href="monitorTx(scope.row.trx_id)" target="_blank").a-reset view

  template(slot='append')
    infinite-loading(
      @infinite='infiniteHandler',
      spinner='spiral',
      force-use-infinite-wrapper='.my-funds .el-table__body-wrapper'
    )
</template>

<script>
import { mapGetters, mapState } from 'vuex'
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
    ...mapState(['user', 'markets_obj', 'network']),
    ...mapState('market', ['base_token', 'quote_token', 'id']),
    ...mapGetters('market', [
      'baseBalance',
      'tokenBalance',
      'sorted_asks',
      'sorted_bids',
    ]),
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

    getAvaliableValue() {
      console.log('available', this.baseBalance, this.id)

      const available_value = this.baseBalance - this.deals.ask
      return available_value
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
