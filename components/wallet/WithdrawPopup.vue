<template lang="pug">
el-dialog(:visible.sync='visible', width='400px')
  template(#title)
    .title-container
      i.el-icon-wallet
      .text Withdraw Token
  el-form.main(ref="form" :model="form" :rules="rules")

    el-form-item.mt-1(prop="address")
      .label Transfer to
      el-input(v-model="form.address" placeholder="Address" clearable).w-100

    //- .label Transfer to
    //- el-input(placeholder='Address')
    el-form-item(prop="amount")
      .label Amount
      .balance.float-left(@click='fullAmount') Balance: {{ tokenBalance }}
      small.float-right fee: {{ this.form.fee }} {{ token.symbol }}
      el-input(type="number" v-model="form.amount" clearable @change="amountChange" :min="ibcMinAccept").w-100
        span(slot="suffix").mr-1 {{ this.token.symbol }}

    //- .label Amount
    //- .balance(@click='fullAmount') Balance: 270.588 WAX
    //- el-input(placeholder='0')
    //- .label Memo
    //- el-input(placeholder='Message')
    el-form-item.mt-1(v-if="addressValid")
        span.dialog-footer.mb-4
          el-button(type='primary' @click="submit" :disabled="!form.amount || !addressValid" :loading="loading").w-100
            | Transfer {{ token.symbol }} to {{ peg.network }}
    //- AlcorButton.done Transfer
</template>

<script>
import { captureException } from '@sentry/browser'
import { mapState } from 'vuex'
import AlcorButton from '@/components/AlcorButton.vue'
import PEGS from '~/core/ibc/pegs'

import config from '~/config'
// import TokenImage from '~/components/elements/TokenImage'

export default {
  name: 'DepositPopup',
  components: {
    AlcorButton
  },
  // props: {
  //   token: {
  //     type: Object,
  //     default: () => {
  //       return {
  //         precision: 4,
  //         symbol: 'EOS',
  //         contract: 'eosio.token'
  //       }
  //     }
  //   }
  // },
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
      token: {
        precision: 4,
        symbol: 'EOS',
        contract: 'eosio.token'
      },
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
      // prettier-ignore
      return `${this.token.symbol}@${this.token.contract}` in
        PEGS[this.network.name]
        ? new PEGS[this.network.name][`${this.token.symbol}@${this.token.contract}`](this.$store)
        : {}
    },

    networks() {
      return Object.values(config.networks)
    },

    chains() {
      return ['eos', 'bos', 'telos', 'wax'].filter(
        (c) => c != this.network.name
      )
    },

    tokenBalance() {
      if (!this.user || !this.user.balances || !this.token.symbol)
        return '0.0000'

      const balance = this.user.balances.filter((b) => {
        return (
          b.currency === this.token.symbol && b.contract === this.token.contract
        )
      })[0]

      if (balance) return `${balance.amount} ${balance.currency}`
      else
        return Number(0).toFixed(this.token.precision) + ` ${this.token.name}`
    },

    ibcMinAccept() {
      const accept = this.ibcAccepts.filter((t) => {
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
      ).toFixed(this.token.precision)
    },
    setChain(name) {
      this.chain = config.networks[name]
      this.form.address = ''
      this.$refs.form.resetFields()
    },

    amountChange() {
      this.form.amount = (parseFloat(this.form.amount) || 0).toFixed(
        this.token.precision
      )
    },

    async open() {
      if (!(await this.$store.dispatch('chain/asyncLogin'))) return
      this.visible = true
    },

    async submit() {
      try {
        const r = await this.peg.withdraw(this.form.amount, this.form.address)

        this.visible = false

        this.$alert(
          `<a href="${this.network.monitor}/tx/${r.transaction_id}" target="_blank">Transaction id</a>`,
          'Transaction complete!',
          {
            dangerouslyUseHTMLString: true,
            confirmButtonText: 'OK',
            callback: (action) => {
              this.$notify({ title: 'Withdraw in process', type: 'success' })
            }
          }
        )

        //this.$notify({ title: 'Place order', message: r.processed.action_traces[0].inline_traces[1].console, type: 'success' })
      } catch (e) {
        captureException(e)
        this.$notify({
          title: 'Withdraw error',
          message: e.message,
          type: 'error'
        })
        console.log(e)
      }
    }
  }
}
</script>

<style scoped lang="scss">
.title-container {
  display: flex;
  align-items: center;
  .text {
    font-weight: 500;
    padding-left: 8px;
  }
}
.main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.done {
  width: 100%;
  color: var(--main-green);
  padding: 10px;
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
