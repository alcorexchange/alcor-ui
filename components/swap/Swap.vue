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
          b.text-muted  (estimated)

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
import { asset, symbol } from 'eos-common'
import { mapState, mapGetters } from 'vuex'
import { get_amount_out } from '~/utils/pools'

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
      pair: 'swap/current',
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
      if (!this.pair || !this.output || !this.inputAmount) return

      const [reserve_in, reserve_out] = this.input.contract == this.pair.pool1.contract &&
        this.input.symbol == this.pair.pool1.quantity.symbol.code().to_string()
        ? [this.pair.pool1.quantity, this.pair.pool2.quantity] : [this.pair.pool2.quantity, this.pair.pool1.quantity]

      const amount_in = asset(parseFloat(this.inputAmount).toFixed(this.input.precision) + ' TEXT').amount
      const amount_out = get_amount_out(amount_in, reserve_in.amount, reserve_out.amount, this.pair.fee)

      // TODO Слипейдж
      //this.minOutput = amount_out.minus(amount_out.multiply(3).divide(100))
      //this.minOutput = amount_out.minus(amount_out.multiply(3).divide(100))
      this.minOutput = asset(amount_out, symbol(this.output.symbol, this.output.precision)) + `@${this.output.contract}`

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
            to: this.network.pools.contract,
            quantity: parseFloat(this.inputAmount).toFixed(this.input.precision) + ' ' + this.input.symbol,
            memo: `${this.minOutput}`
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
