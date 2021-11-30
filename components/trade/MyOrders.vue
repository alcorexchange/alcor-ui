<template lang="pug">
  el-table(:data='orders' max-height="260").w-100
    el-table-column(label='Type' width="50")
      template(slot-scope='{ row }').text-success
        span.text-success(v-if="row.type == 'buy'") {{ row.type.toUpperCase() }}
        span.text-danger(v-else) {{ row.type.toUpperCase() }}

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
    ...mapGetters(['user']),
    ...mapGetters(['network', 'userOrders']),
    ...mapState('market', ['asks', 'bids', 'id', 'base_token']),

    orders() {
      if (!this.user) return []

      return this.userOrders.filter(a => a.account === this.user.name && a.market_id == this.id).sort((a, b) => b.timestamp - a.timestamp)
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
          this.$store.dispatch('loadOrders', this.id)
          this.$store.dispatch('loadUserBalances')
        }, 3000)
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
