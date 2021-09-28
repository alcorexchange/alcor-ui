<template lang="pug">
.row.mt-4
  .col.swap-pools
    .row
      .col
        .d-flex.mb-1.select-label
          small.text-muted Sell

          el-button(type="text" size="mini" @click="inputAmount = parseFloat(inputBalance)").ml-auto {{ inputBalance }}
            i.el-icon-wallet.ml-1

        SelectToken(v-model="inputAmount" :tokens="tokens0" :token="0" @change="tokenChanged(0)")
          template(slot="end")
            .pair(@click="$router.push('/swap/create')").text-muted
              i.el-icon-plus.mr-2
              span Create pool

    .row.mt-3
      .col.text-center
        i.el-icon-bottom.lead.pointer(@click="toggleInputs")
    .row.mt-1
      .col
        .d-flex.mb-1.select-label.align-items-center
          small.text-muted Buy (Estimated)
          .swap-setting.ml-1
            el-dropdown(trigger="click")
              i.el-icon-setting
              el-dropdown-menu.dropdown(slot="dropdown")
                .section
                  .section-label Transaction Setting
                  label Slippage Tolerance %
                  .section-content
                    AlcorButton(@click="resetSlippageTolerance" round compact) Auto
                    .section-input
                      el-input(placeholder="Slippage Tolerance %" size="small" v-model="slippageTolerance")
                        //- template(#prepend) %
          small.text-mutted.small.ml-auto.with-padding {{ outputBalance }}
            i.el-icon-wallet.ml-1

        SelectToken(v-model="outputAmount" :tokens="tokens1" readonly :token="1" @change="tokenChanged(1)")
          template(slot="end")
            .pair(@click="$router.push('/swap/create')").text-muted
              i.el-icon-plus.mr-2
              span Create pool

    //.row.mt-4(v-if="output && ibcChain")
      .col
        el-form(:model="ibcForm" :rules="rules" ref="form")
          el-form-item.mb-2
            el-switch(v-model="ibcForm.transfer" active-text="Swap & Transfer")

          .multi-input-wrapper(v-if="ibcForm.transfer").mt-4
            el-form-item(prop="address").mb-0
              el-input(v-model="ibcForm.address" clearable :placeholder="`Recipient's ${output.symbol} Address`")

    .row.mt-4
      .col
        PleaseLoginButton
          div(v-loading="loading").confirm-button
            .div(v-if="(ibcForm.transfer && (!ibcForm.valid || !ibcForm.address))")
              el-button(type="primary" disabled).w-100 Invalid {{ this.ibcChain.toUpperCase() }} Account
            //.div(v-else-if="(input && inputAmount) && inputAmount > parseFloat(inputBalance)")
            //  el-button(type="primary" disabled).w-100 Insufficient Funds
            .div(v-else-if="(input && inputAmount) && (output && outputAmount)")
              el-button(type="primary" @click="submit").w-100 Swap {{ input.symbol }} to {{ output.symbol }}
            .div(v-else)
              el-button(type="primary" disabled).w-100 Select amounts

    .row.mt-3
      .col
        .d-flex.justify-content-between
          small Minimum Received
          .small {{ minOutput }}
        SSpacer
        .d-flex.justify-content-between
          small Rate
          .small {{ price }}
            .el-icon-refresh(@click="priceReverse = !priceReverse").ml-1.pointer
        SSpacer
        .d-flex.justify-content-between
          small Price Impact
          .small(v-if="priceImpact >= 5").text-danger.font-weight-bold {{ priceImpact}}%
          .small(v-else-if="priceImpact >= 2").text-warning.font-weight-bold {{ priceImpact}}%
          .small(v-else-if="priceImpact < 2").text-success.font-weight-bold {{ priceImpact}}%
          .small(v-else).font-weight-bold {{ priceImpact}} %
        SSpacer
        .d-flex.justify-content-between
          small Slippage
          .small {{ slippageTolerance }}%
        SSpacer
        .d-flex.justify-content-between
          small Liquidity Source Fee
          .small {{ fee }}%

</template>

<script>
import BigInt from 'big-integer'
import { asset, symbol } from 'eos-common'
import { mapState, mapGetters } from 'vuex'
import { get_amount_out, get_amount_in } from '~/utils/pools'
import { isAccountExists } from '~/utils/account'

import config from '~/config'

import PleaseLoginButton from '~/components/elements/PleaseLoginButton'
import SelectToken from '~/components/swap/SelectToken.vue'
import SSpacer from '~/components/SSpacer.vue'
import AlcorButton from '~/components/AlcorButton.vue'

