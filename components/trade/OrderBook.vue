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
      v-for='ask in asks',
      @click='setBid(ask)',
      :class="{ 'pl-0': ask.myOrder }"
    )
      span
        i.el-icon-caret-right(v-if='ask.myOrder')
        | {{ ask[0] | humanPrice }}
      span(:class='isMobile ? "text-right" : "text-center"') {{ ask[1] | humanFloat(quote_token.symbol.precision) }}
      span(v-if='!isMobile') {{ ask[2] | humanFloat(base_token.symbol.precision) }}

    .ltd.d-flex.justify-content-around(v-if='asks.length == 0')
      span
      span No asks
      span

  .p-1.mt-1(v-loading='loading')
    .overflowbox.latest-price(
    )
      .price(
        :class='{ red: isLastTradeSell }'
      )
        i(
          :class='`el-icon-caret-${isLastTradeSell ? "bottom" : "top"}`',
        )
        span.num {{ price }} &nbsp;
        //span.token {{ base_token.symbol.name }}
      .spread
        span.num {{ getSpreadNum ? getSpreadNum : '0.00' | humanPrice(6) }} Spread&nbsp;
        span(
          class="prec"
          :class="percentWarn"
        ) ({{ getSpreadPercent ? getSpreadPercent : '0.00' }}%)

  .orders-list.blist.bids
    .ltd.d-flex.text-success(
      v-for='bid in bids',
      @click='setAsk(bid)',
      :class="{ 'pl-0': bid.myOrder }"
    )
      span
        i.el-icon-caret-right(v-if='bid.myOrder')
        | {{ bid[0] | humanPrice }}
      span(:class='isMobile ? "text-right" : "text-center"') {{ bid[2] | humanFloat(quote_token.symbol.precision) }}

      span(v-if='!isMobile') {{ bid[1] | humanFloat(base_token.symbol.precision) }}

    .ltd.d-flex.justify-content-around(v-if='bids.length == 0')
      span
      span No bids
      span
</template>

<script>
//import { find } from 'lodash/fp'

import { mapGetters, mapState } from 'vuex'
import { trade } from '~/mixins/trade'

function sortByPrice(a, b) {
  if (a[0] > b[0]) return -1
  if (a[0] < b[0]) return 1
  return 0
}

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
    ...mapState(['network', 'user']),
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

  watch: {
    id(to, from) {
      this.fetch()
    },

    asks() {
      // Scroll asks after update
      if (this.sorted_asks.length != this.asksL) {
        this.scrollBook()
        this.asksL = this.sorted_asks.length
      }
    }
  },

  mounted() {
    //this.fetch()
    setTimeout(() => this.scrollBook(), 1000)

    this.$socket.on('orderbook_buy', bids => {
      if (this.bids.length == 0) {
        this.bids = bids
      } else {
        bids.map(b => {
          const old = this.bids.findIndex(old_bid => old_bid[0] == b[0])
          if (old != -1) {
            if (b[1] == 0) {
              this.bids.splice(old, 1)
            } else {
              this.bids[old] = b
            }
          } else if (b[1] !== 0) {
            this.bids.push(b)
          }
        })
      }

      this.bids.sort(sortByPrice)
    })

    this.$socket.on('orderbook_sell', asks => {
      if (this.asks.length == 0) {
        this.asks = asks.reverse()
      } else {
        asks.map(b => {
          const old = this.asks.findIndex(old_ask => old_ask[0] == b[0])
          if (old != -1) {
            if (b[1] == 0) {
              this.asks.splice(old, 1)
            } else {
              this.asks[old] = b
            }
          } else if (b[1] !== 0) {
            this.asks.push(b)
          }
        })

        this.asks.sort(sortByPrice)
      }
    })

    //const timeout = {}
    //this.$socket.on('update_asks', () => {
    //  if (timeout.update_asks) clearTimeout(timeout.update_asks)
    //  timeout.update_asks = setTimeout(() => this.$store.dispatch('market/fetchAsks'), 400)
    //})

    //this.$socket.on('update_bids', () => {
    //  if (timeout.update_bids) clearTimeout(timeout.update_bids)
    //  timeout.update_bids = setTimeout(() => this.$store.dispatch('market/fetchBids'), 400)
    //})
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

      const amount = this.$options.filters.humanFloat(ask.bid.amount, ask.bid.symbol.precision).replaceAll(',', '')

      this.$nuxt.$emit('setPrice', price)
      this.$nuxt.$emit('setAmount', amount)

      // Price and amount for marked moved to VUEX
      this.setPrecisionPrice(price)
      this.changeAmount({ amount, type: 'buy' })
      this.changeAmount({ amount, type: 'sell' })
    },

    setAsk(bid) {
      const price = this.$options.filters
        .humanPrice(bid.unit_price)
        .replaceAll(',', '')

      const amount = this.$options.filters.humanFloat(bid.ask.amount, bid.ask.symbol.precision).replaceAll(',', '')

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
    justify-content: space-between;
    font-weight: bold;
    padding: 0 5px;
    .price {
      color: var(--main-green);
      &.red {
        color: var(--main-red);
      }
    }
    .spread {
      font-weight: normal;
      color: #80a1c5;
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
        font-size: 11px;
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
