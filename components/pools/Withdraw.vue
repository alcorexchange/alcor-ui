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

import { computeForward } from '~/utils/pools'

import PleaseLoginButton from '~/components/elements/PleaseLoginButton'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage,
    PleaseLoginButton
  },

  data() {
    return {
      amount: 0.0,
      visible: false,
      loading: false
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapState(['network']),
    ...mapGetters('pools', ['current']),

    tokenBalance() {
      if (this.user && this.user.balances) {
        const b = this.user.balances.filter(b => {
          return b.currency === this.current.supply.symbol.code().to_string() && b.contract ==
            'evolutiondex'
        })[0]

        if (b) {
          return b.amount + ' ' + b.currency
        }
      }

      return '0.0000'
    },

    baseReceive() {
      if (!this.amount) {
        return number_to_asset(0, this.current.supply.symbol)
      } else {
        let amount = this.inputToAsset(this.amount, this.current.supply.symbol.precision()).amount
        amount = computeForward(amount.multiply(-1), this.current.pool1.quantity.amount, this.current.supply.amount, 0).abs()
        return asset(amount, this.current.pool1.quantity.symbol).to_string()
      }
    },

    quoteReceive() {
      if (!this.amount) {
        return number_to_asset(0, this.current.supply.symbol)
      } else {
        let amount = this.inputToAsset(this.amount, this.current.supply.symbol.precision()).amount
        amount = computeForward(amount.multiply(-1), this.current.pool2.quantity.amount, this.current.supply.amount, 0).abs()
        return asset(amount, this.current.pool2.quantity.symbol).to_string()
      }
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

  mounted() {
    this.amountChange()
  },

  methods: {
    async open() {
      if (!await this.$store.dispatch('chain/asyncLogin')) return

      this.visible = true
    },

    amountChange() {
      try {
        this.amount = (parseFloat(this.amount) || 0).toFixed(this.current.supply.symbol.precision())
      } catch {
        this.amount = 0.0
        this.amountChange()
      }
    },

    async withdraw() {
      this.loading = true

      const authorization = [{ actor: this.user.name, permission: 'active' }]

      const actions = [
        {
          account: 'evolutiondex',
          name: 'openext',
          authorization,
          data: {
            user: this.user.name,
            payer: this.user.name,
            ext_symbol: { contract: this.current.pool1.contract, sym: this.current.pool1.quantity.symbol.toString() }
          }
        }, {
          account: 'evolutiondex',
          name: 'openext',
          authorization,
          data: {
            user: this.user.name,
            payer: this.user.name,
            ext_symbol: { contract: this.current.pool2.contract, sym: this.current.pool2.quantity.symbol.toString() }
          }
        }, {
          account: 'evolutiondex',
          name: 'remliquidity',
          authorization,
          data: {
            user: this.user.name,
            to_sell: this.amount + ' ' + this.current.supply.symbol.code().to_string(),
            min_asset1: this.baseReceive,
            min_asset2: this.quoteReceive
          }
        }, {
          account: 'evolutiondex',
          name: 'closeext',
          authorization,
          data: {
            user: this.user.name,
            ext_symbol: { contract: this.current.pool1.contract, sym: `${this.current.pool1.quantity.symbol.toString()}` },
            to: this.user.name,
            memo: ''
          }
        }, {
          account: 'evolutiondex',
          name: 'closeext',
          authorization,
          data: {
            user: this.user.name,
            ext_symbol: { contract: this.current.pool2.contract, sym: `${this.current.pool2.quantity.symbol.toString()}` },
            to: this.user.name,
            memo: ''
          }
        }
      ]

      try {
        const r = await this.$store.dispatch('chain/sendTransaction', actions)
        this.visible = false
        this.$emit('update')
        this.$notify({ title: 'Withdraw', message: 'Success', type: 'success' })
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
.bordered {
  border-right: 1px solid;
}
</style>
