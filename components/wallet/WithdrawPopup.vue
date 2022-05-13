<template lang="pug">
  el-dialog(title="Token transfer", :visible.sync="visible" width="25%" v-if="user").text-left.dialog
    template(#title)
      .title-container
        i.el-icon-wallet
        .text Transfer
    el-alert(v-if="token.contract == 'bosibc.io'" type="warning" show-icon title="This is IBC token!")
      span Before transferring to exchange, you have to withdraw it to it's original chain using BOS IBC Transfer button!

    el-form(ref="form" :model="form" label-position="left" :rules="rules")
      el-form-item.mt-1(prop="address")
        .label Transfer to
        el-input(v-model="form.address" placeholder="address..").w-100

      el-form-item(prop="amount")
        .label Amount
        span Balance
          el-button(type="text" @click="fullAmount").ml-1  {{ tokenBalance }}

        el-input(type="number" v-model="form.amount" clearable @change="amountChange").w-100
          span(slot="suffix").mr-1 {{ this.token.currency }}

      el-form-item
        .label Memo
        el-input(type="text" v-model="form.memo" clearable placeholder="message").w-100

      el-form-item.mt-1.mb-0
        span.dialog-footer.mb-4
          el-button(type='primary' @click="submit" :disabled="!form.amount || !addressValid" :loading="loading").w-100.done
            | Transfer {{ token.currency }} to {{ form.address }}
</template>

<script>
import { mapState } from 'vuex'
import { captureException } from '@sentry/browser'

import config from '~/config'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage
  },

  data() {
    return {
      token: {},

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
    openPopup({ token }) {
      this.token = token
      this.visible = true
    },
    closePopup() {
      this.visible = false
    },

    fullAmount() {
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
      const memo = this.form.memo.trim()

      try {
        if (this.network.CEX_CONTRACTS.includes(this.form.address) && memo == '') {
          await this.$confirm(
            'You can lose money by sending tokens to the exchange without a MEMO. Do you want to continue?',
            'Transfer to Exchange accout without MEMO',
            {
              confirmButtonText: 'Yes, i understand',
              cancelButtonText: 'Cancel',
              type: 'warning'
            }
          )
        }
      } catch (e) {
        this.$notify({
          title: 'Canceled',
          type: 'info'
        })
        return
      }

      const quantity = this.form.amount + ' ' + this.token.currency

      const loading = this.$loading({ lock: true, text: 'Wait for wallet' })
      try {
        const r = await this.$store.dispatch('chain/transfer', {
          to: this.form.address,
          contract: this.token.contract,
          actor: this.user.name,
          quantity,
          memo
        })
        this.$store.dispatch('loadUserBalances')

        this.visible = false

        const txid = r.transaction_id || r.transaction.id.toString()

        this.$alert(
          `<a href="${this.network.monitor}/tx/${txid}" target="_blank">Transaction id</a>`,
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

<style scoped lang="scss">
.upperinput {
  text-transform: uppercase;
}
.upperinput:placeholder-shown {
  text-transform: none;
}

.dialog::v-deep .el-dialog__body {
  padding: 20px;
}

.title-container {
  display: flex;
  align-items: center;
  .text {
    font-weight: 500;
    padding-left: 8px;
  }
}
.done {
  width: 100%;
  color: var(--main-green);
  padding: 14px 10px;
  border-radius: 10px;
}
.label {
  font-size: 1rem;
  color: var(--text-default);
  // padding-bottom: 20px;
}
.balance {
  color: var(--text-default);
  padding: 6px;
  padding-left: 0;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
}
.el-input::v-deep {
  // margin-bottom: 26px;
  input {
    background: var(--btn-active);
  }
}
.el-form-item {
  width: 100%;
}
</style>
