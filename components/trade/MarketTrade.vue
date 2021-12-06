<template lang="pug">
.row
  .col-lg-6
    .d-flex.mb-1
      small.text-success Buy {{ quote_token.symbol.name }}
      span(
        @click="setAmount('buy')"
        class="text-mutted small align-self-end ml-auto cursor-pointer"
      ) {{ baseBalance | commaFloat }}
        i.el-icon-wallet.ml-1

    el-form
      el-form-item
        el-input(
          type="number"
          placeholder="Buy at best price"
          size="medium"
          disabled
        )
          span(slot="suffix").mr-1 {{ base_token.symbol.name }}

      el-form-item
        el-input(
          type="number"
          v-model="totalBuy"
          @change="setPrecisionTotalBuy()"
          size="medium"
          placeholder="0"
          clearable
        )
          span(slot="prefix").mr-1 AMOUNT
          span(slot="suffix").mr-1 {{ base_token.symbol.name }}

      .px-3
        el-slider(
          :step="1"
          v-model="percentBuy"
          :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}"
        )

      el-form-item.mt-5
        el-button(
          class="w-100"
          type="success"
          size="small"
          @click="actionOrder('market', 'buy')"
        ) Buy {{ quote_token.str }}

  .col-lg-6
    .d-flex.mb-1
      small.text-danger Sell {{ quote_token.symbol.name }}
      span(
        class="text-mutted small align-self-end ml-auto cursor-pointer"
        @click="setAmount('sell')"
      ) {{ tokenBalance | commaFloat }}
        i.el-icon-wallet.ml-1

    el-form
      el-form-item
        el-input(
          type="number"
          placeholder="Sell at best price"
          size="medium"
          disabled
        )
          span(slot="suffix").mr-1.ml-2 {{ base_token.symbol.name }}

      el-form-item
        el-input(
          type="number"
          v-model="amountSell"
          @change="setPrecisionAmountSell()"
          size="medium"
          placeholder="0"
          clearable
        )
          span(slot="prefix").mr-1 AMOUNT
          span(slot="suffix").mr-1 {{ quote_token.symbol.name }}

      .px-3
        el-slider(
          :step="1"
          v-model="percentSell"
          :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}"
        )

      el-form-item.mt-5
        el-button(
          class="w-100"
          type="danger"
          size="small"
          @click="actionOrder('market', 'sell')"
        ) Sell {{ quote_token.str }}
</template>

<script>
// TODO Короче еще сделать для маркеттрейда размер в EOS сумировать по ордерам
import { trade } from '~/mixins/trade'

export default {
  mixins: [trade],

  computed: {
    percentBuy: {
      get() { return this.percent_buy },
      set(val) { this.changePercentBuy({ percent: val, trade: 'market' }) }
    }
  }
}
</script>

<style scoped lang="scss">
.cursor-pointer {
  cursor: pointer;
}
</style>
