<template lang="pug">
.order-book
  // https://v3.vuejs.org/guide/transitions-list.html#list-entering-leaving-transitions
  .blist.first
    .ltd.d-flex.justify-content-around
      span Price ({{ base_token.symbol.name }})
      span Amount ({{ quote_token.symbol.name }})
      span(v-if='!isMobile') Total ({{ base_token.symbol.name }})

  .orders-list.blist.asks(ref='asks')
    .ltd.orderbook-progress(
      v-for='ask in asks',
      @click='setBid(ask)',
      :class='{ "pl-0": isMyOrder(ask, "sell") }'
    )
      i.el-icon-caret-right.red(v-if='isMyOrder(ask, "sell")')
      .progress-container
        .order-row
          .red.text-left {{ ask[0] | humanPrice }}
          .text-right.px-1 {{ ask[1] | humanFloat(quote_token.symbol.precision) }}
          .text-right(v-if='!isMobile') {{ ask[2] | humanFloat(base_token.symbol.precision) }}

        .progress-bar.sell(:style="'transform: translateX(' + -getAskProgress(ask) + '%);'" v-if="!isMobile")

    .ltd.d-flex.justify-content-around(v-if='sorted_asks.length == 0')
      span
      span No asks
      span

  .latest-price
    .left.d-flex.align-items-center.green
      .arrow(:class='{ red: isLastTradeSell }').mr-2
        i(:class='`el-icon-caret-${isLastTradeSell ? "bottom" : "top"}`')

      div
        .price(:class='{ red: isLastTradeSell }')
          span {{ price }} &nbsp;
          .text-muted(v-if="base_token.contract == network.baseToken.contract") $ {{ $systemToUSD(price, 8) }}

    .right
      el-tooltip.item(effect='dark', content='Spread', placement='top-end')
        .spread
          .text-end {{ getSpreadPercent ? getSpreadPercent : "0.00" }}%
          .text-muted(:class='percentWarn') {{ getSpreadNum ? getSpreadNum : "0.00" | humanPrice(6) }}

  .orders-list.blist.bids
    .ltd.orderbook-progress(
      v-for='bid in bids',
      @click='setAsk(bid)',
      :class='{ "pl-0": isMyOrder(bid, "buy") }'
    )
      i.el-icon-caret-right.green(v-if='isMyOrder(bid, "buy")')
      .progress-container
        .order-row
          .green.text-left {{ bid[0] | humanPrice }}
          .text-right.px-1 {{ bid[2] | humanFloat(quote_token.symbol.precision) }}
          .text-right(v-if='!isMobile') {{ bid[1] | humanFloat(base_token.symbol.precision) }}

        .progress-bar.buy(:style="'transform: translateX(' + -getBidProgress(bid) + '%);'"  v-if="!isMobile")

    .ltd.d-flex.justify-content-around(v-if='sorted_bids.length == 0')
      span
      span No bids
      span
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { trade } from '~/mixins/trade'

export default {
  mixins: [trade],

  data() {
    return {
      loading: false
    }
  },

  computed: {
    ...mapState(['network', 'user', 'userOrders']),
    ...mapGetters('market', ['price']),
    ...mapState('market', ['quote_token', 'base_token', 'id', 'deals', 'orderbook_settings']),
    ...mapGetters(['user']),

    asks() {
      return this.sorted_asks
    },

    bids() {
      return this.sorted_bids
    },

    isLastTradeSell() {
      return this.deals.length > 0 && this.deals[0].type === 'sellmatch'
    },

    percentWarn() {
      return this.getSpreadPercent > 5 ? 'warn' : ''
    },

    askSumVolume() {
      return this.sorted_asks[this.sorted_asks.length - 1][3]
    },

    bidSumVolume() {
      return this.sorted_bids.reduce((a, b) => {
        return a + b[1]
      }, 0)
    }
  },

  methods: {
    getAskProgress(ask) {
      if (this.orderbook_settings.totalSum) {
        return (100 * ask[3]) / this.askSumVolume
      } else {
        return (100 * ask[1]) / this.askSumVolume
      }
    },

    getBidProgress(bid) {
      if (this.orderbook_settings.totalSum) {
        return (100 * bid[3]) / this.bidSumVolume
      } else {
        return (100 * bid[1]) / this.bidSumVolume
      }
    },

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
  height: calc(100%);

  .latest-price {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    padding: 4px;
    align-items: center;
    background: var(--btn-default);

    font-size: 0.8rem;
    font-weight: normal;
    line-height: 14px;

    .price {
      color: var(--main-green);
      &.red {
        color: var(--main-red);
      }
    }

    .spread {
      color: #80a1c5;
      text-align: right;
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
    @media (max-width: 480px) {
      & {
        .price {
          margin-right: auto;
        }
        .spread {
          margin-right: auto;

          .num {
            margin-right: 5px;
          }
        }
      }
    }
  }
}

.blist {
  flex: 1;
  display: flex;
  overflow: auto;
  flex-direction: column;
  text-align: right;
  padding: 0px 10px;

}

.blist .ltd {
  width: 100%;
  min-height: 20px;
  position: relative;
  align-items: center;
  justify-content: space-between;
}

.blist.first {
  background: var(--btn-default);
  overflow: hidden;

  .ltd {
    height: 23px;
  }
}

.orders-list {
  background: var(--table-background) !important;

  .orderbook-progress {
    display: flex;

    .el-icon-caret-right {
      position: absolute;
      left: -11px;
      font-size: 11px;
    }

    .progress-container {
      width: 100%;
      height: 100%;
      display: flex;
      overflow: hidden;

      position: relative;

      .order-row {
        display: flex;
        box-sizing: border-box;
        z-index: 2;
        width: 100%;
        height: 100%;
        line-height: 22px;
        cursor: pointer;
        align-items: center;

        div {
          // TODO This font seem not workin now
          font-family: 'Roboto';
          font-style: normal;
          font-weight: 400;
          font-size: 11.5px;
          line-height: 12px;

          flex: 1 1 0%;
          color: var(--text-grey-thirdly);
        }

        i {
          font-size: 10px;
        }
      }

      .progress-bar {
        position: absolute;
        z-index: 1;
        height: 20px;
        opacity: 0.15;
        width: 100%;
        right: 0px;
        left: 100%;

        &.sell {
          background-color: #F96C6C;;
        }

        &.buy {
          background-color: #66C167;
        }
      }
    }
  }
}

.orders-list.asks {
  height: calc(50% - 41px);
  flex-direction: column-reverse;
  padding-bottom: 1px;

  span {
    color: var(--main-red);
  }
}

.orders-list.bids {
  height: calc(50% - 18px);
  padding-top: 1px;

  span {
    color: var(--main-green);
  }
}

.orders-list.blist .ltd:hover {
  cursor: pointer;
  font-weight: bold;
  background: var(--active-row);
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
