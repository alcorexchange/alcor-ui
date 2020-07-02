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

        pre *You will buy 530 RAM bytes for new market creation

      PleaseLoginButton
        el-form(ref="form" :model="form" label-position="left" :rules="rules")
          el-tabs(@tab-click="tokenSelect = ''" type="border-card")
            el-tab-pane(label="Auto select")
              el-alert(v-if="user && !user.balances" type="warning")
                .lead Unable to fetch user tokens.. use manually method

              el-form-item(label="Select token for new market" prop="token.contract")
                el-select(v-model='tokenSelect' v-if="user && user.balances"
       value-key="id" filterable placeholder='Select' clearable @change="selectToken")
                  el-option(
                    v-for="t in user.balances",
                    :key="t.id",
                    :label="t.id",
                    :value="t"
                  )
                    TokenImage(:src="$tokenLogo(t.currency, t.contract)" height="25")
                    span.ml-3 {{ t.currency + '@' + t.contract }}

            el-tab-pane(label="Manually")
              el-form-item(label="Token contract" prop="token.contract")
                el-input(placeholder="eosio.token betdicetoken ridlridlcoin eosiomeetone etc.." v-model="form.token.contract")

              el-form-item(v-if="form.token.contract" label="Token symbol" prop="token.symbol")
                el-input(placeholder="DICE TRYBE CAT EOS etc.." v-model="form.token.symbol").upperinput

            .row(v-if="form.token.contract && form.token.symbol").mt-3
              .col
                .lead
                  TokenImage(:src="$tokenLogo(form.token.symbol, form.token.contract)" height="40")
                  span  {{ form.token.symbol }}@{{ form.token.contract }}
                small.text-mutted.ml-1.mt-2   Creation new market fee is:
                b  {{ network.marketCreationFee }}

            .row.mt-3
              .col
                span.dialog-footer
                  el-button(type='primary' v-if="form.token.symbol" @click="submit").w-100 Create market

</template>

<script>
import { captureException } from '@sentry/browser'

import { mapGetters, mapState } from 'vuex'

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
        token: {
          symbol: '',
          contract: '',
          precision: 4
        }
      },

      rules: {
        'token.contract': {
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

        'token.symbol': {
          trigger: 'blur',
          validator: async (rule, value, callback) => {
            const r = await this.rpc.get_currency_stats(this.form.token.contract, value)

            if (value in r) {
              callback()
            } else {
              callback(new Error(`No ${value} symbol in ${this.form.token.contract} contract`))
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
    ...mapGetters('api', ['rpc']),
    ...mapState(['network'])
  },

  watch: {
    'form.token.symbol'() {
      if (this.form.token.symbol) {
        this.form.token.symbol = this.form.token.symbol.toUpperCase()
      }
    }
  },

  methods: {
    async selectToken(token) {
      let precision = 4

      if (!token) return

      try {
        const stat = await this.$store.dispatch('api/getToken', { code: token.contract, symbol: token.currency })
        precision = stat.supply.symbol.precision()
      } catch (e) {
        captureException(e, { extra: { token } })
        this.$notify({ title: 'Fetch token precision', message: e.message + ' \n Set precision ' + precision, type: 'warning' })
        console.log(e)
      }

      this.form.token = {
        symbol: token.currency,
        contract: token.contract,
        precision
      }
    },

    async submit() {
      const { contract, symbol, precision } = this.form.token

      const authorization = [this.user.authorization]
      const actions = [
        {
          account: this.network.baseToken.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: this.network.contract,
            quantity: this.network.marketCreationFee,
            memo: `new_market|${Number(0).toFixed(precision)} ${symbol}@${contract}`
          }
        },
        {
          account: 'eosio',
          name: 'buyrambytes',
          authorization,
          data: {
            payer: this.user.name,
            receiver: this.network.contract,
            bytes: 530
          }
        }
      ]

      const loading = this.$loading({ lock: true, text: 'Wait for wallet' })

      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
        this.$notify({ title: 'Market creation', message: 'Market was created successfully', type: 'info' })
        this.$router.push({ name: 'markets-id', params: { id: `${symbol}-${contract}` } })
        this.$store.dispatch('loadMarkets')
      } catch (e) {
        captureException(e, { extra: { contract, symbol, precision } })
        this.$notify({ title: 'Market creation', message: e, type: 'error' })
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
