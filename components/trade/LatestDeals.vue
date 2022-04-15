<template lang="pug">
// Переделать как табличку element
.deals-history(v-loading='loading')
  .blist
    .ltd.first.d-flex.justify-content-around
      span Price ({{ base_token.symbol.name }})
      span Amount ({{ (timesAndSales[id] || {}).showQuote ? base_token.symbol.name : quote_token.symbol.name }})
      span Time
  .orders-list.blist
    a(
      v-for='deal in coloredDeals',
      :href='monitorTx(deal.trx_id)',
      target='_blank'
    )
      .ltd.d-flex.justify-content-around.deal-list(:class='deal.cls + "-deal"')
        span(:class='deal.cls') {{ deal.unit_price }}
        //span {{ deal.bid | humanFloat(base_token.symbol.precision) }}
        span {{ showAmount(deal) | commaFloat(3) }}
        span {{ deal.time | moment((timesAndSales[id] || {}).timeformat || 'MM/DD hh:mm:ss') }}
</template>

<script>
import { mapState } from 'vuex'

export default {

  data() {
    return {
      loading: false,
      deals: [],
    }
  },
  computed: {
    ...mapState('market', ['quote_token', 'base_token', 'id']),
    ...mapState('settings', ['timesAndSales']),
    ...mapState(['network']),
    coloredDeals() {
      const maxBid = (this.timesAndSales[this.id] || {})[this.base_token.symbol.name] || null
      const maxAsk = (this.timesAndSales[this.id] || {})[this.quote_token.symbol.name] || null

      return Array.from(this.$store.state.market.deals)
        .sort((a, b) => b.time - a.time)
        .map((h) => {
          if (h.type == 'buymatch') {
            if ((maxBid && h.bid >= maxBid) || (maxAsk && h.ask >= maxAsk)) {
              h.cls = 'max-buymatch'
            } else {
              h.cls = 'green'
            }
            h.amount = h.bid
          } else {
            if ((maxAsk && h.bid >= maxAsk) || (maxBid && h.ask >= maxBid)) {
              h.cls = 'max-sellmatch'
            } else {
              h.cls = 'red'
            }
            h.amount = h.ask
          }
          return h
        })
    }
  },

  methods: {
    showAmount(deal) {
      if ((this.timesAndSales[this.id] || {}).showQuote || false) {
        return deal.type == 'sellmatch' ? deal.ask : deal.bid
      } else {
        return deal.type == 'sellmatch' ? deal.bid : deal.ask
      }
    }
  }
}
</script>

<style lang="scss">
.blist a {
  all: unset;
}

.deals-history {
  height: 100%;

  .orders-list {
    overflow: auto;
    height: calc(100% - 53px);
  }
}

.time-sale {
  .el-tabs__content {
    height: calc(100% - 55px);
  }
  .el-tab-pane {
    height: 100%;
  }
  .deals-history {
    height: 100%;
  }
}
</style>
