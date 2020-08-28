<template lang="pug">
.row
  .col-lg-6
    .d-flex.mb-1
      small.text-success Buy {{ token.symbol.name }}
      span.text-mutted.small.align-self-end.ml-auto {{ baseBalance }}
        i.el-icon-wallet.ml-1

    el-form(ref="form" :rules="rules")
      el-form-item
        el-input(type="number" min="0.00000001" step="0.00000001" v-model="price" clearable @change="priceChange()" size="medium" align="right")
          span(slot="prefix").mr-1 PRICE
          span(slot="suffix").mr-1 {{ network.baseToken.symbol }}

      el-form-item
        el-input(type="number" v-model="amount" @change="amountChange()" clearable size="medium")
          span(slot="prefix").mr-1 AMOUNT
          span(slot="suffix").mr-1 {{ token.symbol.name }}

      .px-3
        el-slider(:step="25" v-model="eosPercent" show-stops :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}")

      el-form-item(prop="total" :inline-message="true").mt-4
        el-input(type="number" v-model="total" @change="totalChange()" size="medium")
          span(slot="prefix").mr-1 TOTAL
          span(slot="suffix").mr-1 {{ network.baseToken.symbol }}

      el-form-item.mt-1
        // TODO разработать компонент которой чекает залогинен ли
        el-button(size="small" type="success" @click="buy('limit')").w-100 Buy {{ token.str }}

  .col-lg-6
    .d-flex.mb-1
      small.text-danger Sell {{ token.symbol.name }}
      span.text-mutted.small.align-self-end.ml-auto {{ tokenBalance }}
        i.el-icon-wallet.ml-1

    el-form(ref="form" :rules="rules")
      el-form-item
        el-input(type="number" min="0" step="0.0001" value="0" v-model="price" clearable @change="priceChange()" size="medium")
          span(slot="prefix").mr-1 PRICE
          span(slot="suffix").mr-1.ml-2 {{ network.baseToken.symbol }}

      el-form-item
        el-input(type="number" v-model="amount" clearable @change="priceChange()" size="medium")
          span(slot="prefix").mr-1 AMOUNT
          span(slot="suffix").mr-1 {{ token.symbol.name }}

      .px-3
        el-slider(:step="25" v-model="tokenPercent" show-stops :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}")

      el-form-item(prop="total" :inline-message="true").mt-4
        el-input(type="number" v-model="total" @change="totalChange()" size="medium")
          span(slot="prefix").mr-1 TOTAL
          span(slot="suffix").mr-1 {{ network.baseToken.symbol }}

      el-form-item.mt-1
        el-button(size="small" type="danger" @click="sell('limit')").w-100 Sell {{ token.str }}
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { tradeMixin, tradeChangeEvents } from '~/plugins/mixins'

export default {
  mixins: [tradeMixin, tradeChangeEvents],

  computed: {
    ...mapState(['network']),
    ...mapState('market', ['token']),
    ...mapGetters('market', ['sorted_asks', 'sorted_bids']),
    ...mapGetters(['user', 'tokenBalance', 'baseBalance']),
    ...mapGetters({ current_price: 'market/price' })
  },

  watch: {
    current_price() {
      if (this.price == 0) {
        this.price = this.$options.filters.humanPrice(this.current_price).replace(',', '')
      }
    }
  }
}

</script>
