<template lang="pug">
div
  el-button(type="primary" size="small" @click="open") Create pool

  el-dialog(title="New pool creation", :visible="visible" @close="visible = false" width="50%" :append-to-body="true")
    .row
      .col
        PleaseLoginButton
          .px-3.mt-2
            h1 Create new pool
            .lead To create a pool, select the quote token and provide the initial liquidity ratio.
          el-form(ref="form" label-position="left" v-if="user").px-3
            el-form-item
              b Base token:
              span(v-if="base.currency")
                TokenImage(:src="$tokenLogo(base.currency, base.contract)" height="25").ml-2
                span.ml-1 {{ base.currency + '@' + base.contract }}

              el-input(type="number" placeholder='0.0' v-model="amount1" clearable @change="amountChange").input-with-select
                el-select(v-model="base_select", slot='append', placeholder='Select' @change="setBaseToken" value-key="id")
                  el-option(:label="`${baseToken.symbol}@${baseToken.contract}`"
                            :value="{currency: baseToken.symbol, contract: baseToken.contract, decimals: baseToken.precision}")
                    TokenImage(:src="$tokenLogo(baseToken.symbol, baseToken.contract)" height="25")
                    span.ml-3 {{ baseToken.symbol }}@{{ baseToken.contract }}

                  // Only system token might be as base toekn of the pool
                  //el-option(v-for="b in user.balances" :key="b.id", :value="b" :label="`${b.id} ->  ${b.amount} ${b.currency}`")
                    TokenImage(:src="$tokenLogo(b.currency, b.contract)" height="25")
                    span.ml-3 {{ b.id }}
                    span.float-right {{ `${b.amount} ${b.currency}` }}

            el-form-item
              .lead Quote token:
                span(v-if="quote.id")
                  TokenImage(:src="$tokenLogo(quote.currency, quote.contract)" height="25").ml-2
                  span.ml-1 {{ quote.currency + '@' + quote.contract }}

              el-input(type="number" placeholder='0.0' v-model="amount2" clearable @change="amountChange").input-with-select
                el-select(v-model="quote_select", slot='append', placeholder='Select' @change="setQuoteToken" value-key="id")
                  el-option(v-for="b in user.balances" :key="b.id", :value="b" :label="`${b.id} ->  ${b.amount} ${b.currency}`")
                    TokenImage(:src="$tokenLogo(b.currency, b.contract)" height="25")
                    span.ml-3 {{ b.id }}
                    span.float-right {{ `${b.amount} ${b.currency}` }}

            el-form-item(v-if="this.base.symbol && this.quote.symbol")
              .lead Backed token symbol (Automatically set recommended)
              el-input(:loading="loading" placeholder='SYMBOL' v-model="tokenSymbol" clearable @input="tokenSymbol = tokenSymbol.toUpperCase();")

            pre Price {{ price }}
            el-form-item
              span.text-mutted.mt-2   Pool creation fee is:
              b  {{ network.marketCreationFee }}

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

      loading: false,

      visible: false
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapState(['network']),

    baseToken() {
      return this.$store.state.network.baseToken
    },

    price() {
      if (this.base.currency && this.quote.currency) {
        return Math.abs(this.amount1 / this.amount2).toFixed(5) + ` ${this.base.currency}`
      } else {
        return '0.0000'
      }
    }
  },

  mounted() {
    this.base_select = {
      currency: this.baseToken.symbol, contract: this.baseToken.contract, decimals: this.baseToken.precision
    }
    this.base = { currency: this.baseToken.symbol, contract: this.baseToken.contract, decimals: this.baseToken.precision }
    this.amountChange()
  },

  methods: {
    open() {
      this.visible = true
    },

    updateRecommendedSymbol() {
      if (this.base.currency && this.quote.currency) {
        const precision = (parseFloat(this.base.decimals) + parseFloat(this.quote.decimals)) / 2
        this.tokenSymbol = this.base.currency + this.quote.currency
        this.tokenSymbol = `${precision},${this.tokenSymbol}`
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
      this.amount1 = this.toFixed(this.amount1, this.base.decimals)
      this.amount2 = this.toFixed(this.amount2, this.quote.decimals)
    },

    async create() {
      const authorization = [this.user.authorization]

      const actions = [
        {
          account: 'evolutiondex',
          name: 'openext',
          authorization,
          data: {
            user: this.user.name,
            payer: this.user.name,
            ext_symbol: { contract: this.base.contract, sym: `${this.base.decimals},${this.base.currency}` }
          }
        }, {
          account: 'evolutiondex',
          name: 'openext',
          authorization,
          data: {
            user: this.user.name,
            payer: this.user.name,
            ext_symbol: { contract: this.quote.contract, sym: `${this.quote.decimals},${this.quote.currency}` }
          }
        }, {
          account: this.base.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: 'evolutiondex',
            quantity: `${this.amount1} ${this.base.currency}`,
            memo: ''
          }
        },
        {
          account: this.quote.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: 'evolutiondex',
            quantity: `${this.amount2} ${this.quote.currency}`,
            memo: ''
          }
        }, {
          account: 'evolutiondex',
          name: 'inittoken',
          authorization,
          data: {
            user: this.user.name,
            new_symbol: this.tokenSymbol,
            initial_pool1: { contract: this.base.contract, quantity: `${this.amount1} ${this.base.currency}` },
            initial_pool2: { contract: this.quote.contract, quantity: `${this.amount2} ${this.quote.currency}` },
            initial_fee: 10,
            fee_contract: this.network.pools.fee
          }
        }
      ]

      if (this.user.name != this.network.feeAccount) {
        actions.push({
          account: this.network.baseToken.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: this.network.feeAccount,
            quantity: this.network.marketCreationFee,
            memo: 'Pool creation fee'
          }
        })
      }

      this.loading = true
      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
        this.$notify({ title: 'Pool create', message: 'Created', type: 'success' })
        this.visible = false
        this.$store.dispatch('pools/fetchPools')
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
