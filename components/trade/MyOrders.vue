<template lang="pug">
div
  .mobile-markets.d-lg-none.mt-3
    .row.market-row(v-for="order in orders").border
      .col-8
        .row
          .col
            div(v-if="order.type == 'bid'")
              strong.text-success {{ order.type }}
              strong.ml-3 {{ order.bid.quantity }}

            div(v-else)
              strong.text-danger {{ order.type }}
              strong.ml-3 {{ order.bid.quantity }}
        .row
          .col
            div(v-if="order.type == 'bid'")
              strong.text-success {{ order.unit_price | humanPrice }}

            div(v-else)
              strong.text-danger {{ order.unit_price | humanPrice }}

      .col-4
        el-button(size='mini', type='danger', @click='cancel(order)').ml-auto Cancel

  el-table(:data='orders' max-height="260").d-none.d-lg-block.w-100
    el-table-column(label='Type' width="50")
      template(slot-scope='scope').text-success
        span.text-success(v-if="scope.row.type == 'bid'") {{ scope.row.type.toUpperCase() }}
        span.text-danger(v-else) {{ scope.row.type.toUpperCase() }}

    el-table-column(label='Date' width="100")
      template(slot-scope='scope')
        span {{ scope.row.timestamp | moment('DD-MM HH:mm')}}

    el-table-column(label='Ask' width="120")
      template(slot-scope='scope')
        span {{ scope.row.ask.quantity }}

    el-table-column(label='Bid' width="120")
      template(slot-scope='scope')
        span {{ scope.row.bid.quantity }}

    el-table-column(label='Price' width="90")
      template(slot-scope='scope')
        span {{ scope.row.unit_price | humanPrice }}

    el-table-column(label='Manage' align="right")
      template(slot-scope='scope')
        el-button(size='mini', type='text', @click='cancel(scope.row)') Cancel

</template>

<script>
import { captureException } from '@sentry/browser'
import { mapGetters, mapState } from 'vuex'

export default {
  computed: {
    ...mapState(['network']),
    ...mapGetters(['user']),
    ...mapGetters('chain', ['rpc']),
    ...mapState('market', ['asks', 'bids', 'id']),

    orders() {
      if (!this.user) return []

      return [...this.asks, ...this.bids].filter(a => a.account === this.user.name).map((o) => {
        o.type = o.bid.symbol.symbol === this.network.baseToken.symbol ? 'bid' : 'ask'

        return o
      }).sort((a, b) => b.timestamp - a.timestamp)
    }
  },

  methods: {
    async cancel(order) {
      if (!this.user) return this.$notify({ title: 'Authorization', message: 'Pleace login first', type: 'info' })

      const loading = this.$loading({ lock: true, text: 'Wait for wallet' })

      try {
        await this.$store.dispatch('chain/cancelorder', {
          account: this.user.name,
          market_id: this.id,
          type: order.type,
          order_id: order.id
        })

        this.$notify({ title: 'Success', message: `Order canceled ${order.id}`, type: 'success' })
        this.$store.dispatch('market/fetchOrders')
      } catch (e) {
        captureException(e, { extra: { order, market_id: this.id } })
        this.$notify({ title: 'Place order', message: e, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    }
  }
}

</script>

<style>
.market-row div {
  font-size: 13px;
}
</style>
