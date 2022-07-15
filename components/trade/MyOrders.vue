<template lang="pug">

// MOBILE
el-table.my-orders(:data='filledPositions' :empty-text='$t("No open orders")' v-if="isMobile" max-height="350")
  template(slot="empty")
    span(v-if="user") {{ $t('No open orders') }}
    el-button(v-else type="default" @click='$store.dispatch("modal/login")') {{ $t('Connect Wallet') }}

  el-table-column(:label='$t("Type")' width="50")
    template(slot-scope='{ row }')
      span.text-primary(v-if='row.type == "buy"') {{ $t(row.type.toUpperCase()) }}
      span.text-secondary(v-else) {{ $t(row.type.toUpperCase()) }}

  el-table-column(:label='$t("Price")' width="90")
    template(slot-scope='scope')
      span {{ scope.row.unit_price | humanPrice }}

  el-table-column(:label="$t('Amount')")
    template(slot-scope='{ row }')
      span(v-if="isMobile") {{ row.type == 'buy' ? row.ask.quantity : row.bid.quantity | commaFloat }}
      span(v-else) {{ row.type == 'buy' ? row.ask.quantity : row.bid.quantity | commaFloat }}

  el-table-column(:label="$t('Total') + '(' + base_token.symbol.name + ')'")
    template(slot-scope='{ row }')
      span {{ row.type == 'buy' ? row.bid.quantity : row.ask.quantity }}

  el-table-column(:label='$t("Action")', align='right' width=60)
    template(slot-scope='scope')
      el-button(size='mini', type='text', @click='cancel(scope.row)').cancel {{ $t('Cancel') }}


// DESKTOP
el-table.my-orders(:data='filledPositions' :empty-text='$t("No open orders")' v-else)
  template(slot="empty")
    span(v-if="user") {{ $t('No open orders') }}
    el-button(v-else type="default" @click='$store.dispatch("modal/login")') {{ $t('Connect Wallet') }}

  el-table-column(:label='$t("Time")', width='110')
    template(slot-scope='scope')
      span {{ scope.row.timestamp | moment("MM-DD HH:mm:ss") }}

  el-table-column(:label='$t("Pair")' width=110)
    template(slot-scope='{ row }')
      span.hoverable.pointer(:class="{ underline: id != row.market.id }" @click="setMarket(row.market)") {{ row.market_symbol }}

  el-table-column(:label='$t("Type")' width="50")
    template(slot-scope='{ row }')
      span.text-primary(v-if='row.type == "buy"') {{ $t(row.type.toUpperCase()) }}
      span.text-secondary(v-else) {{ $t(row.type.toUpperCase()) }}

  el-table-column(:label='$t("Price")' width="100")
    template(slot-scope='scope')
      span {{ scope.row.unit_price | humanPrice }}

  el-table-column(:label="$t('Amount')")
    template(slot-scope='{ row }')
      span(v-if="isMobile") {{ row.type == 'buy' ? row.ask.quantity : row.bid.quantity | commaFloat }}
      span(v-else) {{ row.type == 'buy' ? row.ask.quantity : row.bid.quantity | commaFloat }}

  el-table-column(:label="$t('Total') + '(' + base_token.symbol.name + ')'")
    template(slot-scope='{ row }')
      span {{ row.type == 'buy' ? row.bid.quantity : row.ask.quantity }}

  el-table-column(:label='$t("Action")', align='right' width="120")
    template(v-if="!isMobile" slot="header")
      span.mr-1 {{ $t('Action') }}
      span(@click="cancelAll").red.pointer.hoverable (cancel all)

    template(slot-scope='scope')
      el-button(size='mini', type='text', @click='cancel(scope.row)').cancel {{ $t('Cancel') }}

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
    setMarket(market) {
      if (this.id == market.id) return

      if (this.id) {
        this.$store.dispatch('market/unsubscribe', this.id)
      }

      this.$router.push(
        { name: `trade-index-id___${this.$i18n.locale}`, params: { id: market.slug } },
        () => this.loading = false,
        () => this.loading = false
      )
    },

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
          market_id: order.market_id,
          type: order.type,
          order_id: order.id
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

<style scoped>
.market-row div {
  font-size: 13px;
}

.cancel {
  color: var(--main-red) !important;
}

.text-secondary {
  color: var(--color-secondary) !important;
}

.text-primary {
  color: var(--color-primary) !important;
}
</style>
