<template lang="pug">
div
  .overflowbox.mt-2.p-3
    .row
      .col
        small From
          b.ml-1 ({{ inputBalance }})

        .row
          .col-8
            el-input(type="number" clearable placeholder="0.0" v-model="inputAmount" @change="fixedInput")
              span(slot="suffix" v-if="input").mr-1 {{ input.symbol }}

          .col-4
            SelectToken(:token="0")
    .row.mt-4
      .col.text-center
        i.el-icon-bottom.lead.pointer(@click="toggleInputs")

    .row
      .col
        small To

        .row
          .col-8
            el-input(type="number" clearable placeholder="0.0" v-model="outputAmount")
              span(slot="suffix" v-if="output").mr-1 {{ output.symbol }}
          .col-4
            SelectToken(:token="1")

  .row.mt-2
    .col
      el-button(type="primary" @click="submit" v-loading="loading").w-100 Swap
</template>

<script>
import { asset } from 'eos-common'
import { mapState, mapGetters } from 'vuex'

import TokenImage from '~/components/elements/TokenImage'
import SelectToken from '~/components/swap/SelectToken.vue'

export default {
  components: {
    SelectToken,
    TokenImage
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
      pair: 'swap/pair',
      inputBalance: 'swap/inputBalance'
    }),

    filteredPools() {
      return []
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
      const fee = 3

      if (!this.pair || !this.output || !this.inputAmount) return

      const [reserve_in, reserve_out] = this.input.contract == this.pair.token0.contract &&
        this.input.symbol == this.pair.reserve0.symbol.code().to_string()
        ? [this.pair.reserve0, this.pair.reserve1] : [this.pair.reserve1, this.pair.reserve0]

      const amount_in = asset(parseFloat(this.inputAmount).toFixed(this.input.precision) + ' TEXT')
      const amount_in_with_fee = amount_in.amount.multiply(1000 - fee)
      const numerator = amount_in_with_fee.multiply(reserve_out.amount)
      const denominator = reserve_in.amount.multiply(1000).add(amount_in_with_fee)
      const amount_out = numerator.divide(denominator)

      this.minOutput = amount_out.minus(amount_out.multiply(3).divide(100))

      this.outputAmount = parseFloat(asset(amount_out, reserve_out.symbol).to_string()).toFixed(this.output.precision)
    },

    toggleInputs() {
      if (!this.output) return

      const i = Object.assign({}, this.input)
      const o = Object.assign({}, this.output)

      this.$store.commit('swap/setInput', o)
      this.$store.commit('swap/setOutput', i)

      this.calcOutput()
    },

    fixedInput() {
      this.inputAmount = parseFloat(this.inputAmount).toFixed(this.input.precision)
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
            to: 'swap.defi',
            quantity: parseFloat(this.inputAmount).toFixed(this.input.precision) + ' ' + this.input.symbol,
            memo: `swap,${this.minOutput},${this.pair.id}`
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
  }
}
</script>
