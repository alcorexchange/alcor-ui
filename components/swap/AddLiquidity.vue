<template lang="pug">
.row.mt-4
  .col
    .row
      .col
        .d-flex.mb-1.select-label
          small.text-muted Asset 1
          el-button(type="text" size="mini" @click="amount1Input(inputBalance)").ml-auto.pr-0 {{ inputBalance }}
            i.el-icon-wallet.ml-1

        SelectToken(v-model="amount1" :tokens="tokens0" :token="0" @input="amount1Input")

    .row.mt-3
      .col.text-center
        //i.el-icon-bottom.lead.pointer(@click="toggleInputs")
        i.el-icon-bottom.lead
    .row.mt-1
      .col
        .d-flex.mb-1.select-label
          small.text-muted Asset 2
          el-button(type="text" size="mini" @click="amount2Input(outputBalance)").ml-auto.pr-0 {{ outputBalance }}
            i.el-icon-wallet.ml-1

        SelectToken(v-model="amount2" :tokens="tokens1" :token="1" @input="amount2Input")

    .row.mt-4
      .col(v-if="amount1 && amount2").confirm-button
        el-button(type="primary" @click="submit" v-loading="loading").w-100 Provide liquidity
      .col(v-else).confirm-button
        el-button(type="primary" disabled).w-100 Select amounts

    .row.mt-3
      .col
        .d-flex.justify-content-between
          small Position (LP-T)
          b.small {{ tokenReceive }}
        SSpacer
        .d-flex.justify-content-between
          small Pool Share
          b.small {{ poolShare  }}%
        SSpacer
        .d-flex.justify-content-between(v-if="this.current")
          small Asset 1
          b.small {{ this.current.pool1.quantity }}
        SSpacer
        .d-flex.justify-content-between(v-if="this.current")
          small Asset 2
          b.small {{ this.current.pool2.quantity }}
</template>

<script>
import { asset, number_to_asset } from 'eos-common'
import { mapGetters, mapState } from 'vuex'
import BigCommon from 'big-integer'

import { computeForward, computeBackward, calcPrice } from '~/utils/pools'

import PleaseLoginButton from '~/components/elements/PleaseLoginButton'
import SelectToken from '~/components/swap/SelectToken.vue'
import SSpacer from '~/components/SSpacer.vue'

