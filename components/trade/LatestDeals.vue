<template lang="pug">
// Переделать как табличку element
.deals-history(v-loading='loading')
  .blist
    //- .ltd.d-flex.justify-content-around
    //-   span
    //-   span.text-muted Latest Deals
    //-   span
    .ltd.d-flex.justify-content-around.mt-1
      span Price ({{ comparison_token }})
      span Amount ({{ unit_token }})
      span Time
  .orders-list.blist
    a(
      v-for='deal in coloredDeals',
      :href='monitorTx(deal.trx_id)',
      target='_blank'
    )
      .ltd.d-flex.justify-content-around.deal-list(:class='deal.cls + "-deal"')
        template(v-if='ctrl_val == 1')
          span(:class='deal.cls') {{ deal.unit_price * ctrl_val }}
          span {{ deal.bid | commaFloat(3) }}
          span {{ deal.time | moment(timeformat) }}
        template(v-else)
          span(:class='deal.cls') {{ (1 / deal.unit_price) | commaFloat(6) }}
          //span {{ deal.bid | humanFloat(base_token.symbol.precision) }}
          span {{ (deal.bid * deal.unit_price * deal.unit_price) | commaFloat(3) }}
          span {{ deal.time | moment(timeformat) }}
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: ['timeformat', 'currenttoken'],
  data() {
    return {
      loading: false,
      deals: [],
      comparison_token: '',
      unit_token: '',
      ctrl_val: 1,
    }
  },
  computed: {
    ...mapState('market', [
      'quote_token',
      'base_token',
      'id',
      'markets_layout',
    ]),
    ...mapState(['network']),
    // ctrl_val: {
    //   get() {
    //     if (this.$store.state.market.ctrl_val != null) {
    //       return this.$store.state.market.ctrl_val
    //     } else {
    //       const defalutcontrolvalue = 1
    //       return defalutcontrolvalue
    //     }
    //   },

    //   set(value) {
    //     this.$store.commit('market/setControlValueForToken', value)
    //   },
    // },
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
  watch: {
    currenttoken(value) {
      if (value == 'Token') {
        this.comparison_token = this.quote_token.symbol.name
        this.unit_token = this.base_token.symbol.name
        this.ctrl_val = 1
      } else {
        this.comparison_token = this.base_token.symbol.name
        this.unit_token = this.quote_token.symbol.name
        this.ctrl_val = 2
      }
    },
    markets_layout(old_val, new_val) {},
  },
  mounted() {
    this.comparison_token = this.quote_token.symbol.name
    this.unit_token = this.base_token.symbol.name
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
