<template lang="pug">
.el-card.resource-page-card(v-if="account")
  .header
      i.el-icon-present
      span.text Genesis and Voting Rewards
  .main
    .item
      span.key.fwr Available Balance:
      span.value  {{ account.core_liquid_balance }}
    .item
      span.key.fwr Refunding CPU:
      span.value  {{ account.refund_request && account.refund_request.cpu_amount }}
    .item
      span.key.fwr Refunding NET:
      span.value  {{ account.refund_request && account.refund_request.net_amount }}

    .item.mt-2(v-if="account.refund_request")
      el-popover(:disabled="isRefundAvailable" placement='top-start' title='Refund' trigger='hover')
        template
          span Your refund will be available at {{ availableAt | moment('DD-MM HH:mm') }}
        div(slot="reference")
          el-button(v-loading="loading" size="big" @click="refund" :disabled="!isRefundAvailable").w-100 Refund

</template>

<script>
import { mapState } from 'vuex'

const REFUND_TIME = 60 * 60 * 24 * 3 // 3 days

export default {
  name: 'RewardsCard',

  data() {
    return {
      loading: false
    }
  },

  computed: {
    ...mapState(['account', 'user']),

    isRefundAvailable() {
      const { refund_request: { request_time }, head_block_time } = this.account
      const delta = new Date(head_block_time).getTime() / 1000 - new Date(request_time).getTime() / 1000
      return delta >= REFUND_TIME
    },

    availableAt() {
      const t = new Date(this.account.refund_request.request_time)
      t.setSeconds(t.getSeconds() + REFUND_TIME)
      return t
    }
  },

  methods: {
    async refund() {
      this.loading = true

      try {
        const authorization = [this.user.authorization]
        await this.$store.dispatch('chain/sendTransaction', [
          {
            account: 'eosio',
            name: 'refund',
            authorization,
            data: { owner: this.user.name }
          }
        ])
        this.$notify({ type: 'success', message: 'Refunded!' })
      } catch (e) {
        this.$notify({ type: 'error', message: e.message })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.resource-page-card {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
}
.item {
  padding-bottom: 10px;
}
</style>
