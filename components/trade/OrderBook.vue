<template lang="pug">
.order-book
  // https://v3.vuejs.org/guide/transitions-list.html#list-entering-leaving-transitions
  .blist
    .ltd.d-flex.justify-content-around
      span Price ({{ base_token.symbol.name }})
      span Amount ({{ quote_token.symbol.name }})
      span(v-if='!isMobile') Total ({{ base_token.symbol.name }})

  .orders-list.blist.asks(ref='asks')
    .ltd.d-flex.text-danger(
      v-for='ask in sorted_asks',
      @click='setBid(ask)',
      :class="{ 'pl-0': isMyOrder(ask, 'sell') }"
    )
      span
        i.el-icon-caret-right(v-if="isMyOrder(ask, 'sell')")
        | {{ ask[0] | humanPrice }}
      span(:class='isMobile ? "text-right" : "text-center"') {{ ask[1] | humanFloat(quote_token.symbol.precision) }}
      span(v-if='!isMobile') {{ ask[2] | humanFloat(base_token.symbol.precision) }}

    .ltd.d-flex.justify-content-around(v-if='sorted_asks.length == 0')
      span
      span No asks
      span

  .p-1.mt-1(v-loading='loading')
    .overflowbox.latest-price
      .price.small(
        :class='{ red: isLastTradeSell }')
        i(
          :class='`el-icon-caret-${isLastTradeSell ? "bottom" : "top"}`',
        )
        span.num  {{ price }} &nbsp;
        //span.token {{ base_token.symbol.name }}
      el-tooltip(class="item" effect="dark" content="Spread" placement="top-end")
        .spread
          span.num {{ getSpreadNum ? getSpreadNum : '0.00' | humanPrice(6) }}
          span(
            class="prec"
            :class="percentWarn"
          )
            span.parant  (
            span {{ getSpreadPercent ? getSpreadPercent : '0.00' }}%
            span.parant )
  .orders-list.blist.bids
    .ltd.d-flex.text-success(
      v-for='bid in sorted_bids',
      @click='setAsk(bid)',
      :class="{ 'pl-0': isMyOrder(bid, 'buy') }"
    )
      span
        i.el-icon-caret-right(v-if="isMyOrder(bid, 'buy')")
        | {{ bid[0] | humanPrice }}
      span(:class='isMobile ? "text-right" : "text-center"') {{ bid[2] | humanFloat(quote_token.symbol.precision) }}

      span(v-if='!isMobile') {{ bid[1] | humanFloat(base_token.symbol.precision) }}

    .ltd.d-flex.justify-content-around(v-if='sorted_bids.length == 0')
      span
      span No bids
      span
</template>

<script>
//import { find } from 'lodash/fp'

import { mapGetters, mapState } from 'vuex'
import { trade } from '~/mixins/trade'

export default {
  mixins: [trade],

  data() {
    return {
      bids: [],
      asks: [],

      asksL: 0,
      loading: false
    }
  },

  computed: {
    ...mapState(['network', 'user', 'userOrders']),
    ...mapGetters('market', ['price']),
    ...mapState('market', ['quote_token', 'base_token', 'id', 'deals']),
    ...mapGetters(['user']),

    isLastTradeSell() {
      return this.deals.length > 0 && this.deals[0].type === 'sellmatch'
    },

    percentWarn() {
      return this.getSpreadPercent > 5 ? 'warn' : ''
    }
  },

  methods: {
    isMyOrder(ask, side) {
      for (const o of this.userOrders.filter((o) => o.market_id == this.id)) {
        if (ask[0] == parseInt(o.unit_price) && side == o.type) return true
      }

      return false
    },

    setBid(ask) {
      const price = this.$options.filters.humanPrice(ask[0]).replaceAll(',', '')

      const amount = this.$options.filters
        .humanFloat(ask[1], this.quote_token.symbol.precision)
        .replaceAll(',', '')

      this.$nuxt.$emit('setPrice', price)
      this.$nuxt.$emit('setAmount', amount)

      // Price and amount for marked moved to VUEX
      this.setPrecisionPrice(price)
      this.changeAmount({ amount, type: 'buy' })
      this.changeAmount({ amount, type: 'sell' })
    },

    setAsk(bid) {
      const price = this.$options.filters.humanPrice(bid[0]).replaceAll(',', '')

      const amount = this.$options.filters
        .humanFloat(bid[2], this.quote_token.symbol.precision)
        .replaceAll(',', '')

      this.$nuxt.$emit('setPrice', price)
      this.$nuxt.$emit('setAmount', amount)

      // Price and amount for marked moved to VUEX
      this.setPrecisionPrice(price)
      this.changeAmount({ amount, type: 'buy' })
      this.changeAmount({ amount, type: 'sell' })
    }
  }
}
</script>

