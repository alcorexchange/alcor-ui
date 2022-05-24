<template lang="pug">
.row
  .col-lg-6
    .d-flex.mb-1
      small.green {{ $t('Buy') }} {{ quote_token.symbol.name }}
      small.text-mutted.small.align-self-end.ml-auto.cursor-pointer(
        @click='setAmount("buy")'
      ) {{ baseBalance | commaFloat }}
        i.el-icon-wallet.ml-1

    el-form
      el-form-item
        el-input(
          type='number',
          min='0.00000001',
          step='0.00000001',
          v-model='priceBid',
          @change='setPrecisionPrice()',
          size='medium',
          align='right',
          placeholder='0',
          clearable
        )
          span.mr-1(slot='prefix') {{ $t('PRICE') }}
          span.mr-1(slot='suffix') {{ base_token.symbol.name }}

      el-form-item
        el-input(
          type='number',
          v-model='amountBuy',
          @change='setPrecisionAmountBuy()',
          size='medium',
          placeholder='0',
          clearable
        )
          span.mr-1(slot='prefix') {{ $t('AMOUNT') }}
          span.mr-1(slot='suffix') {{ quote_token.symbol.name }}

      .px-3
        el-slider(
          :step='1',
          v-model='percentBuy',
          :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
          :show-tooltip="false"
        )

      el-form-item.mt-4(prop='totalBuy', :inline-message='true')
        el-input(
          type='number',
          v-model='totalBuy',
          @change='setPrecisionTotalBuy()',
          placeholder='0',
          size='medium'
        )
          span.mr-1(slot='prefix') {{ $t('TOTAL') }}
          span.mr-1(slot='suffix') {{ base_token.symbol.name }}

      el-form-item.mt-1
        el-button.w-100(
          size='small',
          type='success',
          @click='actionOrder("limit", "buy")'
        ) {{ $t('Buy') }} {{ quote_token.str }}

  .col-lg-6
    .d-flex.mb-1
      small.red Sell {{ quote_token.symbol.name }}
      small.text-mutted.small.align-self-end.ml-auto.cursor-pointer(
        @click='setAmount("sell")'
      ) {{ tokenBalance | commaFloat }}
        i.el-icon-wallet.ml-1

    el-form
      el-form-item
        el-input(
          type='number',
          min='0',
          step='0.0001',
          value='0',
          v-model='priceBid',
          @change='setPrecisionPrice()',
          size='medium',
          placeholder='0',
          clearable
        )
          span.mr-1(slot='prefix') {{ $t('PRICE') }}
          span.mr-1.ml-2(slot='suffix') {{ base_token.symbol.name }}

      el-form-item
        el-input(
          type='number',
          v-model='amountSell',
          @change='setPrecisionAmountSell()',
          size='medium',
          placeholder='0',
          clearable
        )
          span.mr-1(slot='prefix') {{ $t('AMOUNT') }}
          span.mr-1(slot='suffix') {{ quote_token.symbol.name }}

      .px-3
        el-slider(
          :step='1',
          v-model='percentSell',
          :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
          :show-tooltip="false"
        ).red

      el-form-item.mt-4(prop='totalSell', :inline-message='true')
        el-input(
          type='number',
          v-model='totalSell',
          @change='setPrecisionTotalSell()',
          placeholder='0',
          size='medium'
        )
          span.mr-1(slot='prefix') {{ $t('TOTAL') }}
          span.mr-1(slot='suffix') {{ base_token.symbol.name }}

      el-form-item.mt-1
        el-button.w-100(
          size='small',
          type='danger',
          @click='actionOrder("limit", "sell")'
        ) {{ $t('Sell') }} {{ quote_token.str }}
</template>

<script>
import { trade } from '~/mixins/trade'

export default {
  mixins: [trade],

  computed: {
    percentBuy: {
      get() {
        return this.percent_buy
      },
      set(val) {
        this.changePercentBuy({ percent: val, trade: 'limit' })
      }
    }
  }
}
</script>

<style scoped lang="scss">
.cursor-pointer {
  cursor: pointer;
}
</style>
