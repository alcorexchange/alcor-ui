<template lang="pug">
.trading-terminal
  client-only
    grid-layout(
      :layout='layouts_grid',
      :col-num='24',
      :row-height='40',
      :is-draggable='true',
      :is-resizable='true',
      :is-mirrored='false',
      :vertical-compact='true',
      :margin='[4, 4]',
      :use-css-transforms='true'
      @layout-updated="layoutUpdatedEvent"
      @breakpoint-changed="layoutUpdatedEvent"
      v-if="layouts.length > 0")

      grid-item.overflowbox(
        v-for='item in layouts.filter(i => i.status)',
        :key="item.i",
        :x='item.x',
        :y='item.y',
        :w='item.w',
        :h='item.h',
        :i='item.i',
        :static="current_market_layout != 'advanced'"
        :min-w='parseInt(item.mw)',
        :min-h='parseInt(item.mh)',
        :class='item.i',
        @resize="itemUpdatedEvent(item)"
        @resized='itemUpdatedEvent(item)',
        @move="itemUpdatedEvent(item)"
        @moved='itemUpdatedEvent(item)',
        @container-resized='itemUpdatedEvent(item)'
        drag-ignore-from='.el-tabs__item, .depth-chart, a, button, .orders-list, .desktop',
        drag-allow-from='.el-tabs__header, .times-and-sales, .box-card'
      )
        .right-icons
          .d-flex.align-items-center.mr-2(v-if="item.i == 'open-order'")
            .module-name.mr-2 Hide other pairs
            .module-pickers.d-flex.flex-row
              el-switch(
                v-model='hideOtherPairs',
                active-color='#13ce66',
                inactive-color='#161617'
              )

          swap-button.swap-button(v-if="item.i == 'limit-market' && relatedPool" :pool="relatedPool.id")
            | SWAP ({{ relatedPool.rate }} {{ base_token.symbol.name }})

          FeeRate.feebutton(v-if="item.i == 'limit-market'")

          TimeSaleModal(v-if='item.i == "time-sale" && markets_timesale_tab == 1')
          OrderbookModel(v-else-if='item.i == "order-depth" && orderbok_tab == 0')
          SettingModal(v-else-if='item.i == "chart"')

          .icon-btn(v-if="isAdvanced")
            i.el-icon-close(@click='closegriditem(item.i)')

        top-line(v-if='item.i == "chart"')
        chart(v-if='item.i == "chart"')
          #tv_chart_container

        order-form-vertical(v-if="item.i == 'order-form-vertical'")

        el-tabs.h-100(v-loading='loading', v-if='item.i == "order-depth"' type="border-card" size="small" v-model="orderbok_tab")
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

        el-tabs.h-100(v-if='item.i == "time-sale"' type="border-card" v-model="markets_timesale_tab")
          el-tab-pane(label='Markets')
            Markets.mt-1
          el-tab-pane(label='Times & Sales')
            LatestDeals(:timeformat='timeformat')

        alcor-tabs.h-100(v-if='item.i == "open-order"' v-model='tab' type="border-card")
          el-tab-pane(label='Open orders')
            my-orders(v-loading='loading' :only-current-pair="hideOtherPairs")
          el-tab-pane(label='Trade History')
            my-trade-history(:only-current-pair="hideOtherPairs")
          el-tab-pane(label='Funds')
            my-funds(:only-current-pair="hideOtherPairs")
        .not-history.limit-market(
          v-if='item.i == "limit-market"',
          :min-h='10'
        )
          //.right-icons
          el-tabs(type="border-card").h-100
            el-tab-pane.h-10(label='Limit trade')
              .trade-box
                limit-trade
            el-tab-pane(label='Market trade')
              .trade-box
                market-trade

        .h-100(v-if='item.i == "markets"')
          Markets

  #price_cancel_modal(v-if='orderdata && orderdata.show_cancel_modal')
    .cancel-modal-content
      .price-info
        p Your order to:
        span.color-green &nbsp;{{ orderdata.order_to }}
      .price-info
        p At a price of:
        span &nbsp;{{ orderdata.price }}
      p Will be
        span.color-red &nbsp;cancelled
        | , do you wish to proceed?
      .alert-btn-group.d-flex.justify-content-between
        div(@click='cancel_confirm_order(true)') Yes
        div(@click='cancel_confirm_order(false)') No
      i.el-icon-close(@click='cancel_confirm_order(false)')
  #price_move_modal(v-if='orderdata.show_move_modal')
    .cancel-modal-content
      .price-info
        p Your order to:
        span.color-green &nbsp;{{ orderdata.order_to }}
      .price-info
        p At a price of:
        span &nbsp;{{ orderdata.price }}
      .price-info
        p.width-auto Will be moved to:
        span &nbsp;{{ orderdata.new_price }}
      p Do you wish to proceed?
      .alert-btn-group.d-flex.justify-content-between
        div(@click='move_confirm_order(true)') Yes
        div(@click='move_confirm_order(false)') No
      i.el-icon-close(@click='move_confirm_order(false)')
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { cloneDeep, isEqual } from 'lodash'