<style lang="scss">
.order-book {
  max-height: 500px;
  .latest-price {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    font-weight: bold;
    padding: 4px;
    align-items: center;
    .price {
      color: var(--main-green);
      &.red {
        color: var(--main-red);
      }
    }
    .spread {
      font-size: 0.8rem;
      font-weight: normal;
      color: #80a1c5;
      .prec.warn {
        color: var(--main-red);
      }
    }
    @media (max-width: 1180px) {
      .spread {
        display: flex;
        flex-direction: column-reverse;
        align-items: flex-end;
        .num {
          font-size: 0.7rem;
        }
        .parant {
          display: none;
        }
      }
    }
    // @media (max-width: 480px) {
    //   & {
    //     flex-direction: column;
    //     .spread {
    //       flex-direction: row;
    //     }
    //   }
    // }
    @media (max-width: 480px) {
      & {
        flex-direction: column;
        .price {
          margin-right: auto;
        }
        .spread {
          flex-direction: row;
          margin-left: auto;
        }
      }
    }
    //   display: grid;
    //   grid-template-columns: 1fr 1fr;
    //   .price {
    //     display: grid;
    //     grid-template-columns: auto 1fr;
    //     grid-column-gap: 5px;
    //     align-items: center;
    //     i {
    //       grid-row: 1/3;
    //     }
    //     .num {
    //       grid-row: 1;
    //     }
    //     .token {
    //       grid-row: 2;
    //     }
    //   }
    //   .spread {
    //     justify-items: end;
    //     display: grid;
    //     font-size: 11px;
    //     .num {
    //       grid-row: 1;
    //     }
    //     .perc {
    //       grid-row: 2;
    //     }
    //   }
    // }
    // @media (max-width: 1200px) and (min-width: 983px) {
    //   .price, .spread {
    //     font-size: 11px;
    //   }
    // }
    // @media (max-width: 600px) {
    //   .price, .spread {
    //     font-size: 11px;
    //   }
    // }
    // @media (max-width: 468px) {
    //   .price, .spread {
    //     font-size: 9px;
    //   }
    // }
    // i {
    //   margin-right: 2px;
    // }
  }
}

.blist {
  flex: 1;
  display: flex;
  overflow: auto;
  flex-direction: column;
  padding-top: 5px;
  text-align: right;
}

.blist .ltd {
  width: 100%;
  min-height: 18px;
  position: relative;
  align-items: center;
  overflow: hidden;
  padding: 0px 10px;
  justify-content: space-between;

  i {
    font-size: 10px;
  }
}

.orders-list.asks {
  max-height: 220px;
  flex-direction: column-reverse;
}

.orders-list.bids {
  height: 209px;
}

.orders-list.blist .ltd:hover {
  cursor: pointer;
  font-weight: bold;
}

.blist .ltd span {
  width: 40%;
  font-size: 11.5px;
}

.blist .ltd span:first-child {
  text-align: left;
}

@media only screen and (max-width: 700px) {
  .blist .ltd span {
    font-size: 10px;
  }

  .display-4 {
    font-size: 1em;
  }
}
</style>
