<template lang="pug">
div
  el-button(size="medium" @click="open" icon="el-icon-wallet").ml-auto Withdraw liquidity

  el-dialog(title="Withdraw liquidity", :visible.sync="visible" width="50%" v-if="user")
    .row
      .col
        .row.mb-3(v-if="current.pool1")
          .col
            .row
              .col
                .lead Pool price: {{ poolPrice.toFixed(5) }}
                  |  {{ current.pool1.quantity.symbol.code().to_string() }}

            .row
              .col
                .lead Pool token supply: {{ current.supply }}

            .row.mt-2
              .col
                .lead Backed token balance: {{ tokenBalance }}

            hr

            .row.mt-2
              .col
                .lead Will receive {{ poolOne.quantity.symbol.code().to_string() }}: {{ baseReceive }}

            .row.mt-2
              .col
                .lead Will receive {{ poolTwo.quantity.symbol.code().to_string() }}: {{ quoteReceive }}
            .row.mt-2
              .col
                el-input(type="number" v-model="amount" clearable @change="amountChange")
                  span(slot="suffix").mr-1 {{ current.supply.symbol.code().to_string() }}
        .row
          .col
            PleaseLoginButton
              el-button(type="primary" @click="withdraw" :loading="loading").w-100 Withdraw

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
      amount: 0.0,

      tokenBalance: 0.0,

      visible: false,

      loading: false
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapGetters('api', ['rpc']),
    ...mapState(['network']),

    baseReceive() {
      if (!this.amount) {
        return number_to_asset(0, this.current.supply.symbol)
      } else {
        let amount = asset(this.amount + ' ' + this.current.supply.symbol.code().to_string()).amount

        amount = amount.multiply(this.current.pool1.quantity.amount).divide(this.current.supply.amount)

        return asset(amount, this.current.pool1.quantity.symbol)
      }
    },

    quoteReceive() {
      return 0
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

  methods: {
    open() {
      this.visible = true
      this.fetchBalance()
    },

    async fetchBalance() {
      const { rows: [row] } = await this.rpc.get_table_rows({
        code: this.network.pools.contract,
        scope: 'bobs',
        table: 'accounts',
        limit: 1
      })

      if (!row) {
        this.tokenBalance = asset(0, this.current.supply.symbol)
      } else {
        this.tokenBalance = asset(row.balance)
      }
    },

    amountChange() {
      this.amount = this.toFixed(this.amount, this.current.supply.symbol.precision())
    },

    async withdraw() {
      const authorization = [{ actor: this.user.name, permission: 'active' }]

      const amount1 = asset(`${this.amount1} ${this.current.pool1.quantity.symbol.code().to_string()}`).to_string()
      const amount2 = asset(`${this.amount2} ${this.current.pool2.quantity.symbol.code().to_string()}`).to_string()

      const actions = [{
        account: this.network.pools.contract,
        name: 'remliquidity',
        authorization,
        data: {
          user: this.user.name,
          to_sell: this.tokenReceive,
          min_ext_asset1: { contract: this.poolOne.contract, quantity: amount1 },
          min_ext_asset2: { contract: this.poolTwo.contract, quantity: amount2 }
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
