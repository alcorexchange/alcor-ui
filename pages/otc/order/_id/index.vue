<template lang="pug">

el-card(v-if="!no_found" v-loading="loading").box-card.mt-3
  .clearfix(slot='header')
    el-page-header(@back="goBack")
      template(slot="content")
        span Order {{ order.id }} created by
        a(:href="monitorAccount(order.maker)" target="_blank")  {{ order.maker }}
  .text.item(v-if="order.maker")
    .row.mb-3
      .col-6.text-center.bordered
        h2 Sell

        hr

        TokenImage(:src="$tokenLogo(order.sell.quantity.split(' ')[1], order.sell.contract)" height="50").mr-2.mb-2

        .lead {{ order.sell.quantity }}@
          a(:href="monitorAccount(order.sell.contract)" target="_blank") {{ order.sell.contract }}
      .col-6.text-center
        h2 Buy

        hr

        TokenImage(:src="$tokenLogo(order.buy.quantity.split(' ')[1], order.buy.contract)" height="50").mr-2.mb-2

        .lead {{ order.buy.quantity }}@
          a(:href="monitorAccount(order.buy.contract)" target="_blank") {{ order.buy.contract }}

    PleaseLoginButton
      el-button(v-if="user && order.maker == user.name" type="warning" @click="cancelOrder").w-100 Cancel order
      el-button(v-else type="primary" @click="buy").w-100 Buy
        |  {{ order.sell.quantity }}@{{ order.sell.contract }}

el-card(v-else).box-card.mt-3
  .clearfix(slot='header')
    span Order: {{ id }}
    el-button(@click="$router.push({name: 'index'})" style='float: right; padding: 3px 0', type='text') Go to main page
  .text.item.text-center
    h1.display-4 Order {{ id }} not found or finished
</template>

<script>
import { captureException } from '@sentry/browser'
import { mapActions, mapGetters } from 'vuex'

import TokenImage from '~/components/elements/TokenImage'
import PleaseLoginButton from '~/components/elements/PleaseLoginButton'

import config from '~/config'

export default {
  components: {
    TokenImage,
    PleaseLoginButton
  },

  async asyncData({ store, error, params, $rpc }) {
    const contract = store.state.network.otc.contract

    try {
      const {
        rows: [order]
      } = await $rpc.get_table_rows({
        code: contract,
        scope: contract,
        table: 'orders',
        lower_bound: params.id,
        limit: 1
      })

      if (order && order.id == params.id) {
        return { order, loading: false }
      } else {
        // TODO Redirect if order in history
        error({
          message: `Order ${params.id} not found or finished`,
          statusCode: 404
        })
      }
    } catch (e) {
      captureException(e)
      return error({ message: 'Error fetching order: ' + e, statusCode: 500 })
    }
  },

  data() {
    return {
      order: {},
      no_found: false,
      loading: true
    }
  },

  computed: {
    ...mapGetters(['user'])
  },

  methods: {
    ...mapActions('chain', ['login', 'transfer', 'sendTransaction']),

    async cancelOrder(order) {
      try {
        const order = this.order

        await this.sendTransaction([
          {
            account: this.$store.state.network.otc.contract,
            name: 'cancelorder',
            authorization: [
              {
                actor: order.maker,
                permission: this.user.authorization.permission
              }
            ],
            data: { maker: order.maker, order_id: order.id }
          }
        ])

        this.$notify({
          title: 'Success',
          message: `Order canceled ${order.id}`,
          type: 'success'
        })
        this.$router.push({ name: 'otc' })
      } catch (e) {
        captureException(e, { extra: { order } })
        this.$notify({
          title: 'Place order',
          message: e.message,
          type: 'error'
        })
        console.log(e)
      }
    },

    async buy() {
      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter'
      })

      try {
        const { buy, id } = this.order

        const r = await this.transfer({
          to: this.$store.state.network.otc.contract,
          contract: buy.contract,
          actor: this.user.name,
          quantity: buy.quantity,
          memo: `fill|${id}`
        })

        this.$alert(
          `<a href="${config.monitor}/tx/${r.transaction_id}" target="_blank">Transaction id</a>`,
          'Transaction complete!',
          {
            dangerouslyUseHTMLString: true,
            confirmButtonText: 'OK',
            callback: (action) => {
              this.$router.push({ name: 'otc' })
              this.$notify({
                title: 'Success',
                message: `You fill ${id} order`,
                type: 'success'
              })
            }
          }
        )
      } catch (e) {
        captureException(e, { extra: { order: this.order } })
        this.$notify({
          title: 'Place order',
          message: e.message,
          type: 'error'
        })
        console.log(e)
      } finally {
        loading.close()
      }
    },

    goBack() {
      this.$router.go(-1)
    }
  },

  head() {
    return {
      title: `Alcor OTC swap | Sell ${this.order.sell.quantity} for ${this.order.buy.quantity} by ${this.order.maker}`
    }
  }
}
</script>

<style>
.bordered {
  border-right: 1px solid;
}
</style>
