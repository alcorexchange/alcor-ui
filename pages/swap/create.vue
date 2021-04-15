<template lang="pug">
.row.mt-5
  .col-md-10.m-auto
    el-card
      PleaseLoginButton
        .px-3.mt-2
          h1 Create new pool
          .lead To create a pool, select the quote token and provide the initial liquidity ratio.
          b.text-muted You are the first liquidity provider. The ratio of tokens you add will set the price of this pool.
        el-form(ref="form" label-position="left" v-if="user").px-3.mt-4
          el-form-item
            b Base token:
            span(v-if="base.currency")
              TokenImage(:src="$tokenLogo(base.currency, base.contract)" height="25").ml-2
              span.ml-1 {{ base.currency + '@' + base.contract }}

            el-input(type="number" placeholder='0.0' v-model="amount1" clearable @change="amountChange").input-with-select
              el-select(v-model="base_select", slot='append', placeholder='Select' @change="setBaseToken" value-key="id")
                //el-option(:label="`${baseToken.symbol}@${baseToken.contract}`"
                          :value="{currency: baseToken.symbol, contract: baseToken.contract, decimals: baseToken.precision}")
                  TokenImage(:src="$tokenLogo(baseToken.symbol, baseToken.contract)" height="25")
                  span.ml-3 {{ baseToken.symbol }}@{{ baseToken.contract }}

                // Only system token might be as base toekn of the pool
                el-option(v-for="b in user.balances" :key="b.id", :value="b" :label="`${b.id} ->  ${b.amount} ${b.currency}`")
                  TokenImage(:src="$tokenLogo(b.currency, b.contract)" height="25")
                  span.ml-3 {{ b.id }}
                  span.float-right.ml-4 {{ `${b.amount} ${b.currency}` }}

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
                  span.float-right.ml-4 {{ `${b.amount} ${b.currency}` }}

          el-form-item(v-if="this.base.symbol && this.quote.symbol")
            .lead Backed token symbol (Automatically set recommended)
            el-input(:loading="loading" placeholder='SYMBOL' v-model="tokenSymbol" clearable @input="tokenSymbol = tokenSymbol.toUpperCase();")

          pre Price {{ price }}
          el-form-item
            //span.text-mutted.mt-2   Pool creation fee is:
            //b  {{ network.marketCreationFee }}
            span.text-mutted.mt-2   Pool creation is
            b  FREE
            //b  {{ network.marketCreationFee }}

            el-button(@click="create" type="primary" :loading="loading").w-100 Create

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
        return Math.abs(this.amount2 / this.amount1).toFixed(5) + ` ${this.quote.currency}`
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
          account: this.base.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: this.network.pools.contract,
            quantity: `${this.amount1} ${this.base.currency}`,
            memo: 'deposit'
          }
        }, {
          account: this.quote.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: this.network.pools.contract,
            quantity: `${this.amount2} ${this.quote.currency}`,
            memo: 'deposit'
          }
        },
        {
          account: this.network.pools.contract,
          name: 'inittoken',
          authorization,
          data: {
            user: this.user.name,
            initial_pool1: { contract: this.base.contract, quantity: `${this.amount1} ${this.base.currency}` },
            initial_pool2: { contract: this.quote.contract, quantity: `${this.amount2} ${this.quote.currency}` },
            initial_fee: 30,
            fee_contract: this.network.pools.fee
          }
        }
      ]

      //if (this.user.name != this.network.feeAccount) {
      //  actions.push({
      //    account: this.network.baseToken.contract,
      //    name: 'transfer',
      //    authorization,
      //    data: {
      //      from: this.user.name,
      //      to: this.network.feeAccount,
      //      quantity: this.network.marketCreationFee,
      //      memo: 'Pool creation fee'
      //    }
      //  })
      //}

      this.loading = true
      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
        setTimeout(() => this.$store.dispatch('swap/getPairs'), 1000)
        this.$router.push({ name: 'swap' })

        this.$notify({ title: 'Pool create', message: 'Created', type: 'success' })
        this.visible = false
      } catch (e) {
        console.log(e)
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
