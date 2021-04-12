<template lang="pug">
div
  el-button(size="medium" @click="open" icon="el-icon-money" type="primary") Provide liquidity

  el-dialog(title="Add liquidity", :visible.sync="visible" width="50%").pool-withdraw
    .row
      .col
        .text.item(v-if="current.pool1")
          p You can earn money on commissions from exchanges.
            |  Be sure to familiarize yourself with the principle of operation of liquidity pools.

          pre Liquidity provider fee: {{ current.fee / 100 }}%
          .row.mb-3.mt-2
            .col-6.bordered
              .row
                .col-lg-2
                  TokenImage(:src="$tokenLogo(current.pool1.quantity.symbol.code().to_string(), current.pool1.contract)" height="50").ml-2
                .col-lg-10
                  .lead {{ current.pool1.quantity.symbol.code().to_string() }}@{{ current.pool1.contract }}
                  b Pool size: {{ current.pool1.quantity }}

              hr

              pre Balance: {{ baseBalance }}
              el-input(type="number" v-model="amount1" clearable @input="amount1Input" @change="amountChange")
                span(slot="suffix").mr-1 {{ poolOne.quantity.symbol.code().to_string() }}

              //.lead {{ order.sell.quantity }}@
                a(:href="monitorAccount(order.sell.contract)" target="_blank") {{ order.sell.contract }}
            .col-6
              .row
                .col-lg-2
                  TokenImage(:src="$tokenLogo(poolTwo.quantity.symbol.code().to_string(), poolTwo.contract)" height="50").mr-2
                .col-lg-10
                  .lead {{ poolTwo.quantity.symbol.code().to_string() }}@{{ poolTwo.contract }}
                  b Pool size: {{ poolTwo.quantity }}

              hr

              pre Balance: {{ quoteBalance }}
              el-input(type="number" v-model="amount2" clearable @input="amount2Input" @change="amountChange")
                span(slot="suffix").mr-1 {{ poolTwo.quantity.symbol.code().to_string() }}
          .row.mb-3(v-if="current.pool1")
            .col
              .row
                .col
                  .row
                    .col
                      pre Pool price: {{ poolPrice }} {{ current.pool1.quantity.symbol.code().to_string() }}
                        | /{{ current.pool2.quantity.symbol.code().to_string() }}

                  .row
                    .col
                      pre Pool token supply: {{ current.supply }}

                  .row
                    .col
                      .big Liquidity token receive:
                        |  {{ tokenReceive | humanFloat(this.current.supply.symbol.precision(), this.current.supply.symbol.precision(), this.current.supply.symbol.precision()) }} {{ this.current.supply.symbol.code().to_string() }}
          .row
            .col
              PleaseLoginButton
                el-button(type="primary" @click="provide" :loading="loading").w-100 Provide

</template>

<script>
import { asset, number_to_asset } from 'eos-common'
import { mapGetters, mapState } from 'vuex'

import { computeForward, computeBackward, calcPrice } from '~/utils/pools'

