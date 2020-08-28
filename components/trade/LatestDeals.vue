<template lang="pug">
// Переделать как табличку element
.deals-history
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
    a(v-for="deal in coloredDeals" :href="monitorTx(deal.trx_id)" target="_blank")
      .ltd.d-flex.justify-content-around
        span(:class="deal.cls")  {{ deal.unit_price | humanPrice(6) }}
        span {{ deal.amount | humanFloat(network.baseToken.precision) }}
        span {{ deal.time | moment('DD-MM HH:mm')}}

</template>

<script>
import { mapState } from 'vuex'

export default {
  async fetch() {
    await this.$store.dispatch('market/fetchDeals')
  },

  computed: {
    ...mapState('market', ['deals', 'token']),
    ...mapState(['network']),

    coloredDeals() {
      return Array.from(this.deals)
        .sort((a, b) => b.time - a.time).map(h => {
          if (h.type == 'buymatch') {
            h.cls = 'text-success'
            h.amount = h.bid.amount
          } else {
            h.cls = 'text-danger'
            h.amount = h.ask.amount
          }

          return h
        })
    }
  }
}
</script>

<style>
.blist a {
  all: unset;
}

.orders-list {
  height: 250px;
}
</style>
