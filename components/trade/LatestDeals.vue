<template lang="pug">
.overflowbox.no-bottom-border
  .blist
    .ltd.d-flex.justify-content-around
      span
      span.text-muted Latest Deals
      span

    .ltd.d-flex.justify-content-around.mt-1
      span Price ({{ token.symbol.name }})
      span Amount ({{ network.baseToken.symbol }})
      span Time

  .orders-list.blist
    //.ltd.d-flex.justify-content-around(v-for="ask in sorted_asks" @click="setBid(ask)")
    a(v-for="deal in coloredDeals" :href="monitorTx(deal.trx_id)" target="_blank")
      .ltd.d-flex.justify-content-around
        span(:class="deal.cls")  {{ deal.unit_price | humanFloat }}
        span {{ deal.amount }}
        span {{ deal.time | moment('DD-MM HH:mm')}}

</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState('market', ['deals', 'token']),
    ...mapState(['network']),

    coloredDeals() {
      return Array.from(this.deals)
        .sort((a, b) => b.time - a.time).map(h => {
          if (h.type == 'buymatch') {
            h.cls = 'text-success'
            h.amount = h.bid.prefix
          } else {
            h.cls = 'text-danger'
            h.amount = h.ask.prefix
          }

          return h
        })
    }
  },

  async fetch() {
    await this.$store.dispatch('market/fetchDeals')
  },

  methods: {
    monitorTx(tx) {
      return `${this.network.monitor}/transaction/${tx}?tab=traces&${this.network.monitor_params}`
    }
  }
}
</script>

<style>
.blist a {
  all: unset;
}
</style>
