<template lang="pug">
.small-dialog-wrapper
  el-dialog(:visible.sync="visible" v-if="user").text-left.dialog
    template(#title)
      .title-container
        i.el-icon-wallet
        .text Transfer

    el-alert(title="Transfering to SCAM account!" type="error" effect="dark" v-if="scam")
      span You are transfering to SCAM account, or FAKE CEX deposit address.

    el-alert(v-if="token.contract === 'usdt.alcor'" title="Do NOT transfer usdt.alcor to CEX" type="warning" class="mb-2" :closable="false")
      span This token can not be transfered to CEX address. Use only Withdraw method for it.

    el-form(ref="form" :model="form" label-position="left" :rules="rules")
      el-form-item.mt-1(prop="address")
        .label {{ $t('Transfer to') }}
        el-input(v-model="form.address" placeholder="address..").w-100

      el-form-item(prop="amount")
        .label {{$t('Amount') }}
        span {{$t('Balance') }}
          el-button(type="text" @click="fullAmount").ml-1.hoverable  {{ tokenBalance | commaFloat }}

        el-input(type="number" v-model="form.amount" clearable placeholder="amount").w-100
          span(slot="suffix").mr-1 {{ token.currency }}
        .text ~${{ usdValue }}

      el-form-item
        .label Memo
        el-input(type="text" v-model="form.memo" clearable placeholder="message").w-100

      el-form-item.mt-1.mb-0
        span.dialog-footer.mb-4
          el-button(type='primary' @click="submit" :disabled="!form.amount || !addressValid || scam" :loading="loading").w-100.done
            | {{ $t('Transfer') }} {{ token.currency }} {{$t('to')}} {{ form.address }}
</template>

<script>
import { mapState } from 'vuex'
import { captureException } from '@sentry/browser'

import config from '~/config'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage,
  },

  watch: {
    token() {
      console.log('AAA', this.token)
    },
  },

  data() {
    return {
      token: {},

      visible: false,

      form: {
        address: null,
        amount: null,
        memo: null,
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
          },
        },
      },
    }
  },

  computed: {
    ...mapState(['user', 'network']),

    scam() {
      return this.network.SCAM_CONTRACTS.includes(this.form.address?.trim())
    },

    usdValue() {
      if (!this.user || !this.user.balances || !this.token.currency) return '0.00'

      return this.$tokenToUSD(this.form.amount, this.token.currency, this.token.contract)
    },

    networks() {
      return Object.values(config.networks)
    },

    chains() {
      return ['eos', 'bos', 'telos', 'wax'].filter((c) => c != this.network.name)
    },

    tokenBalance() {
      if (!this.user || !this.user.balances || !this.token.currency) return '0.0000'

      const balance = this.user.balances.filter((b) => {
        return b.currency === this.token.currency && b.contract === this.token.contract
      })[0]

      if (balance) return `${balance.amount} ${balance.currency}`
      else return Number(0).toFixed(this.token.precision) + ` ${this.token.name}`
    },
  },

  methods: {
    clean() {
      this.form = {
        address: null,
        amount: null,
        memo: null,
      }
    },

    openPopup({ token }) {
      this.token = token
      this.visible = true
    },

    closePopup() {
      this.visible = false
      this.clean()
    },

    fullAmount() {
      this.form.amount = (parseFloat(this.tokenBalance.split(' ')[0]) || 0).toFixed(parseFloat(this.token.decimals))
    },

    setChain(name) {
      this.chain = config.networks[name]
      this.form.address = ''
      this.$refs.form.resetFields()
    },

    amountChange() {
      if (!this.form.amount) return

      this.form.amount = (parseFloat(this.form.amount) || 0).toFixed(this.token.decimals)
    },

    async open() {
      if (!(await this.$store.dispatch('chain/asyncLogin'))) return
      this.visible = true
    },

    async submit() {
      const memo = this.form.memo?.trim() || ''

      this.form.amount = (parseFloat(this.form.amount) || 0).toFixed(this.token.decimals)

      try {
        if (this.network.CEX_CONTRACTS.includes(this.form.address) && memo == '') {
          await this.$confirm(
            'You can lose money by sending tokens to the exchange without a MEMO. Do you want to continue?',
            'Transfer to Exchange accout without MEMO',
            {
              confirmButtonText: 'Yes, i understand',
              cancelButtonText: 'Cancel',
              type: 'warning',
            }
          )
        }
      } catch (e) {
        this.$notify({
          title: 'Canceled',
          type: 'info',
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
          memo,
        })
        this.$store.dispatch('loadUserBalances')

        this.clean()
        this.visible = false

        const txid = r.transaction_id || r.transaction.id.toString()
        this.$notify({
          title: 'Token sent',
          message: `Tx id: ${txid}`,
          type: 'success',
        })

        // this.$alert(
        //   `<a class="pointer" href="${this.monitorTx(txid)}" target="_blank">Transaction id</a>`,
        //   'Transaction complete!',
        //   {
        //     dangerouslyUseHTMLString: true,
        //     confirmButtonText: 'OK',
        //     callback: (action) => {
        //       this.$notify({ title: 'Token transfered!', type: 'success' })
        //     }
        //   }
        // )
      } catch (e) {
        captureException(e)
        this.$notify({
          title: 'Transfer error',
          message: e.message,
          type: 'error',
        })
        console.log(e)
      } finally {
        loading.close()
      }
    },
  },
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
