<template lang="pug">
// Переделать как табличку element
.deals-history(v-loading='loading')
  .blist
    .ltd.first.d-flex.justify-content-around.mt-1
      span Price ({{ base_token.symbol.name }})
      span Amount ({{ quote_token.symbol.name }})
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
        span {{ deal.bid | commaFloat(3) }}
        span {{ deal.time | moment(timeformat) }}
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: ['timeformat'],
  data() {
    return {
      loading: false,
      deals: [],
    }
  },
  computed: {
    ...mapState('market', ['quote_token', 'base_token', 'id']),
    ...mapState(['network']),
    coloredDeals() {
      // let amArry = this.$store.state.market.deals
      let maxBuy = 0
      let maxSell = 0
      Array.from(this.$store.state.market.deals)
        .sort((a, b) => b.time - a.time)
        .map((h) => {
          if (h.type == 'buymatch') {
            if (h.bid >= maxBuy) {
              maxBuy = h.bid
            }
          }
          if (h.type == 'sellmatch') {
            if (h.bid >= maxSell) {
              maxSell = h.bid
            }
          }
        })
      return Array.from(this.$store.state.market.deals)
        .sort((a, b) => b.time - a.time)
        .map((h) => {
          if (h.type == 'buymatch') {
            if (h.bid == maxBuy) {
              h.cls = 'max-buymatch'
            } else {
              h.cls = 'text-success'
            }
            h.amount = h.bid
          } else {
            if (h.bid == maxSell) {
              h.cls = 'max-sellmatch'
            } else {
              h.cls = 'text-danger'
            }
            h.amount = h.ask
          }
          return h
        })
    },
  },
  methods: {},
}
</script>

<style lang="scss">
.blist a {
  all: unset;
}

.deals-history {
  .orders-list {
    height: calc(100% - 28px);
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
