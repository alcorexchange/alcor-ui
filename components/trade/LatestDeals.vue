<template lang="pug">
.overflowbox.no-bottom-border
  .blist
    .ltd.d-flex.justify-content-around
      span
      span Latest Deals
      span

  .orders-list.blist
    //.ltd.d-flex.justify-content-around(v-for="ask in sorted_asks" @click="setBid(ask)")
    a(v-for="deal in deals" :href="monitorTx(deal.trx_id)" target="_blank")
      .ltd.d-flex.justify-content-around
        span(:class="deal.cls")  {{ deal.unit_price | humanFloat }}
        span {{ deal.amount }}
        span {{ deal.time | moment('DD-MM HH:mm')}}

</template>

<script>
import { mapGetters, mapState } from 'vuex'

export default {
  computed: {
    ...mapGetters('market', ['history']),
    ...mapState(['network']),

    deals() {
      //return Array.from(this.history).sort((a, b) => a.timestamp - b.timestamp).map(h => {
      return Array.from(this.history)
        .sort((a, b) => b.time - a.time).map(h => {
          if (h.type == 'buymatch') {
            h.cls = 'text-success'
            h.amount = h.bid.quantity
          } else {
            h.cls = 'text-danger'
            h.amount = h.ask.quantity
          }

          return h
        })
    }
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
