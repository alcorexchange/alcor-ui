<template lang="pug">
  //- TODO В идеале заменить ElementUI на самописные компоненты, так как есть существенные баги в ElementUI
  el-form(ref="form" :rules="rules")
    el-form-item
      el-input(
        type="number"
        min="0.00000001"
        step="0.00000001"
        v-model="priceBid"
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
        clearable
      )
        span(slot="prepend") AMOUNT
        span(slot="append") {{ quote_token.symbol.name }}
      //- Logic for selling
      el-input(
        v-else
        type="number"
        v-model="amountSell"
        clearable
      )
        span(slot="prepend") AMOUNT
        span(slot="append") {{ quote_token.symbol.name }}
    //- TODO Запилить свой компонент slider, так как на мобилках есть лаг, что подсказка не исчезает...
    el-slider.slider(
      :step="1"
      v-model="eosPercent"
      :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}"
    )
    //- For buy
    el-form-item(
      v-if="bid == 'buy'"
      prop="totalBuy"
      :inline-message="true"
    )
      el-input(
        type="number"
        v-model="totalBuy"
      )
        span(slot="prepend") TOTAL
        span(slot="append") {{ base_token.symbol.name }}
    //- For sell
    el-form-item(
      v-else
      prop="totalSell"
      :inline-message="true"
    )
      el-input(
        type="number"
        v-model="totalSell"
      )
        span(slot="prepend") TOTAL
        span(slot="append") {{ base_token.symbol.name }}
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import { tradeMixin } from '~/mixins/trade'

export default {
  mixins: [tradeMixin],

  props: ['bid'],

  computed: {
    ...mapState('market', [
      'quote_token',
      'base_token',
      'price_bid',
      'amount_buy',
      'amount_sell',
      'total_buy',
      'total_sell'
    ]),
    priceBid: {
      get() { return this.price_bid },
      set(val) { this.SET_PRICE(val) }
    },
    amountBuy: {
      get() { return this.amount_buy },
      set(val) { this.SET_AMOUNT_BUY(val) }
    },
    amountSell: {
      get() { return this.amount_sell },
      set(val) { this.SET_AMOUNT_SELL(val) }
    },
    totalBuy: {
      get() { return this.total_buy },
      set(val) { this.SET_TOTAL_BUY(val) }
    },
    totalSell: {
      get() { return this.total_sell },
      set(val) { this.SET_TOTAL_SELL(val) }
    }
  },

  methods: {
    ...mapMutations('market', [
      'SET_TOTAL_BUY',
      'SET_TOTAL_SELL'
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
