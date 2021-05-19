<template lang="pug">
.row
  .col
    el-card.box-card.mt-3
      .el-form
        .lead.font-weight-bold  This is not a verification or request listing form!

        br

        p By selecting a token from the list below, you will be offered to sign a transaction
          |  that instantly opens a new market that will immediately be ready for placing orders.
          br
          | This happens on smart contract, without the participation of third parties.

        small *You will buy 530(~0.02 {{ network.baseToken.symbol }}) RAM bytes for new market creation

      PleaseLoginButton
        el-form(ref="form" :model="form" label-position="left" :rules="rules")
          el-card.mb-2
            .clearfix(slot="header")
              b.text-muted BASE TOKEN

            el-form-item(label="System token or USDT is recommended" prop="quote_token.contract")
              el-select(v-model='base_select' v-if="user && user.balances"
     value-key="id" filterable placeholder='Select' clearable @change="selectBaseToken")
                el-option(
                  :label="network.baseToken.symbol + '@' + network.baseToken.contract",
                  :value="network.baseToken"
                )
                  TokenImage(:src="$tokenLogo(network.baseToken.symbol, network.baseToken.contract)" height="25")
                  span.ml-3 {{ network.baseToken.symbol + '@' + network.baseToken.contract }}

                el-option(
                  v-for="t in tokens",
                  :key="t.id",
                  :label="t.id",
                  :value="t"
                )
                  TokenImage(:src="$tokenLogo(t.currency, t.contract)" height="25")
                  span.ml-3 {{ t.currency + '@' + t.contract }}

          el-card.mb-2
            .clearfix(slot="header")
              b.text-muted QUOTE TOKEN

            //el-tabs(@tab-click="quote_select = ''" type="border-card")
            el-tabs(@tab-click="quote_select = ''")
              el-tab-pane(label="Auto select")
                el-alert(v-if="user && !user.balances" type="warning")
                  .lead Unable to fetch user tokens.. use manually method

                el-form-item(label="Select token for new market" prop="quote_token.contract")
                  el-select(v-model='quote_select' v-if="user && user.balances"
         value-key="id" filterable placeholder='Select' clearable @change="selectToken")
                    el-option(
                      v-for="t in tokens",
                      :key="t.id",
                      :label="t.id",
                      :value="t"
                    )
                      TokenImage(:src="$tokenLogo(t.currency, t.contract)" height="25")
                      span.ml-3 {{ t.currency + '@' + t.contract }}

              el-tab-pane(label="Manually")
                el-form-item(label="Token contract" prop="quote_token.contract")
                  el-input(placeholder="eosio.token betdicetoken ridlridlcoin eosiomeetone etc.." v-model="form.quote_token.contract")

                el-form-item(v-if="form.quote_token.contract" label="Token symbol" prop="quote_token.symbol")
                  el-input(placeholder="DICE TRYBE CAT EOS etc.." v-model="form.quote_token.symbol").upperinput

              .row(v-if="form.quote_token.contract && form.quote_token.symbol").mt-3
                .col
                  .lead
                    TokenImage(:src="$tokenLogo(form.quote_token.symbol, form.quote_token.contract)" height="40")
                    span  {{ form.quote_token.symbol }}@{{ form.quote_token.contract }}
                  small.text-muted.ml-1.mt-2   Creation new market fee is:
                    span(v-if="network.baseToken.contract != base_token.contract")  (x2 for custom base token)
                  b  {{ creation_fee }}

              .row.mt-3
                .col
                  span.dialog-footer
                    el-button(type='primary' v-if="form.quote_token.symbol" @click="submit").w-100 Create market

</template>

<script>
import { captureException } from '@sentry/browser'

import { mapGetters, mapState } from 'vuex'
import { asset } from 'eos-common'

import TokenImage from '~/components/elements/TokenImage'
import PleaseLoginButton from '~/components/elements/PleaseLoginButton'

