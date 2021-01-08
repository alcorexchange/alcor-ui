<template lang="pug">
.order-book
  .blist
    .ltd.d-flex.justify-content-around
      span Price ({{ base_token.symbol.name }})
      span Amount({{ quote_token.symbol.name }})
      span Total ({{ base_token.symbol.name }})

  .orders-list.blist.asks.text-danger(ref="asks")
    .ltd.d-flex.justify-content-around(v-for="ask in sorted_asks" @click="setBid(ask)" :class="isMyOrder(ask) ? 'pl-0': ''")
      span
        i.el-icon-caret-right(v-if="isMyOrder(ask)")
        | {{ ask.unit_price | humanPrice }}
      span.text-center {{ ask.bid.amount | humanFloat(quote_token.symbol.precision) }}
      span {{ ask.ask.amount | humanFloat(base_token.symbol.precision) }}

    .ltd.d-flex.justify-content-around(v-if="sorted_asks.length == 0")
      span
      span No asks
      span

  .p-1.mt-1
    .overflowbox.text-center
      b.text-success {{ current_price | humanPrice }} {{ base_token.symbol.name }}

  .orders-list.blist.bids.text-success
    .ltd.d-flex(v-for="bid in sorted_bids" @click="setAsk(bid)" :class="isMyOrder(bid) ? 'pl-0': ''")
      span
        i.el-icon-caret-right(v-if="isMyOrder(bid)")
        | {{ bid.unit_price | humanPrice }}
      span.text-center {{ bid.ask.amount | humanFloat(quote_token.symbol.precision) }}
      span {{ bid.bid.amount | humanFloat(base_token.symbol.precision) }}

    .ltd.d-flex.justify-content-around(v-if="sorted_bids.length == 0")
      span
      span No bids
      span
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { EventBus } from '~/utils/event-bus'

export default {
  data() {
    return {
      asksL: 0
    }
  },

  computed: {
    ...mapState(['network', 'user']),
    ...mapGetters('market', ['sorted_asks', 'sorted_bids']),
    ...mapState('market', ['quote_token', 'base_token', 'id']),
    ...mapGetters(['user']),

    ...mapGetters({
      current_price: 'market/price'
    })
  },

  watch: {
    id () {
      this.$store.dispatch('market/fetchOrders')
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
    setTimeout(() => this.scrollBook(), 1000)

    this.$store.dispatch('market/fetchOrders')
  },

  methods: {
    scrollBook() {
      const asks = this.$refs.asks
      setTimeout(() => {
        if (!asks) return
        asks.scrollTop = asks.scrollHeight
      }, 100)
    },

    setBid(ask) {
      const price = this.$options.filters.humanPrice(ask.unit_price).replaceAll(',', '')
      EventBus.$emit('setPrice', price)
      EventBus.$emit('setAmount', ask.bid.prefix)
    },

    setAsk(bid) {
      const price = this.$options.filters.humanPrice(bid.unit_price).replaceAll(',', '')
      EventBus.$emit('setPrice', price)
      EventBus.$emit('setAmount', bid.ask.prefix)
    },

    isMyOrder(order) {
      if (this.user && order.account == this.user.name) {
        return true
      }

      return false
    }
  }
}
</script>

<style lang="scss">
.order-book {
  max-height: 500px;
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
