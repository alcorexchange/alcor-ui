<template lang="pug">
  el-table(:data='orders' max-height="260").w-100
    el-table-column(label='Type' width="50")
      template(slot-scope='scope').text-success
        span.text-success(v-if="scope.row.type == 'bid'") {{ scope.row.type.toUpperCase() }}
        span.text-danger(v-else) {{ scope.row.type.toUpperCase() }}

    el-table-column(label='Date' width="80" v-if="!isMobile")
      template(slot-scope='scope')
        span {{ scope.row.timestamp | moment('DD-MM HH:mm')}}

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
        el-button(size='mini', type='text', @click='cancel(scope.row)') Cancel

</template>

<script>
import { captureException } from '@sentry/browser'
import { mapGetters, mapState } from 'vuex'

export default {
  computed: {
    ...mapGetters(['network']),
    ...mapGetters(['user']),
    ...mapState('market', ['asks', 'bids', 'id', 'base_token', 'userOrders']),

    orders() {
      if (!this.user) return []

      const orders = []

      for (const order of [...this.asks, ...this.bids, ...this.userOrders].filter(a => a.account === this.user.name)) {
        order.type = order.bid.symbol.symbol === this.base_token.symbol.name ? 'bid' : 'ask'

        if (orders.filter(o => o.id == order.id && o.type == order.type)[0]) continue

        orders.push(order)
      }

      return orders.sort((a, b) => b.timestamp - a.timestamp)
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
        setTimeout(() => {
          this.$store.dispatch('loadUserBalances')
          this.$store.dispatch('market/loadUserOrders')
          this.$store.dispatch('market/fetchOrders')
        }, 1000)
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
