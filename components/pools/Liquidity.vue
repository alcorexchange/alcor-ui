<template lang="pug">
div
  el-button(size="medium" @click="open" icon="el-icon-money" type="primary") Provide liquidity

  el-dialog(title="Create new order", :visible.sync="visible" width="50%")
    .row
      .col
        .text.item(v-if="current.pool1")
          .row.mb-3.mt-2
            .col-6.bordered
              .row
                .col-lg-2
                  TokenImage(:src="$tokenLogo(current.pool1.quantity.symbol.code().to_string(), current.pool1.contract)" height="50").ml-2
                .col-lg-10
                  .lead {{ current.pool1.quantity.symbol.code().to_string() }}@{{ current.pool1.contract }}
                  b Pool size: {{ current.pool1.quantity }}

              hr

              el-input(type="number" v-model="amount1" clearable @change="amountChange").mt-2
                span(slot="suffix").mr-1 {{ poolOne.quantity.symbol.code().to_string() }}

              //.lead {{ order.sell.quantity }}@
                a(:href="monitorAccount(order.sell.contract)" target="_blank") {{ order.sell.contract }}
            .col-6
              .row
                .col-lg-2
                  TokenImage(:src="$tokenLogo(poolTwo.quantity.symbol.code().to_string(), poolTwo.contract)" height="50").ml-2
                .col-lg-10
                  .lead {{ poolTwo.quantity.symbol.code().to_string() }}@{{ poolTwo.contract }}
                  b Pool size: {{ poolTwo.quantity }}

              hr

              el-input(type="number" v-model="amount2" clearable @change="amountChange").mt-2
                span(slot="suffix").mr-1 {{ poolTwo.quantity.symbol.code().to_string() }}
          .row.mb-3(v-if="current.pool1")
            .col
              .row
                .col
                  .row
                    .col
                      .lead Pool price: {{ poolPrice.toFixed(5) }}
                        |  {{ current.pool1.quantity.symbol.code().to_string() }}

                  .row
                    .col
                      .lead Pool token supply: {{ current.supply }}

                  .row
                    .col
                      .lead Estimated token receive: {{ tokenReceive }}
          .row
            .col
              PleaseLoginButton
                el-button(type="primary" @click="provide" :loading="loading").w-100 Provide

</template>

<script>
import { asset, number_to_asset } from 'eos-common'
import { mapGetters, mapState } from 'vuex'

import PleaseLoginButton from '~/components/elements/PleaseLoginButton'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage,
    PleaseLoginButton
  },

  props: {
    current: {
      type: Object,
      default: () => {}
    }
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
    ...mapGetters('api', ['rpc']),
    ...mapState(['network']),

    tokenReceive() {
      let amount1 = asset(this.amount1 + ' TEST').amount

      const fee = amount1.multiply(this.current.fee).plus(9999).divide(10000) // вроде вот этот варик округляет но как раз в нужную сторону!! ))
      amount1 = amount1.minus(fee)
      amount1 = amount1.multiply(this.current.supply.amount).divide(this.current.pool1.quantity.amount)

      return asset(amount1, this.current.supply.symbol).to_string()
    },

    poolOne() {
      return this.current.pool1
    },

    poolTwo() {
      return this.current.pool2
    },

    poolPrice() {
      return this.current.pool2.quantity.amount / this.current.pool1.quantity.amount
    }
  },

  watch: {
    amount1() {
      this.amount2 = Math.abs(this.amount1 * this.poolPrice).toFixed(this.current.pool2.quantity.symbol.precision())
    },

    amount2() {
      //this.calcReceive(this.amount2)
    }
  },

  methods: {
    async open() {
      if (!await this.$store.dispatch('chain/asyncLogin')) return

      this.visible = true
    },

    amountChange() {
      this.amount1 = this.toFixed(this.amount1, this.current.pool1.quantity.symbol.precision())
      this.amount2 = this.toFixed(this.amount2, this.current.pool2.quantity.symbol.precision())
    },

    async provide() {
      const authorization = [{ actor: this.user.name, permission: 'active' }]

      const amount1 = asset(`${this.amount1} ${this.current.pool1.quantity.symbol.code().to_string()}`).to_string()
      const amount2 = asset(`${this.amount2} ${this.current.pool2.quantity.symbol.code().to_string()}`).to_string()

      const actions = [
        {
          account: this.network.pools.contract,
          name: 'openext',
          authorization,
          data: {
            user: this.user.name,
            payer: this.user.name,
            ext_symbol: { contract: this.current.pool1.contract, sym: this.poolOne.quantity.symbol.toString() }
          }
        }, {
          account: this.network.pools.contract,
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
            to: this.network.pools.contract,
            quantity: amount1,
            memo: ''
          }
        }, {
          account: this.current.pool2.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: this.network.pools.contract,
            quantity: amount2,
            memo: ''
          }
        }, {
          account: this.network.pools.contract,
          name: 'addliquidity',
          authorization,
          data: {
            user: this.user.name,
            to_buy: this.tokenReceive,
            max_ext_asset1: { contract: this.current.pool1.contract, quantity: amount1 },
            max_ext_asset2: { contract: this.current.pool2.contract, quantity: amount2 }
          }
        }]

      this.loading = true
      try {
        const r = await this.$store.dispatch('chain/sendTransaction', actions)
        this.$emit('update')
        //this.visible = false
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
.bordered {
  border-right: 1px solid;
}
</style>
