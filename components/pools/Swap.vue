<template lang="pug">
div
  .row
    .col
      .text.item(v-if="current")
        .row
          .col
            .p-2
              p Quick swap or make money on providing liquidity.
          .col
            .d-flex.justify-content-end
              .row
                .col-lg-6
                  Withdraw(@update="fetch").mr-3.mb-2
                .col-lg-6
                  Liquidity(:current="current" @update="fetch")

        .row.mb-3.mt-2
          .col-lg-5
            .row
              .col-lg-2
                TokenImage(:src="$tokenLogo(poolOne.quantity.symbol.code().to_string(), poolOne.contract)" height="50").ml-2
              .col-lg-10
                .lead {{ poolOne.quantity.symbol.code().to_string() }}@{{ poolOne.contract }}
                b Pool size: {{ poolOne.quantity }}

            hr

            .row.mt-4
              .col.border-right
                .text-center
                  .lead Input
                  p The amount that you give

                pre(v-if="input == 'pool1'") Balance: {{ baseBalance }}
                pre(v-else) Balance: {{ quoteBalance }}

                el-input(type="number" v-model="amount1" clearable @change="amountChange" @input="inputAmount")
                  span(slot="suffix").mr-1 {{ poolOne.quantity.symbol.code().to_string() }}

          .col-lg-2
            .row
              .col
                .d-flex.justify-content-center
                  img(src="~/assets/icons/swap.png" @click="swapInput" height="50").pointer.mt-1

            .row.d-none.d-lg-block
              .col.text-center
                a(href="https://github.com/EOSArgentina/evolutiondex" target="_blank")
                  img(src="~/assets/logos/evodex.png" height=70).evodexlogo

          .col-lg-5
            .d-flex
              .d-flex.ml-auto
                TokenImage(:src="$tokenLogo(poolTwo.quantity.symbol.code().to_string(), poolTwo.contract)" height="50")
                .ml-3
                  .lead {{ poolTwo.quantity.symbol.code().to_string() }}@{{ poolTwo.contract }}
                  b Pool size: {{ poolTwo.quantity }}

            hr

            .row.mt-4
              .col.border-left
                .text-center
                  .lead Output

                  p The amount that you will receive

                  .lead {{ amount2 }}  {{ poolTwo.quantity.symbol.code().to_string() }}

                  pre(v-if="input == 'pool2'") Balance: {{ baseBalance }}
                  pre(v-else) Balance: {{ quoteBalance }}

        .row.mb-3(v-if="current.pool1")
          .col
            .row
              .col
                pre
                  span Price for current amount: {{ price }} {{ poolOne.quantity.symbol.code().to_string() }}
                    | /{{ poolTwo.quantity.symbol.code().to_string() }}

                  //span
                    /el-button(size="small" type="text").float-right This asset can be withdrawn on the wallet page.
        .row
          .col
            PleaseLoginButton
              el-button(type="primary" @click="swap" :loading="loading").w-100 Swap

      .text.item(v-else)
        .row.mb-3
          .col-6.bordered
            .p-3
              .lead No pools yet
</template>

<script>
import { asset, number_to_asset } from 'eos-common'
import { mapGetters, mapState } from 'vuex'

import { computeForward, calcPrice } from '~/utils/pools'

import PleaseLoginButton from '~/components/elements/PleaseLoginButton'
import TokenImage from '~/components/elements/TokenImage'
import Liquidity from '~/components/pools/Liquidity'
import Withdraw from '~/components/pools/Withdraw'

