<template lang="pug">
  el-form(ref="form")
    el-form-item
      el-input(
        v-if="bid == 'buy'"
        type="number"
        v-model="amountBuy"
        @change="setPrecisionAmountBuy()"
        placeholder="0"
        clearable
      )
        span(slot="prepend") AMOUNT
        span(slot="append") {{ base_token.symbol.name }}
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
</template>

<script>
import { trade } from '~/mixins/trade'

export default {
  mixins: [trade],

  props: ['bid'],

  computed: {
    percentBuy: {
      get() { return this.percent_buy },
      set(val) { this.changePercentBuy({ percent: val, trade: 'market' }) }
    }
  }
}
</script>

<style lang="scss" scoped>
  .slider {
    margin-bottom: 25px;
    padding: 0 15px;
  }
</style>
