<template lang="pug">
.order-book
  // https://v3.vuejs.org/guide/transitions-list.html#list-entering-leaving-transitions
  .blist
    .ltd.d-flex.justify-content-around
      span Price ({{ base_token.symbol.name }})
      span Amount({{ quote_token.symbol.name }})
      span(v-if='!isMobile') Total ({{ base_token.symbol.name }})

  .orders-list.blist.asks.text-danger(ref='asks')
    .ltd.d-flex(
      v-for='ask in sorted_asks',
      @click='setBid(ask)',
      :class='isMyOrder(ask) ? "pl-0" : ""'
    )
      span
        i.el-icon-caret-right(v-if='isMyOrder(ask)')
        | {{ ask.unit_price | humanPrice }}
      span(:class='isMobile ? "text-right" : "text-center"') {{ ask.bid.amount | humanFloat(quote_token.symbol.precision) }}
      span(v-if='!isMobile') {{ ask.ask.amount | humanFloat(base_token.symbol.precision) }}

    .ltd.d-flex.justify-content-around(v-if='sorted_asks.length == 0')
      span
      span No asks
      span

  .p-1.mt-1(v-loading='loading')
    .overflowbox.text-center.latest-price(
      :class='{ green: isLastTradeBuy, red: isLastTradeSell }'
    )
      i(
        :class='`el-icon-caret-${isLastTradeSell ? "bottom" : "top"}`',
        v-if='latestTrade.type'
      )
      span {{ price }} {{ base_token.symbol.name }}

  .orders-list.blist.bids.text-success
    .ltd.d-flex(
      v-for='bid in sorted_bids',
      @click='setAsk(bid)',
      :class='isMyOrder(bid) ? "pl-0" : ""'
    )
      span
        i.el-icon-caret-right(v-if='isMyOrder(bid)')
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
      loading: false,
    }
  },

  computed: {
    isLastTradeSell() {
      return this.latestTrade.type === 'sellmatch'
    },
    isLastTradeBuy() {
      return this.latestTrade.type === 'buymatch'
    },
    ...mapState(['network', 'user']),
    ...mapGetters('market', ['sorted_asks', 'sorted_bids', 'latestTrade']),
    ...mapState('market', ['quote_token', 'base_token', 'id', 'price']),
    ...mapGetters(['user'])
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
    },
  },

  mounted() {
    this.fetch()
    setTimeout(() => this.scrollBook(), 1000)

    let timeout
    this.$socket.on('update_orders', new_deals => {
      if (timeout) {
        clearTimeout(timeout)
      }
      timeout = setTimeout(() => this.fetch(), 400)
    })
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
      this.$nuxt.$emit('setAmount', ask.bid.prefix)
    },

    setAsk(bid) {
      const price = this.$options.filters
        .humanPrice(bid.unit_price)
        .replaceAll(',', '')
      this.$nuxt.$emit('setPrice', price)
      this.$nuxt.$emit('setAmount', bid.ask.prefix)
    },

    isMyOrder(order) {
      if (this.user && order.account == this.user.name) {
        return true
      }

      return false
    },
  },
}
</script>

<style lang="scss">
.order-book {
  max-height: 500px;
}
.latest-price {
  font-weight: bold;
  &.green {
    color: var(--main-green);
  }
  &.red {
    color: var(--main-red);
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
