<template lang="pug">
div
  .row
    .col
      .text.item(v-if="current")
        .row
          .col
            .p-2
              p Quick swap or make money on provide liquidity.
          .col
            .d-flex.justify-content-end
              Withdraw(@update="fetch").mr-3
              Liquidity(:current="current" @update="fetch")
        //.row
          .col-lg-6.border-right
            .text-center
              .lead Input

              p The amount that you give
          .col-6
            .text-center
              .lead Output
              p.mt-2 The amount that you will receive

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

                el-input(type="number" v-model="amount1" clearable @change="amountChange")
                  span(slot="suffix").mr-1 {{ poolOne.quantity.symbol.code().to_string() }}

          .col-lg-2
            .row
              .col
                .d-flex.justify-content-center
                  h1.el-icon-refresh(@click="swapInput").pointer.mt-5.el-button--text

            .row
              .col.text-center.mt-4
                a(href="https://github.com/EOSArgentina/evolutiondex" target="_blank")
                  img(src="~/assets/logos/evodex.png" height=70)

          .col-lg-5
            .row
              .col-lg-2
                TokenImage(:src="$tokenLogo(poolTwo.quantity.symbol.code().to_string(), poolTwo.contract)" height="50").ml-2
              .col-lg-10
                .lead {{ poolTwo.quantity.symbol.code().to_string() }}@{{ poolTwo.contract }}
                b Pool size: {{ poolTwo.quantity }}

            hr

            .row.mt-4
              .col.border-left
                .text-center
                  .lead Output
                  p.mt-2 The amount that you will receive

                  .lead {{ amount2 }}  {{ current.pool2.quantity.symbol.code().to_string() }}

        .row.mb-3(v-if="current.pool1")
          .col
            .row
              .col
                pre Price for current amount: {{ price }}   {{ current.pool1.quantity.symbol.code().to_string() }}
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

import { computeForward, computeBackward } from '~/utils/pools'

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
      return (this.current.pool1.quantity.amount / this.current.pool2.quantity.amount).toFixed(5)
    },

    price() {
      const price = Math.abs(this.amount1 / this.amount2)
      return (price || this.current.pool1.quantity.amount / this.current.pool2.quantity.amount).toFixed(5)
    }
  },

  watch: {
    amount1() {
      this.updateAmounts()
    },

    current() {
      this.amount1 = 0.0
      this.amountChange()
    }
  },

  methods: {
    updateAmounts() {
      if (isNaN(this.amount1)) return

      const a = asset(`${this.amount1} ${this.poolOne.quantity.symbol.code().to_string()}`).amount

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
      const authorization = [{ actor: this.user.name, permission: 'active' }]

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
            to: this.network.pools.contract,
            quantity: amount1,
            memo: `exchange: ${this.current.supply.symbol.code().to_string()},${amount2},lol`
          }
        }
      ]

      this.loading = true
      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
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
</style>
