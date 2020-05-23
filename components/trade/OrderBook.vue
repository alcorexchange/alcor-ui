<template lang="pug">
.overflowbox.no-bottom-border
  .blist
    .ltd.d-flex.justify-content-around
      span Price ({{ network.baseToken.symbol }})
      span Amount({{ token.symbol.name }})
      span Total ({{ network.baseToken.symbol }})

  .orders-list.blist.asks.text-danger(ref="asks")
    .ltd.d-flex.justify-content-around(v-for="ask in sorted_asks" @click="setBid(ask)")
      span {{ ask.unit_price | humanPrice }}
      span.text-center {{ ask.bid.amount | humanFloat(token.symbol.precision) }}
      span {{ ask.ask.amount | humanFloat(network.baseToken.precision) }}

    .ltd.d-flex.justify-content-around(v-if="sorted_asks.length == 0")
      span
      span No asks
      span

  .bg-light.text-center.p-1
    b.text-success {{ current_price | humanPrice }}

  .orders-list.blist.text-success
    .ltd.d-flex(v-for="bid in sorted_bids" @click="setAsk(bid)")
      span {{ bid.unit_price | humanPrice }}
      span.text-center {{ bid.ask.amount | humanFloat(token.symbol.precision) }}
      span {{ bid.bid.amount | humanFloat(network.baseToken.precision) }}

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
    ...mapState(['network']),
    ...mapGetters('market', ['sorted_asks', 'sorted_bids', 'token']),

    ...mapGetters({
      current_price: 'market/price'
    })
  },

  watch: {
    sorted_asks() {
      // Scroll asks after update
      const asks = this.$refs.asks

      if (this.sorted_asks.length != this.asksL) {
        setTimeout(() => asks.scrollTop = asks.scrollHeight, 100)
        this.asksL = this.sorted_asks.length
      }
    }
  },

  methods: {
    setBid(ask) {
      const price = this.$options.filters.humanPrice(ask.unit_price).replace(',', '')
      EventBus.$emit('setPrice', price)
      EventBus.$emit('setAmount', ask.bid.prefix)
    },

    setAsk(bid) {
      const price = this.$options.filters.humanPrice(bid.unit_price).replace(',', '')
      EventBus.$emit('setPrice', price)
      EventBus.$emit('setAmount', bid.ask.prefix)
    }
  }
}
</script>

<style>
.overflowbox {
  border: 1px solid hsla(0,2%,89%,.7);
  box-shadow: none;
}

.blist {
  flex: 1;
  display: flex;
  overflow: auto;
  flex-direction: column;
  max-height: 345px;
  padding: 5px 10px;
  text-align: right;
}

.blist .ltd {
  width: 100%;
  min-height: min-content;
  position: relative;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-pack: center;
  justify-content: center;
  -ms-flex-align: center;
  align-items: center;
  height: 20.6px;
  line-height: 20.6px;
  overflow: hidden;
}


.orders-list.asks {
  max-height: 200px;
}

.orders-list.blist .ltd:hover {
  cursor: pointer;
  font-weight: bold;
}

.blist .ltd span {
  width: 40%;
  font-size: 12px;
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
