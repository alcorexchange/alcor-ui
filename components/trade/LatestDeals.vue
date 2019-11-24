<template lang="pug">
.overflowbox.no-bottom-border
  .blist
    .ltd.d-flex.justify-content-around
      span
      span Latest Deals
      span

  .orders-list.blist
    //.ltd.d-flex.justify-content-around(v-for="ask in sorted_asks" @click="setBid(ask)")
    a(v-for="deal in deals" :href="deal.trx_id | monitorTx" target="_blank")
      .ltd.d-flex.justify-content-around
        span(:class="deal.cls")  {{ deal.unit_price | humanFloat }}
        span {{ deal.amount }}
        span {{ deal.time | moment('DD-MM HH:mm')}}

</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('market', ['history']),

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
}
</script>

<style>
.blist a {
  all: unset;
}
</style>
