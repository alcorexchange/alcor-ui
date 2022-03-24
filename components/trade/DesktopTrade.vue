<template lang="pug">
.row.trading-terminal
  client-only
    .col(v-if='markets_layout.length > 0')
      grid-layout(
        :layout.sync='markets_layout',
        :col-num='24',
        :row-height='30',
        :is-draggable='true',
        :is-resizable='true',
        :is-mirrored='false',
        :vertical-compact='true',
        :margin='[10, 10]',
        :use-css-transforms='true'
      )
        grid-item.overflowbox(
          v-for='item in markets_layout.filter(item=>item.status)',
          :x='item.x',
          :y='item.y',
          :w='item.w',
          :h='item.h',
          :i='item.i',
          :key='item.i'
        )
          .right-icons
            .icon-btn
              i.el-icon-setting
            .icon-btn
              i.el-icon-close
          top-line(v-if='item.i == "chart"')
          chart(v-if='item.i == "chart"')
          el-tabs.h-100(v-loading='loading', v-if='item.i == "order-depth"')
            el-tab-pane(label='Orderbook')
              order-book
            el-tab-pane(label='Depth Chart')
              depth-chart
          el-tabs.h-100(v-if='item.i == "time-sale"')
            el-tab-pane(label='Times and Sales')
              LatestDeals
          //- markets(v-if="item.i=='3'")
          alcor-tabs.h-100(v-if='item.i == "open-oder"', v-model='tab')
            template(slot='right')
              .d-flex
                el-button.red.hover-opacity.ml-3.mt-1(
                  type='text',
                  v-show='tab == 0',
                  size='small',
                  @click='cancelAll'
                ) Cancel All Orders
            el-tab-pane(label='Open order')
              my-orders(v-if='user', v-loading='loading')
            el-tab-pane(label='Order history')
              my-history(v-if='user', v-loading='loading')
            el-tab-pane(label='Trade History')
              my-history
            el-tab-pane(label='Funds')
              my-history
          .not-history(v-if='item.i == "limit-market"')
            .tabs-right
              el-switch.mr-2(
                v-if='["eos"].includes(network.name) && user',
                v-model='payForUser',
                inactive-text=' Free CPU'
              )
              FeeRate.mr-2
              el-button(v-if='relatedPool', type='text', @click='goToPool') SWAP ({{ relatedPool.rate }} {{ base_token.symbol.name }})
            el-tabs.h-100
              el-tab-pane(label='Limit trade')
                .trade-box
                  limit-trade
              el-tab-pane(label='Market trade')
                .trade-box
                  market-trade
          //- .low-right(v-if="item.i=='6'")
          //-   .overflowbox.low-height.overflow-hidden
          //-     LatestDeals
</template>

<script>
import { mapGetters, mapState } from 'vuex'

import MarketTrade from '~/components/trade/MarketTrade'
import LimitTrade from '~/components/trade/LimitTrade'
import MyOrders from '~/components/trade/MyOrders'
import MyHistory from '~/components/trade/MyHistory'
import OrderBook from '~/components/trade/OrderBook'
import DepthChart from '~/components/trade/DepthChart'
import Markets from '~/components/trade/Markets'
import LatestDeals from '~/components/trade/LatestDeals'
import Chart from '~/components/trade/Chart'
import TopLine from '~/components/trade/TopLine'
import MobileTrade from '~/components/trade/MobileTrade'
import FeeRate from '~/components/trade/FeeRate'

export default {
  layout: 'embed',
  path: 'desktoptrade',
  name: 'desktoptrade',
  components: {
    MarketTrade,
    MyHistory,
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
  },

  data() {
    return {
      tab: 0,
      price: 0.0,
      amount: 0.0,
      no_found: false,
      loading: false
    }
  },

  computed: {
    ...mapState(['network', 'userOrders']),
    ...mapState('market', ['token', 'id', 'stats', 'base_token', 'markets_layout']),
    ...mapGetters('market', ['relatedPool']),
    ...mapGetters(['user']),
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
  },
}
</script>

<style lang="scss" scoped>
.el-item {
  position: absolute;
  border: 2px solid rgb(63, 63, 63);
  margin: 2px;
  border-radius: 2px;
  margin: 1px;
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
  align-items: center;
  position: absolute;
  top: 0px;
  right: 15px;
  z-index: 123;
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
  .pool-price {
    position: absolute;

    top: 5px;
    right: 5px;
  }

  .el-tabs__nav {
    margin-left: 20px;
  }

  .low-level {
    .el-tabs__nav {
      margin-left: 20px;
    }
  }

  .trade-box {
    padding: 0 15px;

    .el-input--prefix .el-input__inner {
      padding-left: 30%;
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
        font-weight: 100;
      }
    }
  }
}
</style>
