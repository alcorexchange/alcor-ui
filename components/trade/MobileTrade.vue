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
            div(v-if="trade == 'limit'")
              div(v-if="side == 'buy'")
                span.text-success Buy {{ quote_token.symbol.name }}
                br
                small.text-mutted.small.align-self-end.ml-auto.cursor-pointer(@click="onSetAmount(parseFloat(baseBalance))") {{ baseBalance | commaFloat }}
                  i.el-icon-wallet.ml-1
                br

                label.small Price
                el-input(type="number" min="0.00000001" step="0.00000001" v-model="price" clearable @change="fixPrice()" @input="priceChange()")
                  span(slot="suffix").mr-1 {{ base_token.symbol.name }}

                label.small Amount
                el-input(type="number" v-model="amount" @input="amountChange(false, true)" @change="setPrecisions" clearable size="medium")
                  span(slot="suffix").mr-1 {{ quote_token.symbol.name }}

                el-slider(:step="1" v-model="eosPercent")

                label.small Total
                el-input(type="number" v-model="total" @input="totalChange(false, true)"  @change="setPrecisions" size="medium")
                  span(slot="suffix").mr-1 {{ base_token.symbol.name }}

                el-button(size="small" type="success" @click="buy(trade)").w-100.mt-2 Buy

              div(v-else)
                span.text-danger Sell {{ quote_token.symbol.name }}
                br
                small.text-mutted.small.align-self-end.ml-auto.cursor-pointer(@click="onSetAmount(parseFloat(tokenBalance))") {{ tokenBalance | commaFloat }}
                  i.el-icon-wallet.ml-1
                br

                label.small Price
                el-input(type="number" min="0" step="0.0001" value="0" v-model="price" clearable @change="fixPrice()" @input="priceChange()")
                  span(slot="suffix").mr-1.ml-2 {{ base_token.symbol.name }}

                label.small Amount
                el-input(type="number" v-model="amount" @input="amountChange(false, true)" @change="setPrecisions" clearable size="medium")
                  span(slot="suffix").mr-1 {{ quote_token.symbol.name }}

                el-slider(v-model="tokenPercent")

                label.small Total
                el-input(type="number" v-model="total" @input="totalChange(false, true)"  @change="setPrecisions" size="medium")
                  span(slot="suffix").mr-1 {{ base_token.symbol.name }}

                el-button(size="small" type="danger" @click="sell(trade)").w-100.mt-2 Sell

            div(v-else)
              div(v-if="side == 'buy'")
                span.text-success Buy {{ quote_token.symbol.name }}
                br
                span.text-mutted.small.align-self-end.ml-auto.cursor-pointer(@click="onSetAmount(parseFloat(baseBalance))") balance: {{ baseBalance | commaFloat }}
                br

                label.small Price
                el-input(type="number" disabled placeholder="Buy at best price")

                label.small Total
                el-input(type="number" clearable v-model="total")
                  span(slot="suffix").mr-1 {{ base_token.symbol.name }}

                el-slider(:step="25" v-model="eosPercent" show-stops)

                el-button(type="success" size="small" @click="buy(trade)").w-100 Buy
              div(v-else)
                span.text-danger Sell {{ quote_token.symbol.name }}
                br
                span.text-mutted.small.align-self-end.ml-auto.cursor-pointer(@click="onSetAmount(parseFloat(tokenBalance))") balance: {{ tokenBalance | commaFloat }}
                br

                label.small Amount
                el-input(type="number" disabled placeholder="Buy at best price")

                label.small Amount
                el-input(type="number" v-model="amount" clearable)
                  span(slot="suffix").mr-1 {{ quote_token.symbol.name }}

                el-slider(:step="25" v-model="tokenPercent" show-stops)

                el-button(type="danger" size="small" @click="sell(trade)").w-100 Sell

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
import { mapGetters, mapState } from 'vuex'

import { tradeMixin, tradeChangeEvents } from '~/mixins/trade'

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

  mixins: [tradeMixin, tradeChangeEvents],

  data() {
    return {
      side: 'buy',
      trade: 'limit'
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapState('market', [
      'token',
      'id',
      'stats',
      'quote_token',
      'base_token'
    ]),
    ...mapGetters('market', [
      'sorted_asks',
      'sorted_bids',
      'baseBalance',
      'tokenBalance'
    ]),
    ...mapGetters(['user'])
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
</style>
