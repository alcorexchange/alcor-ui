<template lang="pug">
.row
  .col
    el-card.box-card.mt-3
      el-alert(:closable="false" show-icon type="info" v-if="!user").mt-4
        | Please login with scatter

      el-form(v-else ref="form" :model="form" label-position="left" :rules="rules").mt-2
        .lead Auto market creation
        small You need around 300 buyes of free RAM for new market

        el-tabs(@tab-click="tokenSelect = ''")
          el-tab-pane(label="Auto select")
            el-alert(v-if="user && !user.balances" type="warning")
              .lead Unable to fetch user tokens.. use manually method

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

export default {
  components: {
    TokenImage
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
      this.form.token.symbol = this.form.token.symbol.toUpperCase()
    }
  },

  methods: {
    async selectToken(token) {
      let precision = 4

      try {
        const { rows: [stat] } = await this.rpc.get_table_rows({
          code: token.contract,
          scope: token.currency,
          table: 'stat'
        })
        precision = stat.max_supply.split(' ')[0].split('.')[1].length
      } catch (e) {
        captureException(e, { extra: { token } })
        this.$notify({ title: 'Fetch token', message: e.message, type: 'warning' })
        console.log(e)
      }

      this.form.token = {
        symbol: token.currency,
        contract: token.contract,
        precision
      }
    },

    async submit() {
      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter'
      })

      const { contract, symbol, precision } = this.form.token

      try {
        await this.$store.dispatch('chain/transfer', {
          contract: this.network.baseToken.contract,
          actor: this.user.name,
          quantity: this.network.marketCreationFee,
          memo: `new_market|${Number(0).toFixed(precision)} ${symbol}@${contract}`
        })
        this.$notify({ title: 'Market creation', message: 'Market was created successfully', type: 'info' })
        this.$router.push({ name: 'index' })
      } catch (e) {
        captureException(e, { extra: { contract, symbol, precision } })
        this.$notify({ title: 'Market creation', message: e.message, type: 'error' })
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
