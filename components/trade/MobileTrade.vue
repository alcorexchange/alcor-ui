<template lang="pug">
.row
  .col-5.left-bar
    .row
      .col
        el-radio-group(v-model="side" size="small")
          el-radio-button(label='buy') Buy
          el-radio-button(label='sell') Sell

    .row
      .col
        el-select(v-model='trade', placeholder='Trade' size="small").left-bar
          el-option(label='Limit Trade', value='limit')
          el-option(label='Market Trade', value='market')

    .row.mt-2
      .col
        div(v-if="trade == 'limit'")
          div(v-if="side == 'buy'")
            span.text-success Buy {{ token.symbol.name }}
            br
            span.text-mutted.small.align-self-end.ml-auto balance: {{ baseBalance }}
            br

            label.small Price
            el-input(type="number" min="0.00000001" step="0.00000001" v-model="price" clearable @change="priceChange()")
              span(slot="suffix").mr-1 {{ network.baseToken.symbol }}

            label.small Amount
            el-input(type="number" v-model="amount" @change="amountChange()" clearable)
              span(slot="suffix").mr-1 {{ token.symbol.name }}

            el-slider(:step="25" v-model="eosPercent" show-stops)

            label.small Total
            el-input(type="number" v-model="total" @change="totalChange()")
              span(slot="suffix").mr-1 {{ network.baseToken.symbol }}

            el-button(size="small" type="success" @click="buy").w-100.mt-2 Buy

          div(v-else)
            span.text-danger Sell {{ token.symbol.name }}
            br
            span.text-mutted.small.align-self-end.ml-auto balance: {{ tokenBalance }}
            br

            label.small Price
            el-input(type="number" min="0" step="0.0001" value="0" v-model="price" clearable @change="priceChange()")
              span(slot="suffix").mr-1.ml-2 {{ network.baseToken.symbol }}

            label.small Amount
            el-input(type="number" v-model="amount" clearable @change="priceChange()")
              span(slot="suffix").mr-1 {{ token.symbol.name }}

            el-slider(:step="25" v-model="tokenPercent" show-stops)

            label.small Total
            el-input(type="number" v-model="total" @change="totalChange()")
              span(slot="suffix").mr-1 {{ network.baseToken.symbol }}

            el-button(size="small" type="danger" @click="sell").w-100.mt-2 Sel

        div(v-else)
          div(v-if="side == 'buy'")
            span.text-success Buy {{ token.symbol.name }}
            br
            span.text-mutted.small.align-self-end.ml-auto balance: {{ baseBalance }}
            br

            label.small Price
            el-input(type="number" disabled placeholder="Buy at best price")

            label.small Total
            el-input(type="number" clearable v-model="total")
              span(slot="suffix").mr-1 {{ network.baseToken.symbol }}

            el-slider(:step="25" v-model="eosPercent" show-stops)

            el-button(type="success" size="small" @click="buy").w-100 Buy
          div(v-else)
            span.text-danger Sell {{ token.symbol.name }}
            br
            span.text-mutted.small.align-self-end.ml-auto balance: {{ tokenBalance }}
            br

            label.small Amount
            el-input(type="number" disabled placeholder="Buy at best price")

            label.small Amount
            el-input(type="number" v-model="amount" clearable)
              span(slot="suffix").mr-1 {{ token.symbol.name }}

            el-slider(:step="25" v-model="tokenPercent" show-stops)

            el-button(type="danger" size="small" @click="sell").w-100 Sell

  .col-7
    OrderBook

</template>

<script>
import { mapGetters, mapState } from 'vuex'

import OrderBook from '~/components/trade/OrderBook'
import { tradeMixin, tradeChangeEvents } from '~/plugins/mixins'

export default {
  components: {
    OrderBook
  },

  mixins: [tradeMixin, tradeChangeEvents],

  data() {
    return {
      side: 'buy',
      trade: 'limit'
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapState('market', ['token']),
    ...mapGetters('market', ['sorted_asks', 'sorted_bids']),
    ...mapGetters(['user', 'tokenBalance', 'baseBalance'])
  }

  //computed: {
  //  tradeComponent() {
  //    return this.trade == 'limit' ? LimitTrade : MarketTrade
  //  }
  //}
}
</script>

<style>
.left-bar {
  padding-right: 10px;
}
</style>
