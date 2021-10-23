<template lang="pug">
  //- TODO В идеале заменить ElementUI на самописные компоненты, так как есть существенные баги в ElementUI
  el-form(ref="form")
    el-form-item
      el-input(
        type="number"
        v-model="priceBid"
        @change="setPrecisionPrice()"
        placeholder="0"
        clearable
      )
        span(slot="prepend") PRICE
        span(slot="append") {{ base_token.symbol.name }}
    el-form-item
      //- Logic for buying
      el-input(
        v-if="bid == 'buy'"
        type="number"
        v-model="amountBuy"
        @change="setPrecisionAmountBuy()"
        placeholder="0"
        clearable
      )
        span(slot="prepend") AMOUNT
        span(slot="append") {{ quote_token.symbol.name }}
      //- Logic for selling
      el-input(
        v-else
        type="number"
        v-model="amountSell"
        @change="setPrecisionAmountSell()"
        placeholder="0"
        clearable
      )
        span(slot="prepend") AMOUNT
        span(slot="append") {{ quote_token.symbol.name }}
    //- TODO Запилить свой компонент slider, так как на мобилках есть лаг, что подсказка не исчезает...
    el-slider.slider(
      v-if="bid == 'buy'"
      :step="1"
      v-model="percentBuy"
      :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}"
    )
    el-slider.slider(
      v-else
      :step="1"
      v-model="percentSell"
      :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}"
    )
    el-form-item
      //- For buy
      el-input(
        v-if="bid == 'buy'"
        type="number"
        v-model="totalBuy"
        @change="setPrecisionTotalBuy()"
        placeholder="0"
        clearable
      )
        span(slot="prepend") TOTAL
        span(slot="append") {{ base_token.symbol.name }}
      //- For sell
      el-input(
        v-else
        type="number"
        v-model="totalSell"
        @change="setPrecisionTotalSell()"
        placeholder="0"
        clearable
      )
        span(slot="prepend") TOTAL
        span(slot="append") {{ base_token.symbol.name }}
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { trade } from '~/mixins/trade'

export default {
  mixins: [trade],

  props: ['bid'],

  computed: {
    ...mapState('market', [
      'price_bid',
      'total_buy',
      'total_sell'
    ]),
    priceBid: {
      get() { return this.price_bid },
      set(val) { this.changePrice(val) }
    },
    percentBuy: {
      get() { return this.percent_buy },
      set(val) { this.changePercentBuy({ percent: val, trade: 'limit' }) }
    },
    totalBuy: {
      get() { return this.total_buy },
      set(val) { this.changeTotal({ total: val, type: 'buy' }) }
    },
    totalSell: {
      get() { return this.total_sell },
      set(val) { this.changeTotal({ total: val, type: 'sell' }) }
    }
  },

  methods: {
    ...mapActions('market', [
      'changePrice',
      'setPrecisionPrice',
      'changeTotal',
      'setPrecisionTotalBuy',
      'setPrecisionTotalSell'
    ])
  }
}
</script>

<style lang="scss" scoped>
  .slider {
    margin-bottom: 25px;
    padding: 0 15px;
  }
</style>