import OrderbookModel from '~/components/trade/modals/OrderbookModel'
import MarketTrade from '~/components/trade/MarketTrade'
import LimitTrade from '~/components/trade/LimitTrade'
import MyOrders from '~/components/trade/MyOrders'
import MyTradeHistory from '~/components/trade/MyTradeHistory'
import MyFunds from '~/components/trade/MyFunds'
import OrderBook from '~/components/trade/OrderBook'
import DepthChart from '~/components/trade/DepthChart'
import Markets from '~/components/trade/Markets'
import LatestDeals from '~/components/trade/LatestDeals'
import Chart from '~/components/trade/Chart'
import TopLine from '~/components/trade/TopLine'
import MobileTrade from '~/components/trade/MobileTrade'
import FeeRate from '~/components/trade/FeeRate'
import SettingModal from '~/components/trade/SettingModal'
import TimeSaleModal from '~/components/trade/TimeSaleModal'
import SwapButton from '~/components/trade/SwapButton'
import OrderFormVertical from '~/components/trade/OrderFormVertical'

import { TRADE_LAYOUTS } from '~/config'

export default {
  layout: 'embed',
  path: 'desktoptrade',
  name: 'Desktoptrade',
  components: {
    MarketTrade,
    MyTradeHistory,
    MyFunds,
    MyOrders,
    LimitTrade,
    OrderBook,
    LatestDeals,
    Chart,
    Markets,
    MobileTrade,
    TopLine,
    FeeRate,
    DepthChart,
    SettingModal,
    TimeSaleModal,
    OrderbookModel,
    SwapButton,
    OrderFormVertical
  },

  data() {
    return {
      screenWidth: 1200,

      tab: 0,
      price: 0.0,
      amount: 0.0,
      no_found: false,
      loading: false,
      showOrderSettingsModal: false,
      timeformat: 'DD-MM HH:mm',
      resizestatus: null,
      orderbok_tab: 0,

      layouts: []
    }
  },

  computed: {
    ...mapState(['network', 'userOrders']),
    ...mapState('market', [
      'token',
      'id',
      'stats',
      'base_token',
      'orderdata',
      'current_market_layout'
    ]),
    ...mapGetters('market', ['relatedPool']),
    ...mapGetters(['user']),

    isAdvanced() {
      return this.current_market_layout == 'advanced'
    },

    layouts_grid() {
      return this.layouts.filter(i => i.status)
    },

    markets_timesale_tab: {
      get() {
        console.log('this.$store.state.settings.markets_timesale_tab', this.$store.state.settings.markets_timesale_tab)
        return this.$store.state.settings.markets_timesale_tab || 1
      },

      set(value) {
        this.$store.commit('settings/setMarketsTimesaleTab', value)
      }
    },

    markets_layout: {
      get() {
        let l
        if (this.current_market_layout == 'classic') {
          l = this.screenWidth > 1350 ? TRADE_LAYOUTS.classic : TRADE_LAYOUTS.classic_small
        } else if (this.current_market_layout == 'full') {
          l = TRADE_LAYOUTS.full
        } else {
          l = this.$store.state.market.markets_layout
        }

        return l
      },

      set() {
        // TODO No need
        console.log('try set layout')
      }
    },

    hideOtherPairs: {
      get() {
        return this.$store.state.settings.hideOtherPairs
      },

      set(value) {
        this.$store.commit('settings/setHideOtherPairs', value)
      }
    },

    payForUser: {
      get() {
        return this.$store.state.chain.payForUser
      },

      set(value) {
        this.$store.commit('chain/setPayForUser', value)
      }
    }
  },

  watch: {
    '$store.state.market.markets_layout'() {
      if (this.current_market_layout != 'advanced') return
      this.layouts = this.$store.state.market.markets_layout
    },

    current_market_layout() {
      this.layouts = cloneDeep(this.markets_layout)
    },

    layouts: {
      handler(newValue) {
        // We update only for advanced mode
        if (this.current_market_layout != 'advanced') return

        if (!isEqual(newValue, this.markets_layout)) {
          this.$store.commit('market/setMarketLayout', this.layouts)
        }
      },

      deep: true
    }
  },

  mounted() {
    if (this.markets_timesale_tab == null) this.markets_timesale_tab = 0

    this.$nextTick(() => {
      this.screenWidth = window.innerWidth
      this.layouts = cloneDeep(this.markets_layout)

      window.addEventListener('resize', () => {
        this.screenWidth = window.innerWidth
      })
    })
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
  },

  methods: {
    cancel_confirm_order(isCancel) {
      this.orderdata.show_cancel_modal = false
    },

    move_confirm_order(isMove) {
      this.orderdata.show_move_modal = false
      if (isMove) this.orderdata.price = this.orderdata.new_price
    },

    resize(iname, newH, newW, newHPx, newWPx) {
      if (iname == 'order-depth') {
        this.resizestatus = { i: iname, height: newH * 40, width: newW }
      }
    },

    closegriditem(item_name) {
      this.layouts.map((item) => {
        if (item.i == item_name) {
          item.status = false
        }
      })

      //if (this.current_market_layout != 'advanced') return
      //if (isEqual(this.markets_layout, this.$store.state.market.markets_layout)) return
      //this.$store.commit('market/setMarketLayout', this.markets_layout)
    },

    layoutUpdatedEvent(layout) {
      if (this.current_market_layout != 'advanced') return
      //if (isEqual(layout, this.$store.state.market.markets_layout)) return

      this.$store.commit('market/setMarketLayout', this.markets_layout)
    },

    itemUpdatedEvent(item) {
      if (this.current_market_layout != 'advanced') return
      //if (isEqual(this.markets_layout, this.$store.state.market.markets_layout)) return

      this.$store.commit('market/setMarketLayout', this.markets_layout)
    }
  }
}
</script>

