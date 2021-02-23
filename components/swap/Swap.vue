<template lang="pug">
.row.mt-4
  .col
    .row
      .col
        .d-flex.mb-1
          small.text-muted Pay
          small.text-mutted.small.ml-auto {{ inputBalance }}
            i.el-icon-wallet.ml-1

        SelectToken(v-model="inputAmount" :token="0")

    .row.mt-3
      .col.text-center
        i.el-icon-bottom.lead.pointer(@click="toggleInputs")
    .row
      .col
        .d-flex.mb-1
          small.text-muted Estimated Receive
          small.text-mutted.small.ml-auto {{ outputBalance }}
            i.el-icon-wallet.ml-1

        SelectToken(v-model="outputAmount" readonly :token="1" @change="calcOutput")

    .row.mt-4
      .col(v-if="inputAmount && outputAmount")
        el-button(type="primary" @click="submit" v-loading="loading").w-100 Swap {{ input.symbol }} to {{ output.symbol }}
      .col(v-else)
        el-button(type="primary" disabled).w-100 Select amounts

    .row.mt-3(v-if="parseFloat(inputAmount) && parseFloat(outputAmount)").swap-info
      .col-6
        small Minimum Received
        small Rate
        small Price Impact
        small Slippage
        small Liquidity Source Fee

      .col-6.text-right
        b.small {{ minOutput }}
        b.small 1 {{ input.symbol }} = {{ rate }} {{ output.symbol }}

        b.small(v-if="priceImpact >= 5").text-danger {{ priceImpact}}%
        b.small(v-else-if="priceImpact >= 3").text-warning {{ priceImpact}}%
        b.small(v-else-if="priceImpact < 1").text-success {{ priceImpact}}%
        b.small(v-else) {{ priceImpact}} %

        b.small 3%
        b.small {{ pair.fee / 1000 }}%
</template>

<script>
import { asset, symbol } from 'eos-common'
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
      minOutput: ''
    }
  },

  computed: {
    ...mapState(['network', 'user']),
    ...mapState('swap', ['input', 'output']),
    ...mapGetters({
      pair: 'swap/current',
      inputBalance: 'swap/inputBalance',
      outputBalance: 'swap/outputBalance',
      poolOne: 'swap/poolOne',
      poolTwo: 'swap/poolTwo',
      isReverted: 'swap/isReverted'
    }),

    rate() {
      //if (!this.input || !this.output) return

      return (parseFloat(this.outputAmount) / parseFloat(this.inputAmount)).toFixed(4)
    },

    priceImpact() {
      //price impact on buying = (Yamount*0.97) / current Yamount in pool
      return parseFloat(((parseFloat(this.outputAmount) * 0.97) / (parseFloat(this.poolTwo.quantity)) * 100).toFixed(2))
    }
  },

  watch: {
    inputAmount() {
      this.calcOutput()
    }
  },

  mounted() {
    this.$store.dispatch('swap/init')
  },

  methods: {
    calcOutput() {
      if (!this.pair || !this.output || !this.inputAmount) return

      const reserve_in = this.poolOne.quantity
      const reserve_out = this.poolTwo.quantity

      const amount_in = asset(parseFloat(this.inputAmount).toFixed(this.input.precision) + ' TEXT').amount
      const amount_out = get_amount_out(amount_in, reserve_in.amount, reserve_out.amount, this.pair.fee)

      const amount_min_output = amount_out.minus(amount_out.multiply(30).divide(1000))

      this.minOutput = asset(amount_min_output, symbol(this.output.symbol, this.output.precision)).to_string()
      this.outputAmount = parseFloat(asset(amount_out, reserve_out.symbol).to_string()).toFixed(this.output.precision)
    },

    calcInput() {
      if (!this.pair || !this.output || !this.inputAmount) return

      const reserve_in = this.poolOne.quantity
      const reserve_out = this.poolTwo.quantity

      const amount_out = asset(parseFloat(this.outputAmount).toFixed(this.output.precision) + ' TEXT').amount
      const amount_in = get_amount_in(amount_out, reserve_in.amount, reserve_out.amount, this.pair.fee)

      const amount_min_input = amount_in.minus(amount_out.multiply(30).divide(1000))

      this.inputAmount = parseFloat(asset(amount_in, reserve_in.symbol).to_string()).toFixed(this.input.precision)
      this.minOutput = asset(amount_min_input, symbol(this.output.symbol, this.output.precision)).to_string()
    },

    toggleInputs() {
      this.$store.dispatch('swap/toggleInputs')

      if (!this.output) {
        return
        // TODO
        //const i = Object.assign({}, this.input)

        //this.$store.commit('swap/setOutput', i)
        //return
      }

      if (this.isReverted) {
        console.log('reverted')
        this.outputAmount = this.inputAmount
        this.calcInput()
      } else {
        console.log('not reverted')
        this.inputAmount = this.outputAmount
        this.calcOutput()
      }

      //console.log('input', this.input)
      //if (this.input == this.pair)


      //this.inputAmount = oa
      //this.outputAmount = ia

      //this.calcOutput()
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
        this.$notify({ title: 'Swap', message: 'Success', type: 'success' })
        this.inputAmount = 0.0
        this.outputAmount = 0.0
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

