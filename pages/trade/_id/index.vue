<template lang="pug">
// TODO Сделать подгрузку инфы о токене с сервиса там о дапах который

.row
  .col
    .box-card.mt-3(v-if="!no_found")
      .row.mb-3
        .col-md-4
          .lead
            TokenImage(:src="$tokenLogo(token.symbol.name, token.contract)" height="40").mr-2.ml-1
            | {{ token.symbol.name }}@
            a(:href="monitorAccount(token.contract )" target="_blank") {{ token.contract }}
        .col-md-8.d-flex.align-items-center
          .text.item
            span Volume 24H:
            span.text-success  {{ volume24 }}

      .text.item
        .row.trade-window
          .col-lg-5
            order-book(v-loading="loading")

            .row
              .col
                LatestDeals.mt-2
          .col-lg-7
            .row
              .col
                chart

            .row
              .col
                el-tabs.h-100
                  el-tab-pane(label="Limit trade")
                    LimitTrade

                  el-tab-pane(label="Market trade")
                    market-trade
        hr
        .row
          .col
            my-orders(v-if="user" v-loading="loading")

    .box-card(v-else).mt-3
      .clearfix(slot='header')
        span Market: {{ market.id }}
        el-button(@click="$router.push({name: 'index'})" style='float: right; padding: 3px 0', type='text') Go to main page
      .text.item.text-center
        h1.display-4 Order {{ market.id }} not found or finished
</template>

<script>
import { captureException } from '@sentry/browser'
import { mapGetters, mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import AssetImput from '~/components/elements/AssetInput'

import MarketTrade from '~/components/trade/MarketTrade'
import LimitTrade from '~/components/trade/LimitTrade'
import MyOrders from '~/components/trade/MyOrders'
import OrderBook from '~/components/trade/OrderBook'
import LatestDeals from '~/components/trade/LatestDeals'
import Chart from '~/components/trade/Chart'

export default {
  components: {
    TokenImage,
    AssetImput,
    MarketTrade,
    MyOrders,
    LimitTrade,
    OrderBook,
    LatestDeals,
    Chart
  },

  async fetch({ store, error, params }) {
    store.commit('market/setId', params.id)

    this.loading = true
    try {
      await store.dispatch('market/fetchMarket')
    } catch (e) {
      captureException(e)
      return error({ message: e, statusCode: 500 })
    } finally {
      this.loading = false
    }
  },

  data() {
    return {
      market: {},

      price: 0.0,
      amount: 0.0,

      no_found: false,
      loading: false
    }
  },

  computed: {
    ...mapGetters('chain', ['rpc', 'scatter']),
    ...mapState('market', ['token']),
    ...mapGetters(['user']),
    ...mapGetters('market', ['volume24'])
  },

  created() {
    // Auto update orders
    setInterval(() => { this.$store.dispatch('market/fetchMarket') }, 15000)
  },

  head() {
    return {
      title: `Alcor Exchange | Market ${this.token.symbol.name}`,

      meta: [
        // hid is used as unique identifier. Do not use `vmid` for it as it will not work
        { hid: 'description', name: 'description', content: `Trade ${this.token.str} token for EOS` }
        //{ name: 'viewport', content: 'user-scalable = yes' }

      ]
    }
  }
}
</script>

<style>
.bordered {
  border-right: 1px solid;
}

.trade-window {
  min-height: 650px;
}

.el-form-item {
  margin-bottom: 0px;
}

input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.display-4 {
  font-size: 2.5rem;
  font-weight: 230;
  line-height: 1;
}
</style>