<style lang="scss" scoped>
.limit-market {
  .tabs-right {
    right: 21px;
  }
}

#price_cancel_modal,
#price_move_modal {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  font-size: 14px;
  background-color: rgba(0, 0, 0, 0.7);
  .cancel-modal-content {
    width: 300px;
    border: 2px solid #333 !important;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 15px;
    border: 1px solid;
    background-color: #212121;
    border-radius: 5px;
    color: white;
    .color-green {
      color: #00a308;
    }
    .price-info span {
      background-color: #282828;
      padding: 3px;
      border-radius: 5px;
      margin-left: 5px;
    }
    .price-info p {
      width: 87px;
      display: inline-block;
    }
    .color-red {
      color: #f96c6c;
    }
    .alert-btn-group div {
      border-radius: 5px;
      width: 47%;
      background-color: #333;
      padding: 4px;
      text-align: center;
      cursor: pointer;
    }
    .el-icon-close {
      background-color: #333;
      position: absolute;
      padding: 3px;
      right: 1px;
      top: 1px;
      cursor: pointer;
    }
    .price-info p.width-auto {
      width: auto;
    }
  }
}

.el-item {
  position: absolute;
  border: 2px solid rgb(63, 63, 63);
  margin: 2px;
  border-radius: 2px;
  margin: 1px;
}

.theme-dark .el-tooltip__popper.is-dark {
  background: #303133 !important;
  color: #fff !important;
}

.el-tooltip__popper.is-white {
  display: flex;
  border: 2px solid blue !important;
}

.right-icons {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  right: 0;
  z-index: 100;
  margin: 1px;
}

.alcor-inner .main .box-card {
  background-color: #212121;
}

.icon-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #3f3f3f;
  border-radius: 0px 0px 0px 3px;
  cursor: pointer;
  margin: 1px;
}

.red {
  color: var(--main-red);

  &:hover,
  &:focus {
    outline: none;
    color: var(--main-red);
  }
}
.top-level {
  display: flex;
  height: 500px;

  .top-left {
    flex: 4;
  }

  .top-center {
    margin: 0 10px;
    flex: 8;
  }

  .top-right {
    flex: 3;
  }
}

.low-level {
  display: flex;
  height: 300px;

  .low-left {
    flex: 5;
  }
  .not-history {
    flex: 9;
    display: flex;
  }
  .low-center {
    min-width: 490px;
    margin: 0 10px;
    flex: 2;
  }

  .low-right {
    flex: 1;
  }
}

.low-height {
  height: 300px;
}

.bordered {
  border-right: 1px solid;
}

.trade-window {
  min-height: 650px;
}

.el-form-item {
  margin-bottom: 0px;
}

.el-card__body {
  padding: 10px;
}