export default {
  components: {
    SelectToken,
    PleaseLoginButton,
    SSpacer,
    AlcorButton
  },

  data() {
    return {
      loading: false,

      priceReverse: false,

      ibcForm: {
        transfer: false,
        address: '',
        valid: ''
      },

      inputAmount: 0.0,
      outputAmount: 0.0,
      minOutput: '0.0000',

      rules: {
        address: {
          trigger: 'blur',
          validator: async (rule, value, callback) => {
            if (value == '') return callback()
            this.loading = true
            const exists = await isAccountExists(
              value,
              config.networks[this.ibcChain]
            )
            this.loading = false

            if (exists) {
              this.ibcForm.valid = true
              callback()
            } else {
              this.ibcForm.valid = false
              callback(new Error('Account does not exist!'))
            }
          }
        }
      }
    }
  },

  computed: {
    ...mapState(['network', 'user', 'ibcTokens']),
    ...mapState('swap', ['input', 'output', 'pairs']),
    ...mapGetters({
      pair: 'swap/current',
      inputBalance: 'swap/inputBalance',
      outputBalance: 'swap/outputBalance',
      poolOne: 'swap/poolOne',
      poolTwo: 'swap/poolTwo',
      isReverted: 'swap/isReverted',
      tokens0: 'swap/tokens0',
      tokens1: 'swap/tokens1'
    }),

    ibcChain() {
      if (!this.output) return ''

      const { contract, symbol } = this.output

      if (this.network.name == 'eos') {
        if (contract == 'bosibc.io' && symbol == 'WAX') return 'wax'
      }

      if (this.network.name == 'wax') {
        if (contract == 'bosibc.io' && symbol == 'EOS') return 'eos'
      }

      return ''
    },

    price() {
      if (!(parseFloat(this.inputAmount) && parseFloat(this.outputAmount)))
        return '0.0000'

      if (this.priceReverse) {
        const rate = (
          parseFloat(this.inputAmount) / parseFloat(this.outputAmount)
        ).toFixed(4)

        return `${rate} ${this.input.symbol} per ${this.output.symbol}`
      } else {
        const rate = (
          parseFloat(this.outputAmount) / parseFloat(this.inputAmount)
        ).toFixed(4)

        return `${rate} ${this.output.symbol} per ${this.input.symbol}`
      }
    },

    fee() {
      return this.pair ? (this.pair.fee * 100) / 10000 : 0.3
    },

    priceImpact() {
      if (!(parseFloat(this.inputAmount) && parseFloat(this.outputAmount)))
        return 0.0

      return parseFloat(
        (
          ((parseFloat(this.outputAmount) * 0.97) /
            parseFloat(this.poolTwo.quantity)) *
          100
        ).toFixed(2)
      )
    },

    slippageTolerance: {
      get() {
        return this.$store.state.swap.slippage
      },
      set(value) {
        this.$store.commit('swap/setSlippage', value)
      }
    }
  },

  watch: {
    output() {
      this.ibcForm.transfer = false
    },

    inputAmount() {
      this.calcOutput()
    },

    pair() {
      this.calcOutput()
    }
  },

  methods: {
    resetSlippageTolerance() {
      this.slippageTolerance = 3
    },
    tokenChanged(token) {
      this.ibcForm.transfer = false

      if (token == 0 && this.input && parseFloat(this.inputAmount))
        this.calcOutput()
      if (token == 0 && this.input && parseFloat(this.outputAmount))
        this.calcInput()
      if (token == 1 && this.input && parseFloat(this.inputAmount))
        this.calcOutput()
      if (token == 1 && !this.input) this.calcInput()
    },

    calcOutput() {
      if (
        !this.pair ||
        !this.output ||
        !this.inputAmount ||
        this.output.precision == undefined
      )
        return

      const reserve_in = this.poolOne.quantity
      const reserve_out = this.poolTwo.quantity

      const amount_in = asset(
        parseFloat(this.inputAmount).toFixed(this.input.precision) + ' TEXT'
      ).amount

      const amount_out = BigInt.min(
        get_amount_out(
          amount_in,
          reserve_in.amount,
          reserve_out.amount,
          this.pair.fee
        ),
        reserve_out.amount
      )

      const fee = Math.max(this.slippageTolerance * 10, 1)
      const amount_min_output = amount_out.minus(
        amount_out.multiply(fee).divide(1000)
      )

      this.minOutput = asset(
        amount_min_output,
        symbol(this.output.symbol, this.output.precision)
      ).to_string()
      this.outputAmount = parseFloat(
        asset(amount_out, reserve_out.symbol).to_string()
      ).toFixed(this.output.precision)
    },

    calcInput() {
      if (!this.pair || !this.output || !this.outputAmount) return

      const reserve_in = this.poolOne.quantity
      const reserve_out = this.poolTwo.quantity

      let amount_out = asset(
        parseFloat(this.outputAmount).toFixed(this.output.precision) + ' TEXT'
      ).amount
      if (amount_out > reserve_out.amount) {
        amount_out = reserve_out.amount.minus(1)
        this.outputAmount = asset(amount_out, reserve_out.symbol).to_string()
      }

      const amount_in = BigInt.min(
        get_amount_in(
          amount_out,
          reserve_in.amount,
          reserve_out.amount,
          this.pair.fee
        ),
        reserve_in.amount
      )

      const fee = Math.max(this.slippageTolerance * 10, 1)
      const amount_min_input = amount_in.minus(
        amount_out.multiply(fee).divide(1000)
      )

      this.inputAmount = parseFloat(
        asset(amount_in, reserve_in.symbol).to_string()
      ).toFixed(this.input.precision)
      this.minOutput = asset(
        amount_min_input,
        symbol(this.output.symbol, this.output.precision)
      ).to_string()
    },

    toggleInputs() {
      if (!this.output) {
        const i = Object.assign({}, this.input)

        this.$store.commit('swap/setOutput', i)
        this.$store.commit('swap/setInput', null)

        const ia = this.inputAmount

        this.inputAmount = 0.0
        this.outputAmount = parseFloat(ia || 0).toFixed(this.output.precision)
        return
      }

      if (!this.input) {
        const o = Object.assign({}, this.output)

        this.$store.commit('swap/setInput', o)
        this.$store.commit('swap/setOutput', null)

        const oa = this.outputAmount

        this.outputAmount = 0.0
        this.inputAmount = parseFloat(oa || 0).toFixed(this.input.precision)
        return
      }

      this.$store.dispatch('swap/toggleInputs')

      if (this.isReverted) {
        this.outputAmount = this.inputAmount
        this.calcInput()
      } else {
        this.inputAmount = this.outputAmount
        this.calcOutput()
      }
    },

    async processExchange() {
      let memo = `${this.minOutput}@${this.output.contract}`

      if (this.ibcChain && this.ibcForm.transfer) {
        memo += `|bosibc.io|hub.io@bos >> ${this.ibcForm.address}@${this.ibcChain} alcor.exchange (IBC swap)`
      }

      const authorization = [this.user.authorization]

      const actions = [
        {
          account: this.input.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: this.network.pools.contract,
            quantity:
              parseFloat(this.inputAmount).toFixed(this.input.precision) +
              ' ' +
              this.input.symbol,
            memo
          }
        }
      ]

      this.loading = true

      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
        this.$store.dispatch('swap/updatePair', this.pair.id)
        setTimeout(() => this.$store.dispatch('loadUserBalances'), 1000)

        this.inputAmount = Number(0).toFixed(this.input.precision)
        this.outputAmount = Number(0).toFixed(this.output.precision)

        this.$notify({ title: 'Swap', message: 'Success', type: 'success' })
      } catch (e) {
        this.$notify({
          title: 'Swap error',
          message: 'message' in e ? e.message : e,
          type: 'error'
        })
      } finally {
        this.loading = false
      }
    },

    submit() {
      if (!this.inputAmount || !this.outputAmount) return

      if (parseFloat(this.priceImpact) > 10) {
        this.$confirm(
          'You are significantly overpaying for the exchange. Try the amount less or do you want to continue?',
          'Impact on the price above 10%!',
          {
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }
        )
          .then(() => {
            this.processExchange()
          })
          .catch(() => {
            this.$notify({
              type: 'info',
              title: 'Swap',
              message: 'Swap canceled'
            })
          })
      } else {
        this.processExchange()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.confirm-button button {
  background: rgba(46, 46, 49, 0.6);
  padding: 20px;
  border: none;
  border-radius: var(--radius-2);
  &:hover {
    background: rgba(46, 46, 49, 0.6);
  }
}
.theme-dark .confirm-button button {
  background: #161617;
  &:hover {
    background: #161617;
  }
}
.dropdown {
  padding: 14px;
  // .el-input-group__append {
  //   padding: 0 !important;
  // }
}
.swap-setting {
  display: flex;
  justify-content: flex-end;
  .el-icon-setting {
    font-size: 1rem;
  }
}
.section-label {
  font-weight: bold;
  margin-bottom: 8px;
}
.section-content {
  display: flex;
  align-items: flex-end;
  .alcor-button {
    margin-right: 4px;
  }
}
label {
  margin-bottom: 4px;
}
.section-input {
  width: 200px;
}
</style>
<style lang="scss">
.swap-pools {
  .el-form-item__error {
    top: -32px;
    left: -5px;
  }
}
</style>
