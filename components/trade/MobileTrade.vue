<template lang="pug">

.row
  .col
    .row
      .col
        top-line
    chart

    //.text.item
      MobileTrade

    .row.mt-2
      .col-6.pr-0
        .row.mb-2
          .col
            el-radio-group(v-model="side" size="small").el-radio-full-width
              el-radio-button(label='buy') Buy
              el-radio-button(label='sell') Sell

        .row
          .col
            el-select(v-model='trade', placeholder='Trade' size="small")
              el-option(label='Limit Trade', value='limit')
              el-option(label='Market Trade', value='market')

        .row.mt-2
          .col

            span(
              class="capitalize"
              :class="textColor(side)"
            ) {{ side }} {{ quote_token.symbol.name }}
            br
            small(
              class="text-mutted small align-self-end ml-auto cursor-pointer"
              @click="setAmount(side)"
            ) {{ side == 'buy' ? baseBalance : tokenBalance | commaFloat }}
              i.el-icon-wallet.ml-1
            br

            div(v-if="trade == 'limit'")

              label.small Price
              el-input(
                type="number"
                :min="side == 'buy' ? '0.00000001' : '0'"
                :step="side == 'buy' ? '0.00000001' : '0.0001'"
                v-model="priceBid"
                @change="setPrecisionPrice()"
                placeholder="0"
                clearable
              )
                span(
                  class="mr-1 ml-2"
                  slot="suffix"
                ) {{ base_token.symbol.name }}

              label.small Amount
              el-input(
                v-if="side == 'buy'"
                type="number"
                v-model="amountBuy"
                @change="setPrecisionAmountBuy()"
                size="medium"
                placeholder="0"
                clearable
              )
                span(slot="suffix").mr-1 {{ quote_token.symbol.name }}

              el-input(
                v-if="side == 'sell'"
                type="number"
                v-model="amountSell"
                @change="setPrecisionAmountSell()"
                size="medium"
                placeholder="0"
                clearable
              )
                span(slot="suffix").mr-1 {{ quote_token.symbol.name }}

              el-slider(v-if="side == 'buy'" :step="1" v-model="percentBuy")
              el-slider(v-if="side == 'sell'" :step="1" v-model="percentSell")

              label.small Total
              el-input(
                v-if="side == 'buy'"
                type="number"
                v-model="totalBuy"
                @change="setPrecisionTotalBuy()"
                placeholder="0"
                size="medium"
              )
                span(slot="suffix").mr-1 {{ base_token.symbol.name }}

              el-input(
                v-if="side == 'sell'"
                type="number"
                v-model="totalSell"
                @change="setPrecisionTotalSell()"
                placeholder="0"
                size="medium"
              )
                span(slot="suffix").mr-1 {{ base_token.symbol.name }}

            div(v-else)

              label.small Price
              el-input(type="number" disabled placeholder="Buy at best price")

              label.small Amount
              el-input(
                v-if="side == 'buy'"
                type="number"
                v-model="totalBuy"
                placeholder="0"
                clearable
              )
                span(slot="suffix").mr-1 {{ base_token.symbol.name }}

              el-input(
                v-if="side == 'sell'"
                type="number"
                v-model="amountSell"
                placeholder="0"
                clearable
              )
                span(slot="suffix").mr-1 {{ quote_token.symbol.name }}

              el-slider(v-if="side == 'buy'" :step="25" v-model="percentBuyMarket" show-stops)
              el-slider(v-if="side == 'sell'" :step="25" v-model="percentSell" show-stops)

            el-button(
              class="w-100 mt-2 capitalize"
              :type="side == 'buy' ? 'success' : 'danger'"
              size="small"
              @click="actionOrder(trade, side)"
            ) {{ side }}

      .col-6.pl-0.mb-4
        OrderBook

    .row.mt-2.mobile-terminal
      .col
        //.overflowbox.low-height.overflow-hidden
        el-tabs.h-100
          el-tab-pane(label="Open order")
            my-orders(v-if="user")

          el-tab-pane(label="Order history")
            my-history(v-if="user")

    .row.mt-3
      .col
        LatestDeals
</template>

<script>
import { mapGetters } from 'vuex'

import { trade } from '~/mixins/trade'

import MyHistory from '~/components/trade/MyHistory'
import OrderBook from '~/components/trade/OrderBook'
import Chart from '~/components/trade/Chart'
import TokenImage from '~/components/elements/TokenImage'
import MyOrders from '~/components/trade/MyOrders'
import TopLine from '~/components/trade/TopLine'
import LatestDeals from '~/components/trade/LatestDeals'

export default {
  components: {
    OrderBook,
    Chart,
    TokenImage,
    MyOrders,
    MyHistory,
    TopLine,
    LatestDeals
  },

  mixins: [trade],

  data() {
    return {
      side: 'buy',
      trade: 'limit'
    }
  },

  computed: {
    ...mapGetters(['user']),
    percentBuy: {
      get() { return this.percent_buy },
      set(val) { this.changePercentBuy({ percent: val, trade: 'limit' }) }
    },
    percentBuyMarket: {
      get() { return this.percent_buy },
      set(val) { this.changePercentBuy({ percent: val, trade: 'market' }) }
    }
  },

  methods: {
    textColor(side) {
      return side == 'buy' ? 'text-success' : 'text-danger'
    }
  }
}
</script>

<style lang="scss">
.mobile-terminal {
  .el-table {
    font-size: 10px;

    .el-table__header-wrapper {
      th {
        font-weight: 100;
      }
    }
  }
}
.cursor-pointer {
  cursor: pointer;
}
.capitalize {
  text-transform: capitalize;
}
</style>
