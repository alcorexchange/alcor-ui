<template lang="pug">
el-table.w-100.my-orders(:data='orders', max-height='260' empty-text='No open orders')
  el-table-column(label='Time', width='120', v-if='!isMobile')
    template(slot-scope='scope')
      span {{ scope.row.timestamp | moment("MM-DD HH:mm:ss") }}
  el-table-column(label='Pair', v-if='!isMobile')
    template(slot-scope='scope')
      span {{ quote_token.symbol.name }}/{{ base_token.symbol.name }}
  el-table-column(label='Type')
    template.text-success(slot-scope='{ row }')
      span.text-success(v-if='row.type == "buy"') {{ row.type.toUpperCase() }}
      span.text-danger(v-else) {{ row.type.toUpperCase() }}
  el-table-column(label='Price')
    template(slot-scope='scope')
      span {{ scope.row.unit_price | humanPrice }}
  el-table-column(label='Amount', v-if='!isMobile')
    template(slot-scope='scope')
      span {{ scope.row.ask.quantity }} / {{ scope.row.bid.quantity }}
  el-table-column(label='Total(WAX)', v-if='!isMobile')
    template(slot-scope='scope')
      span {{ scope.row.ask.quantity }} / {{ scope.row.bid.quantity }}
  el-table-column(label='Action(cancel all)', align='right')
    template(slot-scope='scope')
      el-button(size='mini', type='text', @click='cancel(scope.row)') Cancel
</template>

<script>
import { captureException } from '@sentry/browser'
import { mapGetters, mapState } from 'vuex'

export default {
  data() {
    return {}
  },
  computed: {
    ...mapGetters(['user']),
    ...mapGetters(['network', 'userOrders']),
    ...mapState('market', ['asks', 'bids', 'id', 'base_token', 'quote_token']),

    orders() {
      if (!this.user) return []

      return this.userOrders
        .filter((a) => a.account === this.user.name && a.market_id == this.id)
        .sort((a, b) => b.timestamp - a.timestamp)
    },
  },

  mounted() {
    setTimeout(() => {
      console.log('myorders', this.orders, this.userOrders)
    }, 100)
  },

  methods: {
    async cancel(order) {
      if (!this.user)
        return this.$notify({
          title: 'Authorization',
          message: 'Pleace login first',
          type: 'info',
        })

      const loading = this.$loading({ lock: true, text: 'Wait for wallet' })

      try {
        await this.$store.dispatch('chain/cancelorder', {
          account: this.user.name,
          market_id: this.id,
          type: order.type,
          order_id: order.id,
        })

        this.$notify({
          title: 'Success',
          message: `Order canceled ${order.id}`,
          type: 'success',
        })
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
    },
  },
}
</script>

<style>
.market-row div {
  font-size: 13px;
}

.my-orders {
  width: 100% !important;
}
</style>
