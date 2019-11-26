<template lang="pug">
// TODO Refactor with walidators for form
// TODO Mobile version
div
  el-button(icon="el-icon-plus" size="medium" type="primary" @click="open")
    slot

  el-dialog(
    v-if="user"
    title="Open new market or create new order for exists market"
    :visible.sync="visible"
  )
    span It is free, just make the first order. Market will be created automatically.
    .text-mutted If market already exists, order will be processed as regular sell order.

    el-form(ref="form" :model="form" label-position="left" :rules="rules").mt-2
      // TODO Bit symbol and amount here
      h1.leader Sell

      el-form-item(label="Sell token")
        el-select(v-model="tokenSelect", value-key="id" filterable clearable placeholder='Sell token' @change="sellSellToken").w-100
          el-option(v-for="b in sellTokens" :key="b.id", :value="b" :label="`${b.id} ->  ${b.amount} ${b.currency}`")
            TokenImage(:src="$tokenLogo(b.currency, b.contract)" height="25")
            span.ml-3 {{ b.id }}
            span.float-right {{ `${b.amount} ${b.currency}` }}

      el-form-item(v-if="tokenSelect").mt-2
        el-form-item
          slot(name="label")
            TokenImage(:src="$tokenLogo(this.form.sell.symbol, this.form.sell.contract)" height="50")
            span.ml-2 Token Amount

        el-input-number(v-model="form.sell.amount" :max="form.sell.maxAmount" :precision="form.sell.precision" :step="1").mt-2.w-100

      div(v-if="form.sell.amount > 0")
        hr
        h1.leader Buy
        hr

        el-form-item
          slot(name="label")
            TokenImage(:src="$tokenLogo('EOS', 'eosio.token')" height="50")
            span EOS Amount

          //el-input(type="number" v-model="form.buy.amount" min="0.0001" pattern="\d{4}" :step="0.1" clearable).mt-1
          el-input-number(v-model="form.buy.amount" :precision="4" :step="1").mt-2.w-100
            span(slot="suffix").mr-1 EOS

          .lead.mt-2 Price: {{ price }}

        el-alert(title="Amounts does't match unit price!", v-show="wrongPrice" type='info', show-icon :closable="false").mb-2
          | Please change price or amount.
          a(href="#", @click.prevent="unitPriceInfo").ml-1  WTF ?

        span.dialog-footer
          el-button(type='primary' v-if="form.buy.amount > 0" @click="submit" :disabled="wrongPrice").w-100 Create order
</template>

<script>
import { captureException } from '@sentry/browser'

import { mapGetters } from 'vuex'

import config from '~/config'
import TokenImage from '~/components/elements/TokenImage'
import { calculatePrice, assetToAmount } from '~/utils'

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
          amount: 1.0
        }
      },

      rules: {
        'buy.contract': {
          trigger: 'blur',
          validator: async (rule, value, callback) => {
            try {
              await this.rpc.get_account(value)
              callback()
            } catch (e) {
              callback(new Error('Account not exists'))
            }
          }
        },

        'buy.symbol': {
          trigger: 'blur',
          validator: async (rule, value, callback) => {
            const r = await this.rpc.get_currency_stats(this.form.buy.contract, value)

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
    ...mapGetters('chain', ['rpc']),

    wrongPrice() {
      if (this.form.sell.amount === 0.0 || this.form.buy.amount == 0.0) return false

      return assetToAmount(this.form.buy.amount, 4) * config.PRICE_SCALE %
        assetToAmount(this.form.sell.amount, this.form.sell.precision) !== 0
    },

    sellTokens() {
      if (!this.user.balances) return

      return this.user.balances.filter(b => b.currency !== 'EOS')
    },

    price() {
      return calculatePrice(this.form.sell, this.form.buy)
    }
  },

  created() {
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
        const { rows: [stat] } = await this.rpc.get_table_rows({
          code: token.contract,
          scope: token.symbol,
          table: 'stat'
        })
        precision = stat.max_supply.split(' ')[0].split('.')[1].length
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

    fetchTokens() {
      // TODO Refactor, bar code here
      const efSocket = new WebSocket('wss://api-v1.eosflare.io/socket.io/?EIO=3&transport=websocket')

      efSocket.addEventListener('open', (event) => {
        efSocket.addEventListener('message', (event) => {
          const code = event.data.substr(0, 2)

          if (code == 42) {
            this.tokens = JSON.parse(JSON.parse(event.data.substr(2))[1]).tokens

            this.tokens.sort((a, b) => {
              if (a.symbol < b.symbol) { return -1 }
              if (a.symbol > b.symbol) { return 1 }

              return 0
            })

            this.tokens.map(b => b.id = b.symbol + '@' + b.contract)
          }
        })

        efSocket.send('42["message", {"_url":"/chain/get_tokens","_method":"POST","_headers":{"content-type":"application/json"},"page":0,"limit":500,"lang":"en-US"}]')
      })
    },

    submit() {
      const form = { ...this.form } // Copy the reactive object

      form.sell.quantity = `${form.sell.amount.toFixed(form.sell.precision)} ${form.sell.symbol}`
      form.buy.quantity = `${form.buy.amount.toFixed(4)} EOS@eosio.token`

      this.$confirm(`Are you sure to sell ${form.sell.quantity} for ${form.buy.quantity}`, 'Sell', {
        confirmButtonText: 'Sell',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        this.$emit('submit', form)
        this.visible = false
      }).catch(() => {
      })
    }
  }
}
</script>

<style scoped>
.el-form {
  padding: 10px 70px;
}

.upperinput {
    text-transform: uppercase;
}

.upperinput:placeholder-shown {
    text-transform: none;
}

@media only screen and (max-width: 600px) {
  .el-form {
    padding: 0px;
  }
}
</style>
