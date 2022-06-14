<template lang="pug">
  el-tabs.h-100(type="border-card" size="small" v-model="trade").border-tabs.order-form-vertical
    el-tab-pane(:label='$t("Limit Trade")' name="limit").p-2
      el-radio-group.el-radio-full-width(v-model='side', size='small').mt-2
        el-radio-button(:label='$t("buy")').buy {{$t("Buy")}}
        el-radio-button(:label='$t("sell")').sell {{$t("Sell")}}

      .d-flex.mt-4
        span.capitalize(:class='textColor(side)') {{ side }} {{ quote_token.symbol.name }}

        small.text-mutted.small.align-self-end.ml-auto.cursor-pointer(@click='setAmount(side)')
          | {{ side == "buy" ? baseBalance : tokenBalance | commaFloat }}
          i.el-icon-wallet.ml-1

            label.small {{$t("Price")}}
      el-input(
        type='number',
        :min='side == "buy" ? "0.00000001" : "0"',
        :step='side == "buy" ? "0.00000001" : "0.0001"',
        v-model='priceBid',
        @change='setPrecisionPrice()',
        placeholder='0',
        clearable
      )
        span.mr-1.ml-2(slot='suffix') {{ base_token.symbol.name }}

      label.small {{$t("Amount")}}
      el-input(
        v-if='side == "buy"',
        type='number',
        v-model='amountBuy',
        @change='setPrecisionAmountBuy()',
        size='medium',
        placeholder='0',
        clearable
      )
        span.mr-1(slot='suffix') {{ quote_token.symbol.name }}

      el-input(
        v-if='side == "sell"',
        type='number',
        v-model='amountSell',
        @change='setPrecisionAmountSell()',
        size='medium',
        placeholder='0',
        clearable
      )
        span.mr-1(slot='suffix') {{ quote_token.symbol.name }}

      .px-1
        el-slider(
          v-if='side == "buy"',
          :step='1',
          v-model='percentBuy'
          :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
          :show-tooltip="false"
        ).slider-buy
        el-slider(
          v-if='side == "sell"',
          :step='1',
          v-model='percentSell'
          :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
          :show-tooltip="false"
        ).slider-sell

      label.small.mt-4 {{ $t("Total") }}
      el-input(
        v-if='side == "buy"',
        type='number',
        v-model='totalBuy',
        @change='setPrecisionTotalBuy()',
        placeholder='0',
        size='medium'
      )
        span.mr-1(slot='suffix') {{ base_token.symbol.name }}

      el-input(
        v-if='side == "sell"',
        type='number',
        v-model='totalSell',
        @change='setPrecisionTotalSell()',
        placeholder='0',
        size='medium'
      )
        span.mr-1(slot='suffix') {{ base_token.symbol.name }}

      el-button.w-100.mt-4.capitalize(
        :type='side == "buy" ? "success" : "danger"',
        size='small',
        @click='actionOrder(trade, side)'
      ) {{ side }}

    el-tab-pane(:label='$t("Market")' name="market").p-2
      el-radio-group.el-radio-full-width(v-model='side', size='small').mt-2
        el-radio-button(:label='$t("buy")').buy {{$t("Buy")}}
        el-radio-button(:label='$t("sell")').sell {{$t("Sell")}}

      .d-flex.mt-4
        span.capitalize(:class='textColor(side)') {{ side }} {{ quote_token.symbol.name }}

        small.text-mutted.small.align-self-end.ml-auto.cursor-pointer(@click='setAmount(side)')
          | {{ side == "buy" ? baseBalance : tokenBalance | commaFloat }}
          i.el-icon-wallet.ml-1

          label.small.mt-3 {{$t("Price")}}
      el-input(
        type='number',
        disabled,
        :placeholder='$t("Buy at best price")'
      )

      label.small.mt-3 {{$t("Amount")}}
      el-input(
        v-if='side == "buy"',
        type='number',
        v-model='totalBuy',
        placeholder='0',
        clearable
      )
        span.mr-1(slot='suffix') {{ base_token.symbol.name }}

      el-input(
        v-if='side == "sell"',
        type='number',
        v-model='amountSell',
        placeholder='0',
        clearable
      )
        span.mr-1(slot='suffix') {{ quote_token.symbol.name }}

      .px-1.mt-3
        el-slider(
          v-if='side == "buy"',
          :step='25',
          v-model='percentBuyMarket',
          show-stops
          :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
          :show-tooltip="false"
        ).slider-buy
        el-slider(
          v-if='side == "sell"',
          :step='25',
          v-model='percentSell',
          show-stops
          :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
          :show-tooltip="false"
        ).slider-sell

      el-button.w-100.mt-5.capitalize(
        :type='side == "buy" ? "success" : "danger"',
        size='small',
        @click='actionOrder(trade, side)'
      ) {{ side }}
</template>

<script>
import { mapGetters } from 'vuex'
import { trade } from '~/mixins/trade'

export default {
  mixins: [trade],

  data() {
    return {
      side: 'buy',
      trade: 'limit'
    }
  },

  computed: {
    ...mapGetters(['user']),

    percentBuy: {
      get() {
        return this.percent_buy
      },
      set(val) {
        this.changePercentBuy({ percent: val, trade: 'limit' })
      }
    },
    percentBuyMarket: {
      get() {
        return this.percent_buy
      },
      set(val) {
        this.changePercentBuy({ percent: val, trade: 'market' })
      }
    }
  },

  mounted() {
    this.$nuxt.$on('setTradeSide', side => {
      this.side = side
    })
  },

  methods: {
    textColor(side) {
      return side == 'buy' ? 'text-success' : 'text-danger'
    }
  }
}
</script>

<style lang="scss">
.order-form-vertical {

  .text-success {
    color: var(--color-primary) !important;
  }

  .text-danger {
    color: var(--color-secondary) !important;
  }

  .buy,
  .sell {
    .el-radio-button__inner {
      padding: 5px 15px !important;
    }
  }

  label.buy.is-active {
    .el-radio-button__inner {
      background-color: var(--main-green) !important;
    }
  }

  label.sell.is-active {
    .el-radio-button__inner {
      background-color: var(--main-red) !important;
    }
  }
}
</style>
