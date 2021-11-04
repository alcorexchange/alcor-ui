<template lang="pug">
<<<<<<< HEAD
.row
  .col-12
    coin-info
    chart
  .col-12.wrapBid
    .row
      .col-6
        el-button.btn(
          type="success"
          @click="showDrawer('buy')"
        ) Buy
      .col-6
        el-button.btn(
          type="danger"
          @click="showDrawer('sell')"
        ) Sell
  .col-12
    el-tabs.h-100.order
      el-tab-pane(label="Open order")
        my-orders(v-if="user")
      el-tab-pane(label="Order history")
        my-history(v-if="user")
      el-tab-pane(label="Order book")
        order-book
      el-tab-pane(label="Latest deals")
        latest-deals
  //- TODO разобраться с заголовком и высотой, у заголовка убрать огромный маргин а высоту сделать адаптивной
=======
.wrap-trade
  coin-info.coin
  chart.chart
  bid(
    class="bid"
    :type="bidType"
    @setType="bidType = $event"
  )
  .button-bid
    el-button.btn(
      type="success"
      @click="showDrawer('buy')"
    ) Buy
    el-button.btn(
      type="danger"
      @click="showDrawer('sell')"
    ) Sell
  order-book.book
  latest-deals.deals
  .my-info
    my-orders.orders(v-if="user")
    my-history.history(v-if="user")
  .tabs-panel
    el-tabs.h-100.order(tabPosition="top")
      el-tab-pane(label="Order")
        my-orders.test(v-if="user")
      el-tab-pane(label="History")
        my-history(v-if="user")
  .tabs-panel-mobile
    el-tabs.h-100.order(tabPosition="top")
      el-tab-pane(label="Order")
        my-orders.test(v-if="user")
      el-tab-pane(label="History")
        my-history(v-if="user")
      el-tab-pane(label="Book")
        order-book
      el-tab-pane(label="Deals")
        latest-deals
>>>>>>> 42e18c86f8aad1a3f552a58d2d4f67829af91f23
  el-drawer(
    :visible.sync="isDrawer"
    :close-on-press-escape="true"
    :modal="true"
    direction="btt"
<<<<<<< HEAD
    size="80%"
  )
    bid(:type="bidType")
=======
    size="87%"
  )
    bid(
      :type="bidType"
      @setType="bidType = $event"
    )
>>>>>>> 42e18c86f8aad1a3f552a58d2d4f67829af91f23
</template>

<script>
import { mapGetters } from 'vuex'

import CoinInfo from '~/components/trade/CoinInfo.vue'
import Chart from '~/components/trade/Chart.vue'
import MyOrders from '~/components/trade/MyOrders.vue'
import MyHistory from '~/components/trade/MyHistory.vue'
import OrderBook from '~/components/trade/OrderBook.vue'
import LatestDeals from '~/components/trade/LatestDeals.vue'
import Bid from '~/components/trade/Bid.vue'

export default {
  components: {
    CoinInfo,
    Chart,
    MyOrders,
    MyHistory,
    LatestDeals,
    OrderBook,
    Bid
  },

  data() {
    return {
      isDrawer: false,
      bidType: 'buy'
    }
  },

  computed: {
    ...mapGetters(['user'])
  },

  methods: {
    showDrawer(type) {
      this.bidType = type
      this.isDrawer = true
    }
  }
}
</script>

<style lang="scss" scoped>
<<<<<<< HEAD
  .wrapBid {
    margin-top: 10px;
    .btn {
      width: 100%;
    }
  }
  .order {
    box-shadow: 0px 2px 13px 1px rgb(0 0 0 / 10%);
    background-color: #2a2a2a;
    margin-top: 10px;
    margin-bottom: 15px;
    padding: 10px 15px;
=======
.wrap-trade {
  @media (min-width: 768px) {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: 1fr 1fr 260px;
    grid-template-rows: auto 1fr 320px;
    @media (min-width: 768px) {
      grid-template-columns: 230px 1fr 260px;
    }
    @media (min-width: 984px) {
      grid-template-columns: 330px 1fr 260px;
    }
  }
  .coin {
    grid-row: 1;
    grid-column: 1/-1;
    @media (min-width: 1024px) {
      grid-column: 2;
    }
  }
  .chart {
    grid-row: 2;
    grid-column: 1/3;
    @media (min-width: 1024px) {
      grid-column: 2;
    }
  }
  .bid {
    grid-row: 2/4;
    grid-column: 3;
    background: var(--bg-big-card);
    box-shadow: var(--card-shadow);
    padding: 10px;
    @media (max-width: 767px) {
      display: none;
    }
    @media (min-width: 1024px) {
      grid-row: 1/3;
    }
  }
  .button-bid {
    display: none;
    width: 100%;
    margin: 10px 0;
    button {
      width: 100%;
    }
    @media (max-width: 767px) {
      display: flex;
    }
  }
  .book {
    grid-column: 1;
    grid-row: 3;
    @media (min-width: 1024px) {
      padding: 10px;
      background: var(--bg-big-card);
      box-shadow: var(--card-shadow);
      grid-row: 1/3;
      grid-column: 1;
    }
  }
  .deals {
    grid-row: 3;
    @media (min-width: 1024px) {
      background: var(--bg-big-card);
      box-shadow: var(--card-shadow);
      padding: 5px;
    }
  }
  &>.book, &>.deals {
    @media (max-width: 767px) {
      display: none;
    }
  }
  .my-info {
    grid-column: 2/-1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 10px;
    @media (max-width: 1439px) {
      display: none;
    }
    .orders, .history {
      background: var(--bg-big-card);
      box-shadow: var(--card-shadow);
      max-height: 100%!important;
    }
  }
  .tabs-panel {
    background: var(--bg-big-card);
    box-shadow: var(--card-shadow);
    padding: 10px;
    grid-column: 1/-1;
    @media (max-width: 767px) {
      display: none;
    }
    @media (min-width: 1024px) {
      grid-column: 2/-1;
    }
    @media (min-width: 1440px) {
      display: none;
    }
  }
  .tabs-panel-mobile {
    grid-column: 1/-1;
    @media (min-width: 768px) {
      display: none;
    }
  }
}
</style>

<style lang="scss">
  .book {
    @media (min-width: 768px) {
      .orders-list {
        max-height: 130px;
      }
    }
    @media (min-width: 1024px) {
      max-height: inherit;
      .orders-list {
        max-height: 230px;
      }
    }
  }
  .my-info {
    .history .el-table__body-wrapper {
      max-height: 80%!important;
    }
  }
  .el-drawer__wrapper .el-drawer.btt {
    overflow: auto;
    .el-drawer__header {
      padding: 10px;
      margin-bottom: 5px;
    }
>>>>>>> 42e18c86f8aad1a3f552a58d2d4f67829af91f23
  }
</style>
