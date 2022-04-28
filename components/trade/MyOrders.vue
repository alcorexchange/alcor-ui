<template lang="pug">

//el-table.w-100.my-orders(:data='orders', max-height='260' empty-text='No open orders')
el-table.my-orders(:data='filledPositions' empty-text='No open orders')
  template(slot="empty")
    span(v-if="user") No open orders
    el-button(v-else type="default" @click='$store.dispatch("modal/login")') Connect Wallet

  el-table-column(label='Time', width='100', v-if='!isMobile')
    template(slot-scope='scope')
      span {{ scope.row.timestamp | moment("MM-DD HH:mm:ss") }}
  el-table-column(label='Pair', v-if='!isMobile' width=100)
    template(slot-scope='{ row }')
      span {{ row.market_symbol }}
  el-table-column(label='Type' :width="isMobile ? 50 : 50")
    template.text-success(slot-scope='{ row }')
      span.green(v-if='row.type == "buy"') {{ row.type.toUpperCase() }}
      span.red(v-else) {{ row.type.toUpperCase() }}
  el-table-column(label='Price' width="90")
    template(slot-scope='scope')
      span {{ scope.row.unit_price | humanPrice }}
  el-table-column(label="Amount" :width="isMobile ? 140 : ''")
    template(slot-scope='{ row }')
      span(v-if="isMobile") {{ row.type == 'buy' ? row.ask.quantity : row.bid.quantity | commaFloat }}
      span(v-else) {{ row.type == 'buy' ? row.ask.quantity : row.bid.quantity | commaFloat }}
  el-table-column(:label="'Total(' + base_token.symbol.name + ')'", v-if='!isMobile')
    template(slot-scope='{ row }')
      span {{ row.type == 'buy' ? row.bid.quantity : row.ask.quantity }}
  //el-table-column(label='Action', align='right' width="60")
  el-table-column(label='Action', align='right' :width="isMobile ? 60 : 120")
    template(v-if="!isMobile" slot="header")
      span.mr-1 Action
      el-button(type="text" size="mini" @click="cancelAll").red (cancel all)

    template(slot-scope='scope')
      el-button(size='mini', type='text', @click='cancel(scope.row)').red Cancel

</template>

<script>
import { captureException } from '@sentry/browser'
import { mapGetters, mapState } from 'vuex'
import AlcorButton from '~/components/AlcorButton.vue'

export default {
  components: {
    AlcorButton,
  },

  props: ['onlyCurrentPair'],

  computed: {
    ...mapGetters({
      user: 'user',
      allOrders: 'wallet/allOrders',
    }),
    ...mapGetters(['network', 'userOrders']),
    ...mapState('market', ['asks', 'bids', 'id', 'base_token', 'quote_token']),

    orders() {
      if (!this.user) return []

      return this.userOrders
        .filter((a) => a.account === this.user.name && a.market_id == this.id)
        .sort((a, b) => b.timestamp - a.timestamp)
    },

    filledPositions() {
      if (this.onlyCurrentPair) {
        return this.allOrders.filter((p) => p.market_id == this.id)
      }

      return this.allOrders
    },
  },

  methods: {
    cancelAll() {
      let confirmTitle = 'Cancel all orders'
      let confirmText = 'Are you sure you want to cancel all current orders throughout all pairs on Alcor?'

      let ordersToCalcel = []

      if (this.$store.state.settings.hideOtherPairs) {
        // Only cancel for current market
        ordersToCalcel = this.userOrders.filter(o => o.account === this.user.name && o.market_id == this.id)
        confirmTitle = 'Cancel all current pair orders'
        confirmText = 'Are you sure you want to cancel all current orders for the current pair?'
      } else {
        ordersToCalcel = this.userOrders.filter(o => o.account === this.user.name)
      }

      console.log('ordersToCalcel', ordersToCalcel)
      const h = this.$createElement
      this.$confirm(
        h('div', null, [
          h('div', null, confirmText),
          h('div', { class: 'red mt-2' }, 'This action cannot be reverted!')
        ]),
        confirmTitle,
        {
          confirmButtonText: 'Yes',
          cancelButtonText: 'No',
          type: 'error'
        }
      ).then(async () => {
        try {
          await this.$store.dispatch('market/cancelAll', ordersToCalcel)
          this.$notify({ type: 'success', message: 'Orders canceled' })
        } catch (e) {
          this.$notify({ type: 'error', message: 'Orders cancelation error: ' + e })
        }
      })
    },

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
</style>
