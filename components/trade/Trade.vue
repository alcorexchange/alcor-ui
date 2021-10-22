<template lang="pug">
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
        my-orders.test(v-if="user")
      el-tab-pane(label="Order history")
        my-history(v-if="user")
      el-tab-pane(label="Order book")
        order-book
      el-tab-pane(label="Latest deals")
        latest-deals
  //- TODO разобраться с заголовком и высотой, у заголовка убрать огромный маргин а высоту сделать адаптивной
  el-drawer(
    :visible.sync="isDrawer"
    :close-on-press-escape="true"
    :modal="true"
    direction="btt"
    size="80%"
  )
    bid(
      :type="bidType"
      @setType="bidType = $event"
    )
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
  .wrapBid {
    margin-top: 10px;
    .btn {
      width: 100%;
    }
  }
  .order {
    background: var(--bg-big-card);
    box-shadow: var(--card-shadow);
    margin-top: 10px;
    margin-bottom: 15px;
    padding: 5px;
  }
</style>
