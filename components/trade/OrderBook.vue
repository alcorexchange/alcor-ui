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
      :class="{ 'pl-0': ask.myOrder }"
    )
      span
        i.el-icon-caret-right(v-if='ask.myOrder')
        | {{ ask.unit_price | humanPrice }}
      span(:class='isMobile ? "text-right" : "text-center"') {{ ask.bid.amount | humanFloat(quote_token.symbol.precision) }}
      span(v-if='!isMobile') {{ ask.ask.amount | humanFloat(base_token.symbol.precision) }}

    .ltd.d-flex.justify-content-around(v-if='sorted_asks.length == 0')
      span
      span No asks
      span

  .p-1.mt-1(v-loading='loading')
    .overflowbox.latest-price(
      :class='{ red: isLastTradeSell }'
    )
      .price
        i(
          :class='`el-icon-caret-${isLastTradeSell ? "bottom" : "top"}`',
        )
        span.num {{ price }} &nbsp;
        span.token {{ base_token.symbol.name }}
      .spread
        span.num {{ getSpreadNum ? getSpreadNum : '0.00' | humanPrice }} Spread&nbsp;
        span(
          class="prec"
          :class="percentWarn"
        ) ({{ getSpreadPercent ? getSpreadPercent : '0.00' }}%)

  .orders-list.blist.bids
    .ltd.d-flex.text-success(
      v-for='bid in sorted_bids',
      @click='setAsk(bid)',
      :class="{ 'pl-0': bid.myOrder }"
    )
      span
        i.el-icon-caret-right(v-if='bid.myOrder')
        | {{ bid.unit_price | humanPrice }}
      span(:class='isMobile ? "text-right" : "text-center"') {{ bid.ask.amount | humanFloat(quote_token.symbol.precision) }}

      span(v-if='!isMobile') {{ bid.bid.amount | humanFloat(base_token.symbol.precision) }}

    .ltd.d-flex.justify-content-around(v-if='sorted_bids.length == 0')
      span
      span No bids
      span
</template>

<script>
import { mapGetters, mapState } from 'vuex'

export default {
  data() {
    return {
      asksL: 0,
      loading: false
    }
  },

  computed: {
    ...mapState(['network', 'user']),
    ...mapGetters('market', ['sorted_asks', 'sorted_bids', 'price']),
    ...mapState('market', ['quote_token', 'base_token', 'id', 'deals']),
    ...mapGetters(['user']),

    isLastTradeSell() {
      return this.deals.length > 0 && this.deals[0].type === 'sellmatch'
    },

    getSpreadNum() {
      const latestAsk = this.sorted_asks[this.sorted_asks.length - 1]
      const latestBid = this.sorted_bids[0]
      const spreadDec = latestAsk?.unit_price - latestBid?.unit_price
      return spreadDec
    },

    getSpreadPercent() {
      const latestAsk = this.sorted_asks[this.sorted_asks.length - 1]
      const spreadDec = this.getSpreadNum / latestAsk?.unit_price * 100
      const spread = Math.round(spreadDec * 100) / 100
      return spread
    },

    percentWarn() {
      return this.getSpreadPercent > 5 ? 'warn' : ''
    }
  },

  watch: {
    id(to, from) {
      this.fetch()
    },

    sorted_asks() {
      // Scroll asks after update
      if (this.sorted_asks.length != this.asksL) {
        this.scrollBook()
        this.asksL = this.sorted_asks.length
      }
    }
  },

  mounted() {
    this.fetch()
    setTimeout(() => this.scrollBook(), 1000)

    this.$socket.on('update_asks', () => this.$store.dispatch('market/fetchAsks'))
    this.$socket.on('update_bids', () => this.$store.dispatch('market/fetchBids'))
  },

  methods: {
    async fetch() {
      try {
        await this.$store.dispatch('market/fetchOrders')
      } catch (e) {
        this.$notify({ title: 'Fetch orders', message: e, type: 'error' })
      } finally {
        this.loading = false
      }
    },

    scrollBook() {
      const asks = this.$refs.asks
      setTimeout(() => {
        if (!asks) return
        asks.scrollTop = asks.scrollHeight
      }, 100)
    },

    setBid(ask) {
      const price = this.$options.filters
        .humanPrice(ask.unit_price)
        .replaceAll(',', '')

      this.$nuxt.$emit('setPrice', price)
      this.$nuxt.$emit('setAmount', this.$options.filters.humanFloat(ask.bid.amount, ask.bid.symbol.precision).replaceAll(',', ''))
    },

    setAsk(bid) {
      const price = this.$options.filters
        .humanPrice(bid.unit_price)
        .replaceAll(',', '')

      this.$nuxt.$emit('setPrice', price)
      this.$nuxt.$emit('setAmount', this.$options.filters.humanFloat(bid.ask.amount, bid.ask.symbol.precision).replaceAll(',', ''))
    }
  }
}
</script>

<style lang="scss">
.order-book {
  max-height: 500px;
  .latest-price {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    color: var(--main-green);
    padding: 0 5px;
    .spread {
      color: #9e9e9e;
      .prec.warn {
        color: var(--main-red);
      }
    }
    @media (max-width: 1600px) {
      display: grid;
      grid-template-columns: 1fr 1fr;
      .price {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-column-gap: 5px;
        align-items: center;
        i {
          grid-row: 1/3;
        }
        .num {
          grid-row: 1;
        }
        .token {
          grid-row: 2;
        }
      }
      .spread {
        justify-items: end;
        display: grid;
        font-size: 14px;
        .num {
          grid-row: 1;
        }
        .perc {
          grid-row: 2;
        }
      }
    }
    @media (max-width: 1200px) and (min-width: 983px) {
      .price, .spread {
        font-size: 11px;
      }
    }
    @media (max-width: 600px) {
      .price, .spread {
        font-size: 11px;
      }
    }
    @media (max-width: 468px) {
      .price, .spread {
        font-size: 9px;
      }
    }
    i {
      margin-right: 2px;
    }
    &.red {
      color: var(--main-red);
    }
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
}

.orders-list.bids {
  height: 220px;
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