.display-4 {
  font-size: 2.5rem;
  font-weight: 230;
  line-height: 1;
}

.swap-button {
  background: #3f3f3f;
  //border: 0px 0px 0px 2px !important;
  border-radius: 0px;
  border: none !important;
  padding: 0px 10px !important;
  margin-right: 2px;
  color: #bdbdbd !important;
  height: 20px;
}
.feebutton {
  background: #3f3f3f;
  padding: 0px 2px !important;
  margin-right: 2px !important;
  height: 100% !important;
}
@media screen and (max-width: 1350px) {
  .top-level {
    height: auto;
  }
  .low-level {
    flex-direction: column-reverse;
    height: auto;
    .low-center {
      margin: 0px 10px 0px 0px;
    }
    .low-left {
      margin-top: 10px;
    }
  }

  .orders-panel {
    display: block;
  }
}

@media screen and (min-width: 1350px) {
  .orders-panel {
    display: none;
  }
}
</style>

<style lang="scss">
.trading-terminal {
  .chart {
    touch-action: none;
  }

  .deals-history {
    .orders-list {
      height: calc(100% - 23px);
    }
  }

  #tv_chart_container {
    height: calc(100% - 52px) !important;
  }

  background: #121212;

  .el-tabs--border-card {
    background: transparent;
    border: none;
  }

  .el-tabs__item {
    height: 30px;
    line-height: 25px;
  }

  .el-tabs__content {
    padding: 0px !important;
  }

  .el-tabs__item.is-active {
    background-color: transparent !important;
    border-bottom: solid !important;
  }

  .el-tabs__header {
    background-color: var(--table-background) !important;
    margin: 0;
  }

  .vue-resizable-handle {
    display: none;

    width: 15px;
    height: 15px;

    background: url('@/assets/icons/resize.png');
    background-repeat: no-repeat;
  }

  .vue-grid-item {
    background: var(--table-background);
    border: 2px solid #3F3F3F;
    box-sizing: border-box;
    border-radius: 2px;

    &:hover {
      .vue-resizable-handle {
        display: block;
      }
    }
  }

  .vue-grid-item.vue-grid-placeholder {
    background: #66c167 !important;
    opacity: 0.25;
  }

  .orders-list {
    user-select: none;
  }

  .times-and-sales {
    display: flex;
    align-items: center;
    height: 30px;
    top: 2px;
    background: #212121;

    span {
      margin-left: 10px;
      font-size: 14px;
      font-weight: 500;
    }
  }

  .pairs-switch-right {
    display: flex;
    float: right;
    position: absolute;
    right: 39px;
    flex-direction: row;
    align-items: center;
  }

  .pool-price {
    position: absolute;

    top: 5px;
    right: 5px;
  }

  .low-level {
    .el-tabs__nav {
      margin-left: 20px;
    }
  }

  .trade-box {
    margin-top: 20px;
    padding: 0 15px;

    .el-input--prefix .el-input__inner {
      padding-left: 35% !important;
    }

    .el-form-item__content {
      margin-left: 0px;
    }

    .el-tabs__header {
      margin: 0 0 10px;
    }

    .el-input__prefix {
      left: 15px;
    }

    .el-form-item {
      margin-bottom: 3px;
    }

    // Slider
    .el-slider__runway {
      margin: 5px 0;
      height: 4px;
    }

    .el-slider__button {
      width: 10px;
      height: 10px;
    }

    .el-slider__marks-text {
      margin-top: 12px;
      font-size: 10px;
    }
  }

  .low-left {
    .el-tabs__header {
      margin: 0px;
    }

    .el-table {
      font-size: 10px;
    }
  }

  // Element tables
  .el-table td,
  .el-table th {
    padding: 5px 0;
  }

  .el-table__header th {
    background-color: var(--btn-default);
  }

  .el-table {
    .cell {
      line-height: 12px;
      padding-left: 0px;
      padding-right: 0px;
    }

    .cell:first-child {
      padding-left: 5px;
    }

    .cell:last-child {
      padding-right: 5px;
    }
  }

  .el-table {
    font-size: 12px;

    .el-table__header-wrapper {
      th {
        font-weight: 400;
      }
    }
  }

  .open-order {
    .el-tabs {
      height: 100%;

      .el-tabs__content {
        height: calc(100% - 30px);

        .el-tab-pane {
          height: 100%;

          .el-table {
            height: 100%;

            .el-table__body-wrapper {
              height: calc(100% - 30px);
              overflow-y: auto;
            }
          }
        }
      }
    }

  }
}
</style>
