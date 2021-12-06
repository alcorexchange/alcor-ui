<template lang="pug">
.ibc-withdraw
  el-button(type="primary" icon="el-icon-s-promotion" size="mini" @click="open") Withdraw

  el-dialog(title="Withdraw", :visible.sync="visible" width="50%" v-if="user").text-left
    el-form(ref="form" :model="form" label-position="left" :rules="rules")
      el-form-item.mb-2
        b Your token will be transferred to {{ peg.network }}
        div {{ peg.desc }}

      el-form-item.mt-1(prop="address")
        template(slot="label")
          b {{ chain.name }} address:
        el-input(v-model="form.address" placeholder="address.." clearable).w-100

      el-form-item(prop="amount")
        span
          b Withdraw amount

          br

          span Balance
            el-button(type="text" @click="fullAmount").ml-1  {{ tokenBalance }}

        //small.float-right min: {{ ibcMinAccept }} {{ token.symbol }}
        small.float-right fee: {{ this.form.fee }} {{ token.symbol }}
        el-input(type="number" v-model="form.amount" clearable @change="amountChange" :min="ibcMinAccept").w-100
          span(slot="suffix").mr-1 {{ this.token.symbol }}

      el-form-item.mt-1(v-if="addressValid")
        span.dialog-footer.mb-4
          el-button(type='primary' @click="submit" :disabled="!form.amount || !addressValid" :loading="loading").w-100
            | Transfer {{ token.symbol }} to {{ peg.network }}
</template>

<script>
import { captureException } from '@sentry/browser'
import { mapState } from 'vuex'
import PEGS from '~/core/ibc/pegs'

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
          symbol: 'EOS',
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
        fee: 0
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
              await this.peg.isValid(value)
              this.addressValid = true
              callback()
            } catch (e) {
              this.addressValid = false
              callback(e)
            } finally {
              this.loading = false
            }
          }
        }
      }
    }
  },

  computed: {
    ...mapState(['user', 'network', 'ibcTokens', 'ibcAccepts']),

    peg() {
      return `${this.token.symbol}@${this.token.contract}` in PEGS[this.network.name]
        ? new PEGS[this.network.name][`${this.token.symbol}@${this.token.contract}`](this.$store) : {}
    },

    networks() {
      return Object.values(config.networks)
    },

    chains() {
      return ['eos', 'bos', 'telos', 'wax'].filter(c => c != this.network.name)
    },

    tokenBalance() {
      if (!this.user || !this.user.balances || !this.token.symbol) return '0.0000'

      const balance = this.user.balances.filter((b) => {
        return b.currency === this.token.symbol && b.contract === this.token.contract
      })[0]

      if (balance)
        return `${balance.amount} ${balance.currency}`
      else
        return Number(0).toFixed(this.token.precision) + ` ${this.token.name}`
    },

    ibcMinAccept() {
      const accept = this.ibcAccepts.filter(t => {
        return t.accept.split(' ')[1] == this.token.symbol
      })[0]
      console.log(accept)

      if (accept) return parseFloat(accept.min_once_transfer)

      return 0
    }
  },

  watch: {
    'form.amount'() {
      this.form.fee = this.peg.getFee(this.form.amount).toFixed(8)
    }
  },

  methods: {
    fullAmount() {
      this.form.amount = (parseFloat(this.tokenBalance.split(' ')[0]) || 0).toFixed(this.token.precision)
    },

    setChain(name) {
      this.chain = config.networks[name]
      this.form.address = ''
      this.$refs.form.resetFields()
    },

    amountChange() {
      this.form.amount = (parseFloat(this.form.amount) || 0).toFixed(this.token.precision)
    },

    async open() {
      if (!await this.$store.dispatch('chain/asyncLogin')) return
      this.visible = true
    },

    async submit() {
      try {
        const r = await this.peg.withdraw(this.form.amount, this.form.address)

        this.visible = false

        this.$alert(`<a href="${this.network.monitor}/tx/${r.transaction_id}" target="_blank">Transaction id</a>`, 'Transaction complete!', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: 'OK',
          callback: (action) => {
            this.$notify({ title: 'Withdraw in process', type: 'success' })
          }
        })

        //this.$notify({ title: 'Place order', message: r.processed.action_traces[0].inline_traces[1].console, type: 'success' })
      } catch (e) {
        captureException(e)
        this.$notify({ title: 'Withdraw error', message: e.message, type: 'error' })
        console.log(e)
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
