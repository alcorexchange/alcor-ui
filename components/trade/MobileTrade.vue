<template lang="pug">
.mobile-trade-inner
  //favorites-top-line

  top-line

  .chart.mt-2
    chart
      #tv_chart_container

  .row.mt-1.orderbook
    .col.pr-1
      el-tabs.h-100(type="border-card" size="small").border-tabs
        el-tab-pane(label='Orderbook')
          order-book
        el-tab-pane(label='Depth Chart')
          depth-chart(
            :is-draggable='false',
            :is-resizable='false',
            :is-mirrored='false',
            :vertical-compact='false',
            :margin='[10, 10]',
            :use-css-transforms='false',
          )
    .col.pl-0
      el-tabs.h-100(type="border-card" size="small" v-model="trade").border-tabs
        el-tab-pane(label='Limit Trade' name="limit").p-2
          el-radio-group.el-radio-full-width(v-model='side', size='small').mt-2
            el-radio-button(label='buy').buy Buy
            el-radio-button(label='sell').sell Sell

          .d-flex.mt-4
            span.capitalize(:class='textColor(side)') {{ side }} {{ quote_token.symbol.name }}

            small.text-mutted.small.align-self-end.ml-auto.cursor-pointer(@click='setAmount(side)')
              | {{ side == "buy" ? baseBalance : tokenBalance | commaFloat }}
              i.el-icon-wallet.ml-1

          label.small Price
          el-input(
            type='number',
            :min='side == "buy" ? "0.00000001" : "0"',
            :step='side == "buy" ? "0.00000001" : "0.0001"',
            v-model='priceBid',
            @change='setPrecisionPrice()',
            placeholder='0',
            clearable
          )
            span.mr-1.ml-2(slot='suffix') {{ base_token.symbol.name }}

          label.small Amount
          el-input(
            v-if='side == "buy"',
            type='number',
            v-model='amountBuy',
            @change='setPrecisionAmountBuy()',
            size='medium',
            placeholder='0',
            clearable
          )
            span.mr-1(slot='suffix') {{ quote_token.symbol.name }}

          el-input(
            v-if='side == "sell"',
            type='number',
            v-model='amountSell',
            @change='setPrecisionAmountSell()',
            size='medium',
            placeholder='0',
            clearable
          )
            span.mr-1(slot='suffix') {{ quote_token.symbol.name }}

          .px-1
            el-slider(
              v-if='side == "buy"',
              :step='1',
              v-model='percentBuy'
              :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
              :show-tooltip="false"
            )
            el-slider(
              v-if='side == "sell"',
              :step='1',
              v-model='percentSell'
              :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
              :show-tooltip="false"
            )

          label.small.mt-4 Total
          el-input(
            v-if='side == "buy"',
            type='number',
            v-model='totalBuy',
            @change='setPrecisionTotalBuy()',
            placeholder='0',
            size='medium'
          )
            span.mr-1(slot='suffix') {{ base_token.symbol.name }}

          el-input(
            v-if='side == "sell"',
            type='number',
            v-model='totalSell',
            @change='setPrecisionTotalSell()',
            placeholder='0',
            size='medium'
          )
            span.mr-1(slot='suffix') {{ base_token.symbol.name }}

          el-button.w-100.mt-4.capitalize(
            :type='side == "buy" ? "success" : "danger"',
            size='small',
            @click='actionOrder(trade, side)'
          ) {{ side }}

        el-tab-pane(label='Market' name="market").p-2
          el-radio-group.el-radio-full-width(v-model='side', size='small').mt-2
            el-radio-button(label='buy').buy Buy
            el-radio-button(label='sell').sell Sell

          .d-flex.mt-4
            span.capitalize(:class='textColor(side)') {{ side }} {{ quote_token.symbol.name }}

            small.text-mutted.small.align-self-end.ml-auto.cursor-pointer(@click='setAmount(side)')
              | {{ side == "buy" ? baseBalance : tokenBalance | commaFloat }}
              i.el-icon-wallet.ml-1

          label.small.mt-3 Price
          el-input(
            type='number',
            disabled,
            placeholder='Buy at best price'
          )

          label.small.mt-3 Amount
          el-input(
            v-if='side == "buy"',
            type='number',
            v-model='totalBuy',
            placeholder='0',
            clearable
          )
            span.mr-1(slot='suffix') {{ base_token.symbol.name }}

          el-input(
            v-if='side == "sell"',
            type='number',
            v-model='amountSell',
            placeholder='0',
            clearable
          )
            span.mr-1(slot='suffix') {{ quote_token.symbol.name }}

          .px-1.mt-3
            el-slider(
              v-if='side == "buy"',
              :step='25',
              v-model='percentBuyMarket',
              show-stops
              :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
              :show-tooltip="false"
            )
            el-slider(
              v-if='side == "sell"',
              :step='25',
              v-model='percentSell',
              show-stops
              :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
              :show-tooltip="false"
            )

          el-button.w-100.mt-5.capitalize(
            :type='side == "buy" ? "success" : "danger"',
            size='small',
            @click='actionOrder(trade, side)'
          ) {{ side }}

  .row.mt-1
    .col
      alcor-tabs(type="border-card").border-tabs
        template(slot='right')
          .d-flex.pairs-switch-right
            .module-name.mr-2 Hide other pairs
            .module-pickers.d-flex.flex-row
              el-switch(v-model='hideOtherPairs', active-color='#13ce66', inactive-color='#161617')
        el-tab-pane(label='Open order')
          my-orders(:only-current-pair="hideOtherPairs")
        el-tab-pane(label='Trade History')
          my-trade-history(:only-current-pair="hideOtherPairs")
        el-tab-pane(label='Funds')
          my-funds(:only-current-pair="hideOtherPairs")
