<template lang="pug">
.row.trading-terminal
  .col
    .top-level
      .top-left.overflowbox
        order-book(v-loading="loading")

      .top-center
        .overflowbox
          top-line
          chart

      .top-right
        .overflowbox.overflow-hidden
          markets

    .low-level.mt-2
      .low-left
        .low-height.overflow-hidden.overflowbox
          alcor-tabs(v-model="tab").h-100
            template(slot="right")
              .d-flex
                el-button(type="text" v-show="tab == 0" size="small" @click="cancelAll").red.hover-opacity.ml-3.mt-1 Cancel All Orders

            el-tab-pane(label="Open order")
              my-orders(v-if="user" v-loading="loading")

            el-tab-pane(label="Order history")
              my-history(v-if="user" v-loading="loading")
      .not-history
        .low-center
          .overflowbox.low-height.position-relative
            .tabs-right
              el-switch(v-if="['eos'].includes(network.name) && user" v-model='payForUser' inactive-text=' Free CPU').mr-2
              FeeRate.mr-2
              el-button(v-if="relatedPool" type="text" @click="goToPool") SWAP ({{ relatedPool.rate }} {{ base_token.symbol.name }})

            el-tabs.h-100
              el-tab-pane(label="Limit trade")
                .trade-box
                  limit-trade

              el-tab-pane(label="Market trade")
                .trade-box
                  market-trade

        .low-right
          .overflowbox.low-height.overflow-hidden
            LatestDeals

    //- .row.mt-2.orders-panel
    //-   .col
    //-     .overflowbox.low-height.overflow-hidden
    //-       el-tabs.h-100
    //-         el-tab-pane(label="Open order")
    //-           my-orders(v-if="user" v-loading="loading")

    //-         el-tab-pane(label="Order history")
    //-           my-history(v-if="user" v-loading="loading")
</template>

<script>
import { mapGetters, mapState } from 'vuex'

import MarketTrade from '~/components/trade/MarketTrade'
import LimitTrade from '~/components/trade/LimitTrade'
import MyOrders from '~/components/trade/MyOrders'
import MyHistory from '~/components/trade/MyHistory'
import OrderBook from '~/components/trade/OrderBook'
import Markets from '~/components/trade/Markets'
import LatestDeals from '~/components/trade/LatestDeals'
import Chart from '~/components/trade/Chart'
import TopLine from '~/components/trade/TopLine'
import MobileTrade from '~/components/trade/MobileTrade'
import FeeRate from '~/components/trade/FeeRate'

export default {
  layout: 'embed',

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
    FeeRate
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
    ...mapState('market', ['token', 'id', 'stats', 'base_token']),
    ...mapGetters('market', ['relatedPool']),
    ...mapGetters(['user']),

    payForUser: {
      get() {
        return this.$store.state.chain.payForUser
      },

      set(value) {
        this.$store.commit('chain/setPayForUser', value)
      }
    }
  },

  methods: {
    cancelAll() {
      this.$store.dispatch('market/cancelAll', this.userOrders.filter(a => a.account === this.user.name && a.market_id == this.id))
    },

    goToPool() {
      this.$store.dispatch('swap/setPair', this.relatedPool.id)
      this.$store.dispatch('swap/updatePair', this.relatedPool.id)
      this.$store.commit('swap/setTab', 'Swap')
      this.$router.push('/swap')
    }
  }
}
</script>

<style lang="scss" scoped>
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
