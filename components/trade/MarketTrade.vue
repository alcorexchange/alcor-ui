<template lang="pug">
.row
  .col-lg-6
    .d-flex.mb-1
      small.text-success Buy {{ token.symbol.name }}
      span.text-mutted.small.align-self-end.ml-auto {{ baseBalance }}
        i.el-icon-wallet.ml-1

    el-form(ref="form")
      el-form-item
        el-input(type="number" disabled placeholder="Buy at best price" size="medium")
          span(slot="suffix").mr-1 {{ network.baseToken.symbol }}

      el-form-item
        el-input(type="number" clearable v-model="total" @change="format" size="medium")
          span(slot="prefix").mr-1 AMOUNT
          span(slot="suffix").mr-1 {{ network.baseToken.symbol }}

      .px-3
        el-slider(:step="25" v-model="eosPercent" show-stops :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}")

      el-form-item.mt-5
        // TODO разработать компонент которой чекает залогинен ли
        el-button(type="success" size="small" @click="buy('market')").w-100 Buy {{ token.str }}

  .col-lg-6
    .d-flex.mb-1
      small.text-danger Sell {{ token.symbol.name }}
      span.text-mutted.small.align-self-end.ml-auto {{ tokenBalance }}
        i.el-icon-wallet.ml-1

    el-form(ref="form")
      el-form-item
        el-input(type="number" disabled placeholder="Sell at best price" size="medium")
          span(slot="suffix").mr-1.ml-2 {{ network.baseToken.symbol }}

      el-form-item
        el-input(type="number" v-model="amount" clearable @change="format" size="medium")
          span(slot="prefix").mr-1 AMOUNT
          span(slot="suffix").mr-1 {{ token.symbol.name }}

      .px-3
        el-slider(:step="25" v-model="tokenPercent" show-stops :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}")

      el-form-item.mt-5
        // TODO разработать компонент которой чекает залогинен ли
        el-button(type="danger" size="small" @click="sell('market')").w-100 Sell {{ token.str }}
</template>

<script>
// TODO Короче еще сделать для маркеттрейда размер в EOS сумировать по ордерам
import { mapGetters, mapState } from 'vuex'
import { tradeMixin, tradeChangeEvents } from '~/plugins/mixins'

export default {
  mixins: [tradeMixin, tradeChangeEvents],

  data() {
    return {

    }
  },

  computed: {
    ...mapState(['network']),
    ...mapState('market', ['token']),
    ...mapGetters('market', ['sorted_asks', 'sorted_bids']),
    ...mapGetters(['user', 'tokenBalance', 'baseBalance'])
  },

  watch: {
    eosPercent(v) {
      if (!this.baseBalance) return

      const balance = parseFloat(this.baseBalance.split(' ')[0])

      if (balance == 0) return

      if (v === 100) {
        this.total = balance
      } else {
        this.total = balance / 100 * v
      }

      this.format()
    },

    tokenPercent(v) {
      if (!this.tokenBalance) return

      const balance = parseFloat(this.tokenBalance.split(' ')[0])

      if (balance == 0) return

      if (v === 100) {
        this.amount = balance
      } else {
        this.amount = balance / 100 * v
      }

      this.format()
    }
  },

  methods: {
    format() {
      this.total = this.toFixed(this.total, this.network.baseToken.precision)
      this.amount = this.toFixed(this.amount, this.token.symbol.precision)
    }
  }
}

</script>
