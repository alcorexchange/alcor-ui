<template lang="pug">
.mobile-trade-inner
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
      order-form-vertical

  .row.mt-2
    .col
      alcor-tabs(type="border-card").border-tabs
        template(slot='right')
          .d-flex.pairs-switch-right
            .module-name.mr-2 Hide other pairs
            .module-pickers.d-flex.flex-row
              el-switch(v-model='hideOtherPairs', active-color='#13ce66', inactive-color='#161617')
        el-tab-pane(label='Open orders')
          my-orders(:only-current-pair="hideOtherPairs")
        el-tab-pane(label='Trade History')
          my-trade-history(:only-current-pair="hideOtherPairs")
        el-tab-pane(label='Funds')
          my-funds(:only-current-pair="hideOtherPairs")

  .latest-deals.mt-2.mb-4
    LatestDeals
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
import OrderFormVertical from '~/components/trade/OrderFormVertical'

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
    DepthChart,
    OrderFormVertical
  },

  mixins: [trade],

  data() {
    return {
      hideOtherPairs: false
    }
  }
}
</script>

<style lang="scss">
.mobile-trade-inner {
  width: 100%;
  background: #121212;
  padding: 10px;
  font-size: 12px !important;

  .latest-deals {
    height: 250px;
  }

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
