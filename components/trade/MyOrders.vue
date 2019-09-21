<template lang="pug">
div
  .lead My orders:
  el-table(:data='orders', style='width: 100%')
    el-table-column(label='Type', width='180')
      template(slot-scope='scope')
        span.text-success(v-if="scope.row.type == 'bid'") {{ scope.row.type }}
        span.text-danger(v-else) {{ scope.row.type }}

    el-table-column(label='Date', width='180')
      template(slot-scope='scope')
        i.el-icon-time
        span(style='margin-left: 10px') {{ scope.row.date }}

    el-table-column(label='Ask', width='180')
      template(slot-scope='scope')
        span {{ scope.row.ask.quantity }}

    el-table-column(label='Bid', width='180')
      template(slot-scope='scope')
        span {{ scope.row.bid.quantity }}

    el-table-column(label='Price', width='180')
      template(slot-scope='scope')
        span {{ scope.row.unit_price | humanFloat }}

    el-table-column(label='Operations' align="right")
      template(slot-scope='scope')
        el-button(size='mini', type='danger', @click='cancel(scope.row)') Cancel

</template>

<script>
import moment from 'moment'

import { captureException } from '@sentry/browser'
import { mapGetters } from 'vuex'
import { cancelorder } from '~/store/chain.js'



export default {
  props: {
    marketId: {
      type: Number,
      default: 0
    },

    bids: {
      type: Array,
      default: () => []
    },

    asks: {
      type: Array,
      default: () => []
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapGetters('chain', ['rpc']),


    orders() {
      if (!this.user) return []

      return [...this.asks, ...this.bids].filter(a => a.account == this.user.name).map((o) => {
        o.date = moment(o.timestamp).format('DD-MM HH:mm')
        o.type = o.bid.symbol.symbol == 'EOS' ? 'bid' : 'ask'

        return o
      })
    }
  },

  methods: {
    async cancel(order) {
      if (!this.user) return this.$notify({ title: 'Authorization', message: 'Pleace login first', type: 'info' })

      const loading = this.$loading({ lock: true, text: 'Wait for Scatter' })

      try {
        await cancelorder(this.user.name, this.market_id, order.type, order.id)

        this.$notify({ title: 'Success', message: `Order canceled ${order.id}`, type: 'success' })
        this.$emit('update')
      } catch (e) {
        captureException(e, {extra: { order, market_id: this.market_id }})
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    }
  }
}

</script>