export default {
  components: {
    SelectToken,
    PleaseLoginButton,
    SSpacer
  },

  data() {
    return {
      amount1: 0.0,
      amount2: 0.0,

      visible: false,

      loading: false
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapState(['network']),

    ...mapState('swap', ['input', 'output', 'pairs']),
    ...mapGetters({
      current: 'swap/current',
      inputBalance: 'swap/inputBalance',
      outputBalance: 'swap/outputBalance',
      poolOne: 'swap/poolOne',
      poolTwo: 'swap/poolTwo',
      tokens0: 'swap/tokens0',
      tokens1: 'swap/tokens1'
    }),

    tokenReceive() {
      if (!this.amount1 || !this.amount2) return BigCommon(0)

      const amount1 = this.inputToAsset(
        this.amount1,
        this.poolOne.quantity.symbol.precision()
      ).amount
      const amount2 = this.inputToAsset(
        this.amount2,
        this.poolTwo.quantity.symbol.precision()
      ).amount

      const liquidity1 = amount1
        .multiply(this.current.supply.amount)
        .divide(this.poolOne.quantity.amount)
      const liquidity2 = amount2
        .multiply(this.current.supply.amount)
        .divide(this.poolTwo.quantity.amount)

      return asset(
        BigCommon.min(liquidity1, liquidity2),
        this.current.supply.symbol
      )
    },

    poolShare() {
      if (!this.current) return '0.00'

      const receive = parseFloat(
        asset(this.tokenReceive, this.current.supply.symbol)
      )
      const supply = parseFloat(this.current.supply) + receive

      return ((receive * 100) / supply).toFixed(2)
    },

    poolPrice() {
      return calcPrice(
        this.current.pool1.quantity,
        this.current.pool2.quantity
      ).toFixed(8)
    }
  },

  watch: {
    output() {
      this.amount1Input(this.amount1)
    },

    input() {
      this.amount2Input(this.amount2)
    },

    pairs() {
      if (this.amount1 && this.amount2) {
        this.amount1Input(this.amount1)
      }
    }
  },

  methods: {
    toggleInputs() {
      // TODO
    },

    amount1Input(value) {
      if (!this.current) return

      this.amount1 = parseFloat(value)
      let amount1 = (this.amount1 || 0).toFixed(
        this.poolOne.quantity.symbol.precision()
      )

      amount1 = asset(
        amount1 + ' ' + this.poolOne.quantity.symbol.code().to_string()
      ).amount

      const to_buy = computeBackward(
        amount1,
        this.current.supply.amount,
        this.poolOne.quantity.amount,
        0
      )

      const amount2 = number_to_asset(0, this.poolTwo.quantity.symbol)

      amount2.set_amount(
        computeForward(
          to_buy,
          this.poolTwo.quantity.amount,
          this.current.supply.amount,
          0
        )
      )
      this.amount2 = amount2.to_string().split(' ')[0]
    },

    amount2Input(value) {
      if (!this.current) return

      this.amount2 = parseFloat(value)
      let amount2 = (this.amount2 || 0).toFixed(
        this.poolTwo.quantity.symbol.precision()
      )

      amount2 = asset(
        amount2 + ' ' + this.poolTwo.quantity.symbol.code().to_string()
      ).amount

      const to_buy = computeBackward(
        amount2,
        this.current.supply.amount,
        this.poolTwo.quantity.amount,
        0
      )

      const amount1 = number_to_asset(0, this.poolOne.quantity.symbol)

      amount1.set_amount(
        //computeForward(to_buy.multiply(-1), this.poolOne.quantity.amount, this.current.supply.amount, 0).multiply(-1)
        computeForward(
          to_buy,
          this.poolOne.quantity.amount,
          this.current.supply.amount,
          0
        )
      )

      this.amount1 = amount1.to_string().split(' ')[0]
    },

    async open() {
      if (!(await this.$store.dispatch('chain/asyncLogin'))) return
      this.amountChange()
    },

    amountChange() {
      this.amount1 = (parseFloat(this.amount1) || 0).toFixed(
        this.poolOne.quantity.symbol.precision()
      )
      this.amount2 = (parseFloat(this.amount2) || 0).toFixed(
        this.poolTwo.quantity.symbol.precision()
      )
    },

    async submit() {
      const authorization = [this.user.authorization]

      this.amountChange()

      const amount1 = asset(
        `${this.amount1} ${this.poolOne.quantity.symbol.code().to_string()}`
      ).to_string()
      const amount2 = asset(
        `${this.amount2} ${this.poolTwo.quantity.symbol.code().to_string()}`
      ).to_string()

      const to_buy = this.tokenReceive.to_string()

      const actions = [
        {
          account: this.poolOne.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: this.network.pools.contract,
            quantity: amount1,
            memo: 'deposit'
          }
        },
        {
          account: this.poolTwo.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: this.network.pools.contract,
            quantity: amount2,
            memo: 'deposit'
          }
        },
        {
          account: this.network.pools.contract,
          name: 'addliquidity',
          authorization,
          data: {
            user: this.user.name,
            to_buy
          }
        }
      ]

      this.loading = true
      try {
        const r = await this.$store.dispatch('chain/sendTransaction', actions)
        await this.$store.dispatch('loadUserLiqudityPositions')

        this.$emit('update')
        this.visible = false
        this.$notify({
          title: 'Provide liquidity',
          message: 'Provided successful',
          type: 'success'
        })
        this.$store.dispatch('loadUserBalances')
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