export default {
  components: {
    TokenImage,
    PleaseLoginButton,
    Liquidity,
    Withdraw
  },

  data() {
    return {
      amount1: 0.0,
      amount2: 0.0,

      input: 'pool1',

      loading: false
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapGetters('pools', ['current', 'baseBalance', 'quoteBalance']),
    ...mapState(['network']),
    ...mapState('pools', ['pools']),

    baseToken() {
      return this.$store.state.network.baseToken
    },

    poolOne() {
      return this.current[this.input == 'pool1' ? 'pool1' : 'pool2']
    },

    poolTwo() {
      return this.current[this.input == 'pool1' ? 'pool2' : 'pool1']
    },

    poolPrice() {
      return (this.poolOne.quantity.amount / this.poolTwo.quantity.amount).toFixed(5)
    },

    price() {
      if (!this.current) return ''

      const price = calcPrice(
        this.inputToAsset(this.amount1, this.poolOne.quantity.symbol.precision()),
        this.inputToAsset(this.amount2, this.poolTwo.quantity.symbol.precision())
      )

      return price || calcPrice(this.poolOne.quantity, this.poolTwo.quantity).toFixed(8)
    }
  },

  watch: {
    amount1() {
      this.updateAmounts()
    },

    current() {
      //this.amount1 = 0.0
      this.amountChange()
    }
  },

  methods: {
    inputAmount() {
      //updateAmounts()
    },

    updateAmounts() {
      if (isNaN(this.amount1)) return

      let a = (parseFloat(this.amount1) || 0).toFixed(this.poolOne.quantity.symbol.precision())
      a = asset(a + ' ' + this.current.pool1.quantity.symbol.code().to_string()).amount

      const p1 = this.poolOne.quantity.amount
      const p2 = this.poolTwo.quantity.amount

      if (this.input == 'pool1') {
        const r = number_to_asset(0, this.poolTwo.quantity.symbol)
        r.set_amount(Math.abs(computeForward(a.multiply(-1), p2, p1.plus(a), this.current.fee)))
        this.amount2 = r.to_string().split(' ')[0]
      } else {
        const result = computeForward(
          a.multiply(-1),
          this.current.pool1.quantity.amount,
          this.current.pool2.quantity.amount + a,
          this.current.fee
        ).abs()

        const r = number_to_asset(0, this.current.pool1.quantity.symbol)
        r.set_amount(result)
        this.amount2 = r.to_string().split(' ')[0]
      }
    },

    amountChange() {
      if (!this.amount1) {
        this.amount1 = 0.0
      }

      this.amount1 = this.toFixed(this.amount1, this.poolOne.quantity.symbol.precision())
      this.amount2 = this.toFixed(this.amount2, this.poolTwo.quantity.symbol.precision())
    },

    clickPool(pool) {
      this.current = pool
    },

    async swap() {
      const authorization = [this.user.authorization]

      let amount1
      let amount2

      if (this.input == 'pool1') {
        amount1 = number_to_asset(parseFloat(this.amount1), this.current.pool1.quantity.symbol).to_string()
        amount2 = number_to_asset(parseFloat(this.amount2), this.current.pool2.quantity.symbol).to_string()
      } else {
        amount1 = number_to_asset(parseFloat(this.amount1), this.current.pool2.quantity.symbol).to_string()
        amount2 = number_to_asset(parseFloat(this.amount2), this.current.pool1.quantity.symbol).to_string()
      }

      const actions = [
        {
          account: this.input == 'pool1' ? this.current.pool1.contract : this.current.pool2.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: 'evolutiondex',
            quantity: amount1,
            memo: `exchange: ${this.current.supply.symbol.code().to_string()},${amount2},alcor.exchange/pools`
          }
        }
      ]

      this.loading = true
      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
        this.$store.dispatch('pools/updatePool')
        this.$notify({ title: 'Exchange', message: 'Success', type: 'success' })
      } catch (e) {
        this.$notify({ title: 'Place order', message: e, type: 'error' })
      } finally {
        this.fetch()
        this.loading = false
      }
    },

    swapInput() {
      this.input = this.input == 'pool1' ? 'pool2' : 'pool1'

      this.amountChange()
      this.updateAmounts()
    },

    fetch() {
      this.$store.dispatch('pools/fetchPools')
    }
  }
}
</script>

<style>
.evodexlogo {
  margin-top: 70px;
}
</style>