import PleaseLoginButton from '~/components/elements/PleaseLoginButton'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage,
    PleaseLoginButton
  },

  data() {
    return {
      amount1: 0.0,
      amount2: 0.0,

      visible: false,

      pools: [],
      input: 'pool1',

      loading: false
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapState(['network']),
    ...mapGetters('pools', ['current', 'baseBalance', 'quoteBalance']),

    tokenReceive() {
      const amount1 = this.inputToAsset(this.amount1, this.poolOne.quantity.symbol.precision())

      const to_buy = computeBackward(
        amount1.amount,
        this.current.supply.amount,
        this.current.pool1.quantity.amount,
        this.current.fee
      )

      return to_buy
    },

    poolOne() {
      return this.current.pool1
    },

    poolTwo() {
      return this.current.pool2
    },

    poolPrice() {
      return calcPrice(this.current.pool1.quantity, this.current.pool2.quantity).toFixed(8)
    }
  },

  methods: {
    amount1Input(value) {
      let amount1 = (parseFloat(value) || 0).toFixed(this.current.pool1.quantity.symbol.precision())

      amount1 = asset(amount1 + ' ' + this.current.pool1.quantity.symbol.code().to_string()).amount

      const to_buy = computeBackward(
        amount1,
        this.current.supply.amount,
        this.current.pool1.quantity.amount,
        this.current.fee
      )

      const amount2 = number_to_asset(0, this.current.pool2.quantity.symbol)

      amount2.set_amount(
        computeForward(to_buy, this.current.pool2.quantity.amount, this.current.supply.amount, this.current.fee)
      )
      this.amount2 = amount2.to_string().split(' ')[0]
    },

    amount2Input(value) {
      let amount2 = (parseFloat(value) || 0).toFixed(this.current.pool2.quantity.symbol.precision())

      amount2 = asset(amount2 + ' ' + this.current.pool2.quantity.symbol.code().to_string()).amount

      const to_buy = computeBackward(
        amount2,
        this.current.supply.amount,
        this.current.pool2.quantity.amount,
        this.current.fee
      )

      const amount1 = number_to_asset(0, this.current.pool1.quantity.symbol)

      amount1.set_amount(
        computeForward(to_buy.multiply(-1), this.current.pool1.quantity.amount, this.current.supply.amount, this.current.fee).multiply(-1)
      )

      this.amount1 = amount1.to_string().split(' ')[0]
    },

    async open() {
      if (!await this.$store.dispatch('chain/asyncLogin')) return
      this.amountChange()
      this.visible = true
    },

    amountChange() {
      this.amount1 = (parseFloat(this.amount1) || 0).toFixed(this.current.pool1.quantity.symbol.precision())
      this.amount2 = (parseFloat(this.amount2) || 0).toFixed(this.current.pool2.quantity.symbol.precision())
    },

    async provide() {
      const authorization = [this.user.authorization]

      const amount1 = asset(`${this.amount1} ${this.current.pool1.quantity.symbol.code().to_string()}`).to_string()
      const amount2 = asset(`${this.amount2} ${this.current.pool2.quantity.symbol.code().to_string()}`).to_string()
      const to_buy = asset(this.tokenReceive, this.current.supply.symbol).to_string()

      const actions = [
        {
          account: 'evolutiondex',
          name: 'openext',
          authorization,
          data: {
            user: this.user.name,
            payer: this.user.name,
            ext_symbol: { contract: this.current.pool1.contract, sym: this.poolOne.quantity.symbol.toString() }
          }
        }, {
          account: 'evolutiondex',
          name: 'openext',
          authorization,
          data: {
            user: this.user.name,
            payer: this.user.name,
            ext_symbol: { contract: this.poolTwo.contract, sym: this.poolTwo.quantity.symbol.toString() }
          }
        }, {
          account: this.current.pool1.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: 'evolutiondex',
            quantity: amount1,
            memo: ''
          }
        }, {
          account: this.current.pool2.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: 'evolutiondex',
            quantity: amount2,
            memo: ''
          }
        }, {
          account: 'evolutiondex',
          name: 'addliquidity',
          authorization,
          data: {
            user: this.user.name,
            to_buy,
            max_asset1: amount1,
            max_asset2: amount2
          }
        }, {
          account: 'evolutiondex',
          name: 'closeext',
          authorization,
          data: {
            user: this.user.name,
            ext_symbol: { contract: this.current.pool1.contract, sym: this.poolOne.quantity.symbol.toString() },
            to: this.user.name,
            memo: ''
          }
        }, {
          account: 'evolutiondex',
          name: 'closeext',
          authorization,
          data: {
            user: this.user.name,
            ext_symbol: { contract: this.poolTwo.contract, sym: this.poolTwo.quantity.symbol.toString() },
            to: this.user.name,
            memo: ''
          }
        }
      ]

      this.loading = true
      try {
        const r = await this.$store.dispatch('chain/sendTransaction', actions)
        this.$emit('update')
        this.visible = false
        this.$notify({ title: 'Provide liquidity', message: 'Provided successful', type: 'success' })
        this.$store.dispatch('pools/updatePool')
        console.log(r)
      } catch (e) {
        console.log(e)
        this.$notify({ title: 'Place order', message: e, type: 'error' })
      } finally {
        this.loading = false
      }
    },

    swapInput() {
      this.input = this.input == 'pool1' ? 'pool2' : 'pool1'

      this.amountChange()
    }
  }
}
</script>

<style>
.pool-withdraw .el-dialog__body {
  padding-top: 0px;
}
</style>
