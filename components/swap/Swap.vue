<template lang="pug">
.row.mt-4
  .col
    .row
      .col
        .d-flex.mb-1
          small.text-muted Pay
          small.text-mutted.small.ml-auto {{ inputBalance }}
            i.el-icon-wallet.ml-1

        SelectToken(v-model="inputAmount" :tokens="tokens0" :token="0" @change="tokenChanged(0)")

    .row.mt-3
      .col.text-center
        i.el-icon-bottom.lead.pointer(@click="toggleInputs")
    .row.mt-1
      .col
        .d-flex.mb-1
          small.text-muted Estimated Receive
          small.text-mutted.small.ml-auto {{ outputBalance }}
            i.el-icon-wallet.ml-1

        SelectToken(v-model="outputAmount" :tokens="tokens1" readonly :token="1" @change="tokenChanged(1)")

    .row.mt-4
      .col(v-if="(input && inputAmount) && (output && outputAmount)")
        el-button(type="primary" @click="submit" v-loading="loading").w-100 Swap {{ input.symbol }} to {{ output.symbol }}
      .col(v-else)
        el-button(type="primary" disabled).w-100 Select amounts

    .row.mt-3.swap-bottom
      .col-6
        small Minimum Received
        small Rate
        small Price Impact
        small Slippage
        small Liquidity Source Fee

      .col-6.text-right
        .small {{ minOutput }}
        .small {{ price }}

        .small(v-if="priceImpact >= 5").text-danger.font-weight-bold {{ priceImpact}}%
        .small(v-else-if="priceImpact >= 2").text-warning.font-weight-bold {{ priceImpact}}%
        .small(v-else-if="priceImpact < 2").text-success.font-weight-bold {{ priceImpact}}%
        .small(v-else).font-weight-bold {{ priceImpact}} %

        .small 3%
        .small {{ fee }}%
</template>

<script>
import { asset, symbol, number_to_asset } from 'eos-common'
import { mapState, mapGetters } from 'vuex'
import { get_amount_out, get_amount_in } from '~/utils/pools'

import SelectToken from '~/components/swap/SelectToken.vue'

export default {
  components: {
    SelectToken
  },

  data() {
    return {
      loading: false,

      inputAmount: 0.0,
      outputAmount: 0.0,
      minOutput: '0.0000'
    }
  },

  computed: {
    ...mapState(['network', 'user']),
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

    price() {
      if (!(parseFloat(this.inputAmount) && parseFloat(this.outputAmount))) return '0.0000'

      const rate = (parseFloat(this.outputAmount) / parseFloat(this.inputAmount)).toFixed(4)

      return `${this.input.symbol} = ${rate} ${this.output.symbol}`
    },

    fee() {
      return this.pair ? this.pair.fee / 1000 : 0.3
    },

    priceImpact() {
      if (!(parseFloat(this.inputAmount) && parseFloat(this.outputAmount))) return 0.0

      return parseFloat(((parseFloat(this.outputAmount) * 0.97) / (parseFloat(this.poolTwo.quantity)) * 100).toFixed(2))
    }
  },

  watch: {
    inputAmount() {
      this.calcOutput()
    },

    pair() {
      this.calcOutput()
    }
  },

  mounted() {
    this.$store.dispatch('swap/init')
  },

  methods: {
    tokenChanged(token) {
      if (token == 0 && this.input && parseFloat(this.inputAmount)) this.calcOutput()
      if (token == 0 && this.input && parseFloat(this.outputAmount)) this.calcInput()
      if (token == 1 && this.input && parseFloat(this.inputAmount)) this.calcOutput()
      if (token == 1 && !this.input) this.calcInput()
    },

    calcOutput() {
      if (!this.pair || !this.output || !this.inputAmount) return

      const reserve_in = this.poolOne.quantity
      const reserve_out = this.poolTwo.quantity

      const amount_in = asset(parseFloat(this.inputAmount).toFixed(this.input.precision) + ' TEXT').amount
      const amount_out = get_amount_out(amount_in, reserve_in.amount, reserve_out.amount, this.pair.fee)

      const amount_min_output = amount_out.minus(amount_out.multiply(50).divide(1000))

      this.minOutput = asset(amount_min_output, symbol(this.output.symbol, this.output.precision)).to_string()
      this.outputAmount = parseFloat(asset(amount_out, reserve_out.symbol).to_string()).toFixed(this.output.precision)
    },

    calcInput() {
      if (!this.pair || !this.output || !this.outputAmount) return

      const reserve_in = this.poolOne.quantity
      const reserve_out = this.poolTwo.quantity

      let amount_out = asset(parseFloat(this.outputAmount).toFixed(this.output.precision) + ' TEXT').amount
      if (amount_out > reserve_out.amount) {
        amount_out = reserve_out.amount.minus(1)
        this.outputAmount = number_to_asset(amount_out, reserve_out.symbol).to_string()
      }

      const amount_in = get_amount_in(amount_out, reserve_in.amount, reserve_out.amount, this.pair.fee)
      const amount_min_input = amount_in.minus(amount_out.multiply(30).divide(1000))

      this.inputAmount = parseFloat(asset(amount_in, reserve_in.symbol).to_string()).toFixed(this.input.precision)
      this.minOutput = asset(amount_min_input, symbol(this.output.symbol, this.output.precision)).to_string()
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

    async submit() {
      if (!this.inputAmount || !this.outputAmount) return

      const authorization = [this.user.authorization]

      const actions = [
        {
          account: this.input.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: this.network.pools.contract,
            quantity: parseFloat(this.inputAmount).toFixed(this.input.precision) + ' ' + this.input.symbol,
            memo: `${this.minOutput}@${this.output.contract}`
          }
        }
      ]

      this.loading = true

      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
        this.$store.dispatch('swap/updatePair', this.pair.id)
        this.$store.dispatch('loadUserBalances')

        this.inputAmount = Number(0).toFixed(this.input.precision)
        this.outputAmount = Number(0).toFixed(this.output.precision)

        this.$notify({ title: 'Swap', message: 'Success', type: 'success' })
      } catch (e) {
        this.$notify({ title: 'Swap error', message: e, type: 'error' })
      } finally {
        this.loading = false
      }
    }
  },

  head() {
    return {
      title: 'Alcor Swap | Trustless tokens swaps',

      meta: [
        { hid: 'description', name: 'description', content: 'Atomic swap of any token amount using swap.defi(Defibox) pools.' }
      ]
    }
  }
}
</script>

<style lang="scss">
small,.small {
  display: block;
}
</style>
