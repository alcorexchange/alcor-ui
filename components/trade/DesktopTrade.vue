<template lang="pug">
.trading-terminal
  client-only
    grid-layout(
      :layout.sync='markets_layout',
      :col-num='24',
      :row-height='40',
      :is-draggable='true',
      :is-resizable='true',
      :is-mirrored='false',
      :vertical-compact='true',
      :margin='[4, 4]',
      :use-css-transforms='true'
    )
      grid-item.overflowbox(
        v-for='item in markets_layout.filter((item) => item.status)',
        :x='item.x',
        :y='item.y',
        :w='item.w',
        :h='item.h',
        :i='item.i',
        :key='item.i',
        :min-w='parseInt(item.mw)',
        :min-h='parseInt(item.mh)',
        :class='item.i',
        @resized='layoutUpdatedEvent(item)',
        drag-ignore-from='.el-tabs__item, .depth-chart, a, button, .orders-list',
        drag-allow-from='.el-tabs__header, .box-card, .times-and-sales'
      )
        .right-icons
          .icon-btn(v-if='item.i != "open-order"')
            i.el-icon-setting(
              v-if='item.i == "chart"',
              @click='show_modal = !show_modal'
            )
            i.el-icon-setting(
              v-else-if='item.i == "time-sale"',
              @click='show_timesale_modal = !show_timesale_modal'
            )
            i.el-icon-setting(v-else)
          .icon-btn
            i.el-icon-close(@click='closegriditem(item.i)')
        top-line(v-if='item.i == "chart"')
        chart(v-if='item.i == "chart"')

        el-tabs.h-100(v-loading='loading', v-if='item.i == "order-depth"' type="border-card" size="small")
          el-tab-pane(label='Orderbook')
            order-book
          // TODO DepthChart
          //el-tab-pane(label='Depth Chart')
            depth-chart(
              :is-draggable='false',
              :is-resizable='false',
              :is-mirrored='false',
              :vertical-compact='false',
              :margin='[10, 10]',
              :use-css-transforms='false',
              :depthChartUpdated='depthChartUpdated'
            )
        .h-100(v-if='item.i == "time-sale"', :min-w='3')
          .times-and-sales
            span Times and Sales
          LatestDeals(:timeformat='timeformat')
        //- markets(v-if="item.i=='3'")
        alcor-tabs.h-100(v-if='item.i == "open-order"' v-model='tab' type="border-card").trade-tabs
          template(slot='right')
            .d-flex.pairs-switch-right
              //- el-button.red.hover-opacity.ml-3.mt-1(
              //-   type='text',
              //-   v-show='tab == 0',
              //-   size='small',
              //-   @click='cancelAll'
              //- ) Hide other pairs
              .module-name.mr-2 Hide other pairs
              .module-pickers.d-flex.flex-row
                el-switch(
                  v-model='hideOtherPairs',
                  active-color='#13ce66',
                  inactive-color='#161617'
                )
          el-tab-pane(label='Open order')
            my-orders(v-loading='loading' :only-current-pair="hideOtherPairs")
          //el-tab-pane(label='Order history')
            my-history(v-if='user', v-loading='loading')
          el-tab-pane(label='Trade History')
            my-trade-history(:only-current-pair="hideOtherPairs")
          el-tab-pane(label='Funds')
            my-funds(:only-current-pair="hideOtherPairs")
        .not-history.limit-market(
          v-if='item.i == "limit-market"',
          :min-h='10'
        )
          .tabs-right
            el-switch.mr-2(
              v-if='["eos"].includes(network.name) && user',
              v-model='payForUser',
              inactive-text=' Free CPU'
            )
            el-button.swap-button.rounded-0(
              v-if='relatedPool',
              type='button',
              @click='goToPool'
            ) SWAP ({{ relatedPool.rate }} {{ base_token.symbol.name }})
            FeeRate.feebutton
          el-tabs(type="border-card").h-100.no_drag
            el-tab-pane.h-10(label='Limit trade')
              .trade-box
                limit-trade
            el-tab-pane(label='Market trade')
              .trade-box
                market-trade
        //- .low-right(v-if="item.i=='6'")
        //-   .overflowbox.low-height.overflow-hidden
        //-     LatestDeals
  SettingModal(v-if='show_modal', :outofmodalClick='outofmodalClick')
  TimeSaleModal(
    v-if='show_timesale_modal',
    :outoftimesalemodalClick='outoftimesalemodalClick',
    :closemodal='closemodal',
    @changedtimeformat='showtimeformat'
  )
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

