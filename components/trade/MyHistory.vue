<template lang="pug">
div
  .mobile-markets.d-lg-none.mt-3
    .row.market-row(v-for="order in orders").mb-2.border
      .col-6
        .row
          .col
            div(v-if="order.type == 'bid'")
              strong.text-success BUY
              strong.ml-3 {{ order.bid.quantity }}

            div(v-else)
              strong.text-danger SELL
              strong.ml-3 {{ order.bid.quantity }}
        .row
          .col
            div(v-if="order.type == 'bid'")
              strong.text-success {{ order.unit_price | humanPrice }}

            div(v-else)
              strong.text-danger {{ order.unit_price | humanPrice }}

      .col-6
        el-button(size="mini")
          a(:href="monitorTx(order.trx_id)" target="_blank").a-reset Show transaction

  el-table(:data='orders' max-height="260").d-none.d-lg-block
    el-table-column(label='Type' width="40")
      template(slot-scope='scope').text-success
        span.text-success(v-if="scope.row.type == 'bid'") BID
        span.text-danger(v-else) SELL

    el-table-column(label='Date' width="80")
      template(slot-scope='scope')
        span {{ scope.row.timestamp | moment('DD-MM HH:mm')}}

    el-table-column(label='Ask' width="120")
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
