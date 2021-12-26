<template lang="pug">
.row
  .col.pool-withdraw
    .row.mt-4
      .col
        .d-flex.justify-content-between.select-label
          small.mb-1 From
          small.mb-1(v-if="withdraw_token") {{ withdraw_token.amount }} {{ withdraw_token.symbol }}
            i.el-icon-wallet.ml-1

        SelectToken(v-model="amount" :token="withdraw_token" :tokens="lpTokens" @change="setLpToken" @inputchange="amountChange")

    div(v-if="withdraw_token.symbol")
      .d-flex.mt-2
        .ml-auto.small {{ amountPercent }}%
      el-slider(v-model="amountPercent" :min="0" :max="100" @input="percentChange").mx-2

      .row.mt-3
        .col
          small.mb-1 To
          SelectToken(v-model="baseReceive" :token="tokenOne" :static="true")

      .row.mt-3
        .col
          SelectToken(v-model="quoteReceive" :token="tokenTwo" :static="true")

      .row.mt-3
        .col
          PleaseLoginButton.confirm-button
            el-button(v-if="parseFloat(amount)" type="primary" @click="withdraw" :loading="loading").w-100 Withdraw
            el-button(v-else type="primary" disabled).w-100 Select Amount

</template>

<script>
import { asset, number_to_asset } from 'eos-common'
import { mapGetters, mapState } from 'vuex'

import { computeForward } from '~/utils/pools'
import { e_asset_to_token } from '~/utils'

import PleaseLoginButton from '~/components/elements/PleaseLoginButton'
import TokenImage from '~/components/elements/TokenImage'
import SelectToken from '~/components/swap/SelectToken.vue'

export default {
  components: {
    TokenImage,
    PleaseLoginButton,
    SelectToken
  },

  data() {
    return {
      amount: 0.0,
      amountPercent: 0,

      loading: false
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapState(['network']),
    ...mapState('swap', ['pairs', 'withdraw_token']),

    pair() {
      if (!this.withdraw_token.symbol) return null
      return this.pairs.filter(
        (p) => p.supply.symbol.code().to_string() == this.withdraw_token.symbol
      )[0]
    },

    tokenOne() {
      if (!this.pair) return null

      return e_asset_to_token(this.pair.pool1)
    },

    tokenTwo() {
      if (!this.pair) return null

      return e_asset_to_token(this.pair.pool2)
    },

    lpTokens() {
      if (!this.user || !this.user.balances) return []

      return this.user.balances
        .filter((b) => b.contract == this.network.pools.contract)
        .map((b) => {
          b.symbol = b.currency
          b.precision = parseInt(b.decimals)
          return b
        })
    },

    baseReceive() {
      if (!this.amount || !this.pair) {
        if (!this.pair) return '0.0000'
        return number_to_asset(0, this.pair.supply.symbol)
          .to_string()
          .split(' ')[0]
      } else {
        let amount = this.inputToAsset(
          this.amount,
          this.pair.supply.symbol.precision()
        ).amount
        amount = computeForward(
          amount.multiply(-1),
          this.pair.pool1.quantity.amount,
          this.pair.supply.amount,
          0
        ).abs()
        return asset(amount, this.pair.pool1.quantity.symbol)
          .to_string()
          .split(' ')[0]
      }
    },

    quoteReceive() {
      if (!this.amount || !this.pair) {
        if (!this.pair) return '0.0000'
        return number_to_asset(0, this.pair.supply.symbol)
          .to_string()
          .split(' ')[0]
      } else {
        let amount = this.inputToAsset(
          this.amount,
          this.pair.supply.symbol.precision()
        ).amount
        amount = computeForward(
          amount.multiply(-1),
          this.pair.pool2.quantity.amount,
          this.pair.supply.amount,
          0
        ).abs()
        return asset(amount, this.pair.pool2.quantity.symbol)
          .to_string()
          .split(' ')[0]
      }
    },

    poolOne() {
      return this.pair.pool1
    },

    poolTwo() {
      return this.pair.pool2
    },

    poolPrice() {
      return this.pair.pool2.quantity.amount / this.pair.pool1.quantity.amount
    }
  },

  watch: {
    withdraw_token() {
      this.amount = 0.0
      this.amountChange()
    }
  },

  methods: {
    setLpToken(token) {
      this.$store.commit('swap/setWithdrawToken', token)
    },

    percentChange() {
      if (!this.withdraw_token.symbol) return

      const balance = parseFloat(this.withdraw_token.amount)

      if (balance == 0) return

      if (this.amountPercent === 100) {
        this.amount = balance
      } else {
        this.amount = (balance / 100) * this.amountPercent
      }

      this.amount = (parseFloat(this.amount) || 0).toFixed(
        this.pair.supply.symbol.precision()
      )
    },

    amountChange() {
      if (!this.withdraw_token.symbol) return

      try {
        this.amount = (parseFloat(this.amount) || 0).toFixed(
          this.pair.supply.symbol.precision()
        )

        const balance = parseFloat(this.withdraw_token.amount)
        if (balance == 0) return

        this.amountPercent = Math.ceil((this.amount * 100) / balance)
      } catch {
        this.amount = 0.0
        this.amountChange()
      }
    },

    async withdraw() {
      this.loading = true

      const authorization = [this.user.authorization]
      const actions = [
        {
          account: this.network.pools.contract,
          name: 'remliquidity',
          authorization,
          data: {
            user: this.user.name,
            to_sell:
              this.amount + ' ' + this.pair.supply.symbol.code().to_string(),
            min_asset1: this.baseReceive,
            min_asset2: this.quoteReceive
          }
        }
      ]

      try {
        const r = await this.$store.dispatch('chain/sendTransaction', actions)

        //TODO Refactor, create methods for it
        const balances = this.user.balances
        for (const b of balances) {
          if (b.currency == this.pair.supply.symbol.code().to_string()) {
            b.amount = parseFloat(b.amount) - parseFloat(this.amount)
            this.$store.commit('swap/setWithdrawToken', {
              ...this.withdraw_token,
              amount: b.amount
            })
          }
        }
        this.$store.commit(
          'setUser',
          { ...this.user, balances },
          { root: true }
        )
        // UPDATING OF user balance
        await this.$store.dispatch('loadUserLiqudityPositions')
        setTimeout(() => {
          this.$store.dispatch('loadLPTBalances')
          this.$store.dispatch('swap/updatePairBalances')
        }, 1000)

        this.amount = 0.0
        this.amountChange()

        this.$notify({ title: 'Withdraw', message: 'Success', type: 'success' })
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

<style lang="scss">
.bordered {
  border-right: 1px solid;
}

.pool-withdraw {
  .el-slider__runway {
    margin: 5px 0;
  }

  .el-slider__button-wrapper {
    z-index: 0;
  }
}
</style>
