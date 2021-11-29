<template lang="pug">
.row
  .col-lg-6
    .d-flex.mb-1
      small.text-success Buy {{ quote_token.symbol.name }}
      small(
        class="text-mutted small align-self-end ml-auto cursor-pointer"
        @click="setAmount('buy')"
      ) {{ baseBalance | commaFloat }}
        i.el-icon-wallet.ml-1

    el-form
      el-form-item
        el-input(
          type="number"
          min="0.00000001"
          step="0.00000001"
          v-model="priceBid"
          @change="setPrecisionPrice()"
          size="medium"
          align="right"
          placeholder="0"
          clearable
        )
          span(slot="prefix").mr-1 PRICE
          span(slot="suffix").mr-1 {{ base_token.symbol.name }}

      el-form-item
        el-input(
          type="number"
          v-model="amountBuy"
          @change="setPrecisionAmountBuy()"
          size="medium"
          placeholder="0"
          clearable
        )
          span(slot="prefix").mr-1 AMOUNT
          span(slot="suffix").mr-1 {{ quote_token.symbol.name }}

      .px-3
        el-slider(
          :step="1"
          v-model="percentBuy"
          :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}"
        )

      el-form-item(
        class="mt-4"
        prop="totalBuy"
        :inline-message="true"
      )
        el-input(
          type="number"
          v-model="totalBuy"
          @change="setPrecisionTotalBuy()"
          placeholder="0"
          size="medium"
        )
          span(slot="prefix").mr-1 TOTAL
          span(slot="suffix").mr-1 {{ base_token.symbol.name }}

      el-form-item.mt-1
        el-button(
          class="w-100"
          size="small"
          type="success"
          @click="actionOrder('limit', 'buy')"
        ) Buy {{ quote_token.str }}

  .col-lg-6
    .d-flex.mb-1
      small.text-danger Sell {{ quote_token.symbol.name }}
      small(
        class="text-mutted small align-self-end ml-auto cursor-pointer"
        @click="setAmount('sell')"
      ) {{ tokenBalance | commaFloat }}
        i.el-icon-wallet.ml-1

    el-form
      el-form-item
        el-input(
          type="number"
          min="0"
          step="0.0001"
          value="0"
          v-model="priceBid"
          @change="setPrecisionPrice()"
          size="medium"
          placeholder="0"
          clearable
        )
          span(slot="prefix").mr-1 PRICE
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

      el-form-item(
        class="mt-4"
        prop="totalSell"
        :inline-message="true"
      )
        el-input(
          type="number"
          v-model="totalSell"
          @change="setPrecisionTotalSell()"
          placeholder="0"
          size="medium"
        )
          span(slot="prefix").mr-1 TOTAL
          span(slot="suffix").mr-1 {{ base_token.symbol.name }}

      el-form-item.mt-1
        el-button(
          class="w-100"
          size="small"
          type="danger"
          @click="actionOrder('limit', 'sell')"
        ) Sell {{ quote_token.str }}
</template>

<script>
import { trade } from '~/mixins/trade'

export default {
  mixins: [trade],

  computed: {
    percentBuy: {
      get() { return this.percent_buy },
      set(val) { this.changePercentBuy({ percent: val, trade: 'limit' }) }
    }
  }
}
</script>

<style scoped lang="scss">
.cursor-pointer {
  cursor: pointer;
}
</style>
