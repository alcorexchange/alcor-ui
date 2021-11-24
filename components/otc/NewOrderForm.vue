<template lang="pug">
// TODO Refactor with walidators for form
div
  el-button(size="medium" type="primary" @click="open").ml-auto
    span
      slot

  el-dialog(title="Create new order", :visible.sync="visible" width="50%" v-if="user && user.balances")
    el-form(ref="form" :model="form" label-position="left" :rules="rules")
      // TODO Bit symbol and amount here
      span Tokens are locked in the contract until the transaction is completed.
      span  You can cancel the transaction at any time and return the tokens.
      h1.leader Sell

      el-form-item(label="Sell token")
        el-select(v-model="tokenSelect", value-key="id" filterable clearable placeholder='Sell token' @change="sellSellToken").w-100
          el-option(v-for="b in user.balances.filter(t => t.currency != 'TLM')" :key="b.id", :value="b" :label="`${b.id} ->  ${b.amount} ${b.currency}`")
            TokenImage(:src="$tokenLogo(b.currency, b.contract)" height="25")
            span.ml-3 {{ b.id }}
            span.float-right {{ `${b.amount} ${b.currency}` }}

      el-form-item(v-if="tokenSelect" label="Token amount")
        el-input-number(v-model="form.sell.amount" :max="form.sell.maxAmount" :precision="form.sell.precision" :step="1").mt-2.w-100

        //el-input-number(v-model="form.buy.amount" :precision="4" :step="1").mt-2.w-100

      div(v-if="form.sell.amount > 0")
        hr

        h1.leader Buy

        el-tabs
          el-tab-pane(label="Auto select")
            el-select(v-model='sellSelect' value-key="id" filterable placeholder='Select' clearable @change="setBuyToken").w-100
              el-option(:label="`${baseToken.symbol}@${baseToken.contract}`"
                        :value="{symbol: baseToken.symbol, contract: baseToken.contract, precision: baseToken.precision}")
                TokenImage(:src="$tokenLogo(baseToken.symbol, baseToken.contract)" height="25")
                span.ml-3 {{ baseToken.symbol }}@{{ baseToken.contract }}

              el-option(
                v-for="t in tokens",
                :key="t.id",
                :label="t.id",
                :value="t"
              )
                TokenImage(:src="$tokenLogo(t.symbol, t.contract)" height="25")
                span.ml-3 {{ t.symbol + '@' + t.contract }}

          el-tab-pane(label="Manually")
            el-form-item(label="Token contract" prop="buy.contract")
              el-input(placeholder="eosio.token betdicetoken ridlridlcoin eosiomeetone etc.." v-model="form.buy.contract")

            el-form-item(v-if="form.buy.contract" label="Token symbol" prop="buy.symbol")
              // TODO Uppercase
              el-input(placeholder="DICE TRYBE CAT EOS etc.." v-model="form.buy.symbol").upperinput

        el-form-item(v-if="form.buy.symbol" label="Token amount")
          //el-input-number(v-model="form.sell.amount" :max="form.sell.maxAmount" :precision="form.sell.precision" :step="1").mt-2.w-100
          el-input-number(v-model="form.buy.amount" :precision="form.buy.precision" :step="1").mt-2.w-100
          .lead.mt-2 Price: {{ price }}

        span.dialog-footer
          el-button(type='primary' v-if="form.buy.amount > 0" @click="submit").w-100 Create order
</template>

<script>
import axios from 'axios'
import { mapGetters } from 'vuex'
import { captureException } from '@sentry/browser'

import TokenImage from '~/components/elements/TokenImage'
import { calculatePrice } from '~/utils'

export default {
  components: {
    TokenImage
  },

  data() {
    return {
      visible: false,

      tokens: [],
      sellSelect: '',

      form: {
        sell: {
          symbol: '',
          contract: '',
          amount: 0.0
        },

        buy: {
          symbol: '',
          contract: '',
          amount: 0.0
        }
      },

      rules: {
        'buy.contract': {
          trigger: 'blur',
          validator: async (rule, value, callback) => {
            try {
              await this.$rpc.get_account(value)
              callback()
            } catch (e) {
              callback(new Error('Account not exists'))
            }
          }
        },

        'buy.symbol': {
          trigger: 'blur',
          validator: async (rule, value, callback) => {
            const r = await this.$rpc.get_currency_stats(this.form.buy.contract, value)

            if (value in r) {
              callback()
              this.setBuyToken({ contract: this.form.buy.contract, symbol: value })
            } else {
              callback(new Error(`No ${value} symbol in ${this.form.buy.contract} contract`))
            }
          }
        }
      },

      formLabelWidth: '120px',
      tokenSelect: ''
    }
  },

  computed: {
    ...mapGetters(['user']),

    price() {
      return calculatePrice(this.form.sell, this.form.buy)
    },

    baseToken() {
      console.log('baseToken', this.$store.state.network.baseToken)
      return this.$store.state.network.baseToken
    }
  },

  mounted() {
    this.fetchTokens()
  },

  methods: {
    sellSellToken(token) {
      this.form.sell = {
        symbol: token.currency,
        contract: token.contract,
        precision: parseInt(token.decimals),
        maxAmount: parseFloat(token.amount),
        amount: 0.0
      }
    },

    async setBuyToken(token) {
      let precision = 4

      try {
        const stat = await this.$store.dispatch('api/getToken', { code: token.contract, symbol: token.symbol })
        precision = stat.supply.symbol.precision()
        console.log(precision)
      } catch (e) {
        captureException(e, { extra: { token } })
        this.$notify({ title: 'Fetch token', message: e.message, type: 'warning' })
        console.log(e)
      }

      this.form.buy = {
        symbol: token.symbol,
        contract: token.contract,
        amount: 0.0,
        precision
      }
    },

    open() {
      if (this.user)
        this.visible = true
      else
        this.$notify({ title: 'Login', message: 'Pleace login first', type: 'info' })
    },

    async fetchTokens() {
      // TODO Автоподгрузка токена
      const { data } = await axios.post('https://api.eosflare.io/v1/eosflare/get_tokens', {
        page: 0,
        lang: 'en-GB',
        limit: 500
      })

      if (data.tokens) {
        this.tokens = data.tokens

        this.tokens.sort((a, b) => {
          if (a.symbol < b.symbol) { return -1 }
          if (a.symbol > b.symbol) { return 1 }

          return 0
        })

        this.tokens.map(b => b.id = b.symbol + '@' + b.contract)
      }
    },

    async submit() {
      const form = { ...this.form } // Copy the reactive object

      form.sell.quantity = `${form.sell.amount.toFixed(form.sell.precision)} ${form.sell.symbol}`
      form.buy.quantity = `${form.buy.amount.toFixed(form.buy.precision)} ${form.buy.symbol}@${form.buy.contract}`

      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter'
      })

      try {
        await this.$store.dispatch('chain/transfer', {
          to: this.$store.state.network.otc.contract,
          contract: form.sell.contract,
          actor: this.user.name,
          quantity: form.sell.quantity,
          memo: `place|${form.buy.quantity}`
        })

        this.$notify({ title: 'Order placed', message: 'Order placed successfully', type: 'success' })
        //this.$notify({ title: 'Place order', message: r.processed.action_traces[0].inline_traces[1].console, type: 'success' })
        this.visible = false
        this.$store.dispatch('otc/fetchOrders')
      } catch (e) {
        captureException(e, { extra: { form } })
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    }
  }
}
</script>

<style scoped>
.el-form {
  padding: 10px 70px;
}

</style>