</template>

<script>
import { mapGetters } from 'vuex'

import { trade } from '~/mixins/trade'

import OrderBook from '~/components/trade/OrderBook'
import Chart from '~/components/trade/Chart'
import TokenImage from '~/components/elements/TokenImage'
import MyOrders from '~/components/trade/MyOrders'
import TopLine from '~/components/trade/TopLine'
import LatestDeals from '~/components/trade/LatestDeals'
import FavoritesTopLine from '~/components/trade/FavoritesTopLine'
import MyTradeHistory from '~/components/trade/MyTradeHistory'
import MyFunds from '~/components/trade/MyFunds'
import DepthChart from '~/components/trade/DepthChart'

export default {
  components: {
    OrderBook,
    Chart,
    TokenImage,
    MyOrders,
    TopLine,
    LatestDeals,
    FavoritesTopLine,
    MyFunds,
    MyTradeHistory,
    DepthChart
  },

  mixins: [trade],

  data() {
    return {
      side: 'buy',
      trade: 'limit',

      hideOtherPairs: false
    }
  },

  computed: {
    ...mapGetters(['user']),

    percentBuy: {
      get() {
        return this.percent_buy
      },
      set(val) {
        this.changePercentBuy({ percent: val, trade: 'limit' })
      },
    },
    percentBuyMarket: {
      get() {
        return this.percent_buy
      },
      set(val) {
        this.changePercentBuy({ percent: val, trade: 'market' })
      },
    },
  },

  methods: {
    textColor(side) {
      return side == 'buy' ? 'text-success' : 'text-danger'
    },
  },
}
</script>

<style lang="scss">
.mobile-trade-inner {
  width: 100%;
  background: #121212;
  padding: 10px;
  font-size: 12px !important;

  .header-items-container {
    scroll-behavior: none;
  }

  .trade-top-line {
    background: var(--table-background);

    width: 100%;
    display: flex;
    flex-flow: row;
    flex-wrap: nowrap;
    overflow: scroll;
  }

  .trade-top-line::-webkit-scrollbar {
    display: none;
  }

  .chart {
    height: 400px;
    margin-top: 10px;
  }
  .el-tabs__item {
    padding-left: 10px !important;
    padding: 0px 10px !important;
  }

  .el-tabs__item, .el-table {
    font-size: 11px !important;
  }

  .module-name {
    margin-left: auto;
    font-size: 11px;
  }

  .el-tabs__content {
    padding: 0px !important;
  }

  .order-book {
    height: 380px;
  }

  .el-slider__marks-text, .el-input, .el-input__inner {
    font-size: 10px;
  }

  label.buy.is-active {
    .el-radio-button__inner {
      background-color: var(--main-green) !important;
    }
  }

  label.sell.is-active {
    .el-radio-button__inner {
      background-color: var(--main-red) !important;
    }
  }
}

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