export default {
  components: {
    TokenImage,
    PleaseLoginButton
  },

  data() {
    return {
      form: {
        base_token: {
          symbol: '',
          contract: '',
          precision: 4
        },

        quote_token: {
          symbol: '',
          contract: '',
          precision: 4
        }
      },

      rules: {
        'quote_token.contract': {
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

        'quote_token.symbol': {
          trigger: 'blur',
          validator: async (rule, value, callback) => {
            const r = await this.$rpc.get_currency_stats(
              this.form.quote_token.contract,
              value
            )

            if (value in r) {
              this.selectToken(this.form.quote_token)
              callback()
            } else {
              callback(
                new Error(
                  `No ${value} symbol in ${this.form.quote_token.contract} contract`
                )
              )
            }
          }
        }
      },

      formLabelWidth: '120px',

      base_select: '',
      quote_select: '',
      creation_fee: ''
    }
  },

  computed: {
    ...mapGetters(['user', 'knownTokens']),
    ...mapState(['network']),

    tokens() {
      return this.user.balances.filter((t) => {
        if (
          t.contract == this.network.baseToken.contract &&
          t.currency == this.network.baseToken.symbol
        )
          return false

        //return !this.knownTokens.some(k => k.str == t.id)
        return true
      })
    }
  },

  watch: {
    base_select() {
      const creation_fee = asset(this.network.marketCreationFee)

      if (
        this.base_token.contract != this.network.contract &&
        this.base_token.symbol != this.network.baseToken.symbol
      ) {
        creation_fee.set_amount(creation_fee.amount * 2)
      }

      this.creation_fee = creation_fee.to_string()
    },

    'form.quote_token.symbol'() {
      if (this.form.quote_token.symbol) {
        this.form.quote_token.symbol = this.form.quote_token.symbol.toUpperCase()
      }
    }
  },

  mounted() {
    this.base_select =
      this.network.baseToken.symbol + '@' + this.network.baseToken.contract
    this.base_token = {
      symbol: this.network.baseToken.symbol,
      contract: this.network.baseToken.contract,
      precision: this.network.baseToken.precision
    }
  },

  methods: {
    async selectToken(token) {
      let precision = 4

      if (!token) return

      try {
        const stat = await this.$store.dispatch('api/getToken', {
          code: token.contract,
          symbol: token.currency || token.symbol
        })
        precision = stat.supply.symbol.precision()
      } catch (e) {
        captureException(e, { extra: { token } })
        this.$notify({
          title: 'Fetch token precision',
          message: e.message + ' \n Set precision ' + precision,
          type: 'warning'
        })
        console.log(e)
      }

      this.form.quote_token = {
        symbol: token.currency || token.symbol,
        contract: token.contract,
        precision
      }
    },

    selectBaseToken(token) {
      this.base_token = {
        symbol: token.currency || token.symbol,
        contract: token.contract,
        precision: token.precision || parseFloat(token.decimals)
      }
    },

    async submit() {
      const { contract, symbol, precision } = this.form.quote_token

      const base_token_memo = `${Number(0).toFixed(
        this.base_token.precision
      )} ${this.base_token.symbol}@${this.base_token.contract}`

      const authorization = [this.user.authorization]
      const actions = [
        {
          account: this.network.baseToken.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: this.network.contract,
            quantity: this.creation_fee,
            memo: `new_market|${base_token_memo}|${Number(0).toFixed(
              precision
            )} ${symbol}@${contract}`
          }
        }
      ]

      // No need buy ram for Proton
      if (this.network.name != 'proton') {
        actions.push({
          account: 'eosio',
          name: 'buyrambytes',
          authorization,
          data: {
            payer: this.user.name,
            receiver: this.network.contract,
            bytes: 530
          }
        })
      }

      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
        this.$notify({
          title: 'Market creation',
          message: 'Market was created successfully',
          type: 'info'
        })
        this.$router.push({
          name: 'trade-index-id',
          params: {
            id: `${symbol}-${contract}_${this.base_token.symbol}-${this.base_token.contract}`
          }
        })
        await this.$store.dispatch('loadMarkets')
      } catch (e) {
        captureException(e, { extra: { contract, symbol, precision } })
        this.$notify({ title: 'Market creation', message: e, type: 'error' })
        console.log(e)
      }
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
