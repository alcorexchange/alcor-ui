<template lang="pug">
.ibc-withdraw
  el-button(type="text" plain size="mini" icon="el-icon-s-promotion" @click="open").hover-opacity Transfer

  el-dialog(title="Token transfer", :visible.sync="visible" width="25%" v-if="user").text-left
    el-alert(v-if="token.contract == 'bosibc.io'" type="warning" show-icon title="This is IBC token!")
      span Before transferring to exchange, you have to withdraw it to it's original chain using BOS IBC Transfer button!

    el-form(ref="form" :model="form" label-position="left" :rules="rules")
      el-form-item.mt-1(prop="address")
        template(slot="label")
          b Receiver
        el-input(v-model="form.address" placeholder="address..").w-100

      el-form-item(prop="amount")
        span
          b Amount

          br

          span Balance
            el-button(type="text" @click="fullAmount").ml-1  {{ tokenBalance }}

        el-input(type="number" v-model="form.amount" clearable @change="amountChange").w-100
          span(slot="suffix").mr-1 {{ this.token.currency }}

        b Memo
        el-input(type="text" v-model="form.memo" clearable placeholder="message").w-100

      el-form-item.mt-1
        span.dialog-footer.mb-4
          el-button(type='primary' @click="submit" :disabled="!form.amount || !addressValid" :loading="loading").w-100
            | Transfer {{ token.currency }} to {{ form.address }}
</template>

<script>
// import fetch from 'node-fetch'
// import { JsonRpc } from 'eosjs'

import { captureException } from '@sentry/browser'
import { mapState } from 'vuex'
// import { asset } from 'eos-common'

import config from '~/config'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage
  },

  props: {
    token: {
      type: Object,
      default: () => {
        return {
          precision: 4,
          currency: 'EOS',
          contract: 'eosio.token'
        }
      }
    }
  },

  data() {
    return {
      visible: false,

      form: {
        address: '',
        amount: 0.0,
        memo: ''
      },

      addressValid: false,

      chain_select: null,
      chain: {},

      loading: false,

      rules: {
        address: {
          trigger: 'blur',
          validator: async (rule, value, callback) => {
            try {
              this.loading = true
              await this.$rpc.get_account(value)
              this.addressValid = true
              callback()
            } catch (e) {
              this.addressValid = false
              callback(new Error('Account does not exist!'))
            } finally {
              this.loading = false
            }
          }
        }
      }
    }
  },

  computed: {
    ...mapState(['user', 'network']),

    networks() {
      return Object.values(config.networks)
    },

    chains() {
      return ['eos', 'bos', 'telos', 'wax'].filter(
        (c) => c != this.network.name
      )
    },

    tokenBalance() {
      if (!this.user || !this.user.balances || !this.token.currency)
        return '0.0000'

      const balance = this.user.balances.filter((b) => {
        return (
          b.currency === this.token.currency &&
          b.contract === this.token.contract
        )
      })[0]

      if (balance) return `${balance.amount} ${balance.currency}`
      else
        return Number(0).toFixed(this.token.precision) + ` ${this.token.name}`
    }
  },

  methods: {
    fullAmount() {
      console.log(this.token)
      this.form.amount = (
        parseFloat(this.tokenBalance.split(' ')[0]) || 0
      ).toFixed(parseFloat(this.token.decimals))
    },

    setChain(name) {
      this.chain = config.networks[name]
      this.form.address = ''
      this.$refs.form.resetFields()
    },

    amountChange() {
      this.form.amount = (parseFloat(this.form.amount) || 0).toFixed(
        this.token.decimals
      )
    },

    async open() {
      if (!(await this.$store.dispatch('chain/asyncLogin'))) return
      this.visible = true
    },

    async submit() {
      if (this.token.contract == 'bosibc.io') {
        await this.$confirm(
          'Make sure you not send tokens to an Exchange, this is NOT original token, before transfer, you have to withdraw it to original chain',
          'IBC Token aert',
          {
            confirmButtonText: 'Yes, i understand',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }
        )
      }

      const quantity = this.form.amount + ' ' + this.token.currency

      const loading = this.$loading({ lock: true, text: 'Wait for wallet' })
      try {
        const r = await this.$store.dispatch('chain/transfer', {
          to: this.form.address,
          contract: this.token.contract,
          actor: this.user.name,
          quantity,
          memo: this.form.memo
        })
        this.$store.dispatch('loadUserBalances')

        this.visible = false

        this.$alert(
          `<a href="${this.network.monitor}/tx/${r.transaction_id}" target="_blank">Transaction id</a>`,
          'Transaction complete!',
          {
            dangerouslyUseHTMLString: true,
            confirmButtonText: 'OK',
            callback: (action) => {
              this.$notify({ title: 'Token transfered!', type: 'success' })
            }
          }
        )
      } catch (e) {
        captureException(e)
        this.$notify({
          title: 'Transfer error',
          message: e.message,
          type: 'error'
        })
        console.log(e)
      } finally {
        loading.close()
      }
    }
  }
}
</script>

<style>
.upperinput {
  text-transform: uppercase;
}
.upperinput:placeholder-shown {
  text-transform: none;
}

.ibc-withdraw .el-dialog__body {
  padding: 0px 20px 5px 20px;
}
</style>