import MarketTrade from '~/components/trade/MarketTrade'
import LimitTrade from '~/components/trade/LimitTrade'
import MyOrders from '~/components/trade/MyOrders'
import MyHistory from '~/components/trade/MyHistory'
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

export default {
  layout: 'embed',
  path: 'desktoptrade',
  name: 'Desktoptrade',
  components: {
    MarketTrade,
    MyHistory,
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
  },

  data() {
    return {
      tab: 0,
      price: 0.0,
      amount: 0.0,
      no_found: false,
      loading: false,
      show_modal: false,
      show_timesale_modal: false,
      timeformat: 'DD-MM HH:mm',
      resizestatus: null,
      depthChartUpdated: false,
    }
  },

  computed: {
    ...mapState(['network', 'userOrders']),
    ...mapState('market', [
      'token',
      'id',
      'stats',
      'base_token',
      'markets_layout',
      'orderdata'
    ]),
    ...mapGetters('market', ['relatedPool']),
    ...mapGetters(['user']),

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
      },
    },
  },
  methods: {
    cancel_confirm_order(isCancel) {
      this.orderdata.show_cancel_modal = false
      //
    },
    move_confirm_order(isMove) {
      this.orderdata.show_move_modal = false
      if (isMove) this.orderdata.price = this.orderdata.new_price
      //
    },
    showtimeformat(value) {
      this.timeformat = value
    },
    resize(iname, newH, newW, newHPx, newWPx) {
      if (iname == 'order-depth') {
        this.resizestatus = { i: iname, height: newH * 40, width: newW }
      }
    },
    closegriditem(item_name) {
      this.markets_layout.map((item) => {
        if (item.i == item_name) {
          item.status = false
        }
      })
    },
    outofmodalClick(event) {
      if (event.target.classList.contains('body-container'))
        this.show_modal = false
    },
    outoftimesalemodalClick(event) {
      if (event.target.classList.contains('body-timesale-container'))
        this.show_timesale_modal = false
    },
    closemodal(event) {
      // if (event.target.classList.contains('body-timesale-container'))
      this.show_timesale_modal = false
    },
    cancelAll() {
      this.$store.dispatch(
        'market/cancelAll',
        this.userOrders.filter(
          (a) => a.account === this.user.name && a.market_id == this.id
        )
      )
    },
    goToPool() {
      this.$store.dispatch('swap/setPair', this.relatedPool.id)
      this.$store.dispatch('swap/updatePair', this.relatedPool.id)
      this.$store.commit('swap/setTab', 'Swap')
      this.$router.push('/swap')
    },
    layoutUpdatedEvent(e) {
      if (e.i != 'order-depth') return
      this.depthChartUpdated = !this.depthChartUpdated
    },
  },
}
</script>

<style lang="scss" scoped>
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

.tabs-right {
  display: flex;
  height: 20px;
  margin: 1px 1px;
  align-items: center;
  position: absolute;
  top: 1px;
  right: 43px;
  z-index: 123;
  .swap-button {
    background: #3f3f3f;
    border: 0px 0px 0px 2px !important;
    padding: 0px 10px !important;
    margin-right: 2px;
    color: #bdbdbd !important;
    height: 100% !important;
  }
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
  //padding: 2px 0px;
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

  .vue-grid-item {
    background: var(--bg-alter-1);
    border: 2px solid #3F3F3F;
    box-sizing: border-box;
    border-radius: 2px;

    //overflow: auto;
    //overflow-x: hidden;
  }

  .vue-resizable-handle {
    width: 15px;
    height: 15px;

    background: url('@/assets/icons/resize.png');
    background-repeat: no-repeat;
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

  .time-sale {
    min-width: 165px;
    max-height: 730px;
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
    font-size: 10px;

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
              height: 100%;
              overflow: auto;
            }
          }
        }
      }
    }

  }
}
</style>
