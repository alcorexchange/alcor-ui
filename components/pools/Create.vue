<template lang="pug">
.row
  .col
    .px-3.mt-2
      h1 Create new pool
    el-form(ref="form" label-position="left").px-3
      el-form-item
        .lead Base token:
          TokenImage(:src="$tokenLogo(base.symbol, base.contract)" height="25").ml-2
          span.ml-1 {{ base.symbol + '@' + base.contract }}

        p Price {{ price }}

        el-input(type="number" placeholder='0.0' v-model="amount1" clearable @change="amountChange").input-with-select
          el-select(v-model="base_select", slot='append', placeholder='Select' @change="setBaseToken" value-key="symbol")
            el-option(:label="`${baseToken.symbol}@${baseToken.contract}`"
                      :value="{symbol: baseToken.symbol, contract: baseToken.contract, precision: baseToken.precision}")
              TokenImage(:src="$tokenLogo(baseToken.symbol, baseToken.contract)" height="25")
              span.ml-3 {{ baseToken.symbol }}@{{ baseToken.contract }}
            el-option(:value="{symbol: 'TKT', contract: 'tktoken', precision: 4}" label="TKT@tktoken")

      el-form-item
        .lead Quote token:
          TokenImage(:src="$tokenLogo(base.symbol, base.contract)" height="25").ml-2
          span.ml-1 {{ quote.symbol + '@' + quote.contract }}

        el-input(type="number" placeholder='0.0' v-model="amount2" clearable @change="amountChange").input-with-select
          el-select(v-model="quote_select", slot='append', placeholder='Select' @change="setQuoteToken" value-key="id")
            el-option(:value="{id: 1, symbol: 'BB', contract: 'bebe', precision: 2}" label="BB@bebe")
            el-option(:value="{id: 2, symbol: 'TKT', contract: 'tktoken', precision: 4}" label="TKT@tktoken")
            el-option(:value="{id: 3, symbol: 'ONE', contract: 'one', precision: 0}" label="ONE@one")

      el-form-item(v-if="this.base.symbol && this.quote.symbol")
        .lead Backed token symbol (Automatically set recommended)
        el-input(:loading="loading" placeholder='SYMBOL' v-model="tokenSymbol" clearable @input="tokenSymbol = tokenSymbol.toUpperCase();")

      el-form-item
        PleaseLoginButton
          el-button(@click="create" :loading="loading").w-100 Create

</template>

<script>
import { mapGetters, mapState } from 'vuex'

import PleaseLoginButton from '~/components/elements/PleaseLoginButton'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage,
    PleaseLoginButton
  },

  data() {
    return {
      amount1: 0.0,
      amount2: 0.0,

      base_select: '',
      quote_select: {},

      tokenSymbol: '',

      base: {},
      quote: {},

      loading: false
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapGetters('api', ['rpc']),
    ...mapState(['network']),

    baseToken() {
      return this.$store.state.network.baseToken
    },

    poolOne() {
      return this.current[this.input]
    },

    poolTwo() {
      return this.current[this.input == 'pool1' ? 'pool2' : 'pool1']
    },

    price() {
      if (this.base.symbol && this.quote.symbol) {
        return Math.abs(this.amount1 / this.amount2).toFixed(5) + ` ${this.base.symbol}`
      } else {
        return '0.0000'
      }
    }
  },

  async created() {
  },

  methods: {
    updateRecommendedSymbol() {
      if (this.base.symbol && this.quote.symbol) {
        this.tokenSymbol = this.base.symbol + this.quote.symbol
      }
    },

    setBaseToken(token) {
      this.base = token

      this.updateRecommendedSymbol()
      this.amountChange()
    },

    setQuoteToken(token) {
      this.quote = token

      this.updateRecommendedSymbol()
      this.amountChange()
    },

    amountChange() {
      this.amount1 = this.toFixed(this.amount1, this.base.precision)
      this.amount2 = this.toFixed(this.amount2, this.quote.precision)
    },

    create() {
      const authorization = [{ actor: this.user.name, permission: 'active' }]

      const actions = [
        {
          account: this.network.pools.contract,
          name: 'openext',
          authorization,
          data: {
            user: this.user.name,
            payer: this.user.name,
            ext_symbol: { contract: this.base.contract, sym: `${this.base.precision},${this.base.symbol}` }
          }
        }, {
          account: this.network.pools.contract,
          name: 'openext',
          authorization,
          data: {
            user: this.user.name,
            payer: this.user.name,
            ext_symbol: { contract: this.quote.contract, sym: `${this.quote.precision},${this.quote.symbol}` }
          }
        }, {
          account: this.base.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: this.network.pools.contract,
            quantity: `${this.amount1} ${this.base.symbol}`,
            memo: ''
          }
        }, {
          account: this.quote.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: this.network.pools.contract,
            quantity: `${this.amount2} ${this.quote.symbol}`,
            memo: ''
          }
        }, {
          account: this.network.pools.contract,
          name: 'inittoken',
          authorization,
          data: {
            user: this.user.name,
            new_symbol: '4,' + this.tokenSymbol,
            ext_asset1: { contract: this.base.contract, quantity: `${this.amount1} ${this.base.symbol}` },
            ext_asset2: { contract: this.quote.contract, quantity: `${this.amount2} ${this.quote.symbol}` },
            initial_fee: 10, // TODO Вынести в параметер тоже
            fee_contract: 'avral.pro' // TODO Это в контракте пофиксить
          }
        }
      ]

      this.loading = true
      try {
        this.$store.dispatch('chain/sendTransaction', actions)
        this.$notify({ title: 'Pool create', message: 'Created', type: 'success' })
      } catch (e) {
        this.$notify({ title: 'Pool create', message: e, type: 'error' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style>
</style>
