<template lang="pug">
div
  .row
    .col
      //el-alert(title="Price can not be a floating point number!", v-show="wrongPrice" type='info', show-icon :closable="false")
        | Please change price or amount. Price = Base amount / quoute amount
        a(href="#", @click.prevent="unitPriceInfo").ml-1  WTF ?
  .row.p-2
    .col-lg-6
      .d-flex.label.mb-3
        span.text-success Buy {{ token.symbol.name }}
        span.text-mutted.small.align-self-end.ml-auto balance: {{ eosBalance }}

      el-form(ref="form" :rules="rules" label-width="60px")
        el-form-item(label="Price")
          el-input(type="number" min="0.00000001" step="0.00000001" v-model="price" clearable @change="priceChange()")
            span(slot="suffix").mr-1 {{ network.baseToken.symbol }}

        el-form-item(label="Amount")
          el-input(type="number" v-model="amount" @change="amountChange()" clearable)
            span(slot="suffix").mr-1 {{ token.symbol.name }}

        el-form-item
          el-slider(:step="25" v-model="eosPercent" show-stops :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}")

        el-form-item(label="Total" prop="total" :inline-message="true").mt-5
          el-input(type="number" v-model="total" @change="totalChange()")
            span(slot="suffix").mr-1 {{ network.baseToken.symbol }}

        el-form-item.mt-2
          // TODO разработать компонент которой чекает залогинен ли
          el-button(size="small" type="success" @click="buy").w-100 Buy {{ token.str }}

    .col-lg-6
      .d-flex.label.mb-3
        span.text-danger Sell {{ token.symbol.name }}
        span.text-mutted.small.align-self-end.ml-auto balance: {{ tokenBalance }}

      el-form(ref="form" :rules="rules" label-width="60px")
        el-form-item(label="Price")
          el-input(type="number" min="0" step="0.0001" value="0" v-model="price" clearable @change="priceChange()")
            span(slot="suffix").mr-1.ml-2 {{ network.baseToken.symbol }}

        el-form-item(label="Amount")
          el-input(type="number" v-model="amount" clearable @change="priceChange()")
            span(slot="suffix").mr-1 {{ token.symbol.name }}

        el-form-item
          el-slider(:step="25" v-model="tokenPercent" show-stops :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}")

        el-form-item(label="Total" prop="total" :inline-message="true").mt-5
          el-input(type="number" v-model="total" @change="totalChange()")
            span(slot="suffix").mr-1 {{ network.baseToken.symbol }}

        el-form-item.mt-2
          // TODO разработать компонент которой чекает залогинен ли
          el-button(size="small" type="danger" @click="sell").w-100 Sell {{ token.str }}
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { tradeMixin, tradeChangeEvents } from '~/plugins/mixins'

export default {
  mixins: [tradeMixin, tradeChangeEvents],

  // TODO Перенести может в миксин тоже
  computed: {
    ...mapState(['network']),
    ...mapState('market', ['token']),
    ...mapGetters('market', ['sorted_asks', 'sorted_bids']),
    ...mapGetters(['user', 'tokenBalance', 'eosBalance']),
    ...mapGetters({ current_price: 'market/price' })
  },

  watch: {
    current_price() {
      if (this.price == 0) {
        this.price = this.$options.filters.humanFloat(this.current_price)
      }
    }
  }
}

</script>
