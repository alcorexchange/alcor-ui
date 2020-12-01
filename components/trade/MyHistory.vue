<template lang="pug">
  el-table(:data='orders' max-height="260")
    el-table-column(label='Type' width="50")
      template(slot-scope='scope').text-success
        span.text-success(v-if="scope.row.type == 'buymatch'") BID
        span.text-danger(v-else) SELL

    el-table-column(label='Date' width="80" v-if="!isMobile")
      template(slot-scope='scope')
        span {{ scope.row.time | moment('DD-MM HH:mm')}}

    el-table-column(label='Ask' width="120" v-if="!isMobile")
      template(slot-scope='scope')
        span {{ scope.row.ask.quantity }}

    el-table-column(label='Bid' width="120")
      template(slot-scope='scope')
        span {{ scope.row.bid.quantity }}

    el-table-column(label='Price' width="70")
      template(slot-scope='scope')
        span {{ scope.row.unit_price | humanPrice }}

    el-table-column(label='Manage' align="right" width="60")
      template(slot-scope='scope')
        el-button(size="mini" type="text")
          a(:href="monitorTx(scope.row.trx_id)" target="_blank").a-reset view

</template>

<script>
import { mapGetters, mapState } from 'vuex'

export default {
  computed: {
    ...mapGetters(['user']),
    ...mapState('market', ['deals']),
    ...mapState(['network']),

    orders() {
      if (!this.deals || !this.user) return []

      return this.deals.filter(d => (d.bidder == this.user.name || d.asker == this.user.name))
    }
  }
}

</script>

<style>
.market-row div {
  font-size: 13px;
}
</style>
