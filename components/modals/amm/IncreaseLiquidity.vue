<template lang="pug">
.increase-liquidity
  AlcorButton.increase-button(@click="visible = true")
    span Increase Liquidity

  //append-to-body
  el-dialog.increase-liquidity(
    title="Increase Liquidity"
    :visible="visible"
    @close="visible = false"
    :before-close="undefined"
  )
    PositionInfo(:noPL="true" v-bind="$props" :composedPercent="composedPercent")
    .separator.my-2
    .d-flex.justify-content-between.gap-8
      .fs-18.current-price
        span.disable Current Price:&nbsp;
        span {{ (tokensInverted ? position.pool.tokenAPrice.invert() : position.pool.tokenAPrice).toSignificant(5) }}
      AlcorSwitch(
        v-if='true',
        @toggle="$emit('toggleTokens')",
        :one='position.pool.tokenA.symbol',
        :two='position.pool.tokenB.symbol',
        :active='tokensInverted ? "two" : "one"'
      )

        ManageLiquidityMinMaxPrices(
          :position="position"
          :tokensInverted="tokensInverted"
          :priceLower="tokensInverted ? priceUpper : priceLower"
          :priceUpper="tokensInverted ? priceLower : priceUpper"
        ).mt-2

    .fs-18.disable.mt-2 Increase

    PoolTokenInput(:locked="true" :label="position.pool.tokenA.symbol" :token="position.pool.tokenA" @input="onAmountAInput" v-model="amountA")
    PoolTokenInput(:locked="true" :label="position.pool.tokenB.symbol" :token="position.pool.tokenB" @input="onAmountBInput" v-model="amountB").mt-2

    AlcorButton.claim-fees-button.submit.w-100(big @click="submit").mt-2 Add Liquidity

</template>

<script>
import { mapState, mapGetters } from 'vuex'
import AlcorButton from '~/components/AlcorButton.vue'
import AlcorContainer from '~/components/AlcorContainer'
import PoolTokenInput from '~/components/amm/PoolTokenInput'
import ManageLiquidityMinMaxPrices from '~/components/amm/ManageLiquidityMinMaxPrices'
import PositionInfo from '~/components/amm/manage-liquidity/PositionInfo'
import AlcorSwitch from '~/components/AlcorSwitch'

import { tryParseCurrencyAmount } from '~/utils/amm'
import { CurrencyAmount, Position, Percent } from '~/assets/libs/swap-sdk'

export default {
  components: {
    AlcorButton,
    PoolTokenInput,
    AlcorContainer,
    PositionInfo,
    AlcorSwitch,
    ManageLiquidityMinMaxPrices
  },

  props: ['position', 'tokensInverted', 'priceUpper', 'priceLower', 'composedPercent'],

  data: () => ({
    amountA: null,
    amountB: null,
    visible: false,
  }),

  computed: {
    ...mapState(['network', 'user']),
    ...mapGetters('amm', ['slippage']),
  },

  methods: {
    async submit() {
      try {
        await this.add()
        this.visible = false

        this.amountA = null
        this.amountB = null

        //setTimeout(() => {
        //  this.$store.dispatch('amm/poolUpdate', this.position?.pool?.id)
        //  //this.$store.dispatch('amm/fetchPositions')
        //}, 1000)
      } catch (e) {
        this.$notify({ type: 'Error', title: 'Increase Liquidity', message: e.message })
      }
    },

    async add() {
      if (!this.position) return this.$notify({ type: 'Error', title: 'No position' })

      const { amountA, amountB, slippage } = this
      const { tokenA, tokenB } = this.position.pool
      const { owner, tickLower, tickUpper } = this.position

      const tokenADesired = tryParseCurrencyAmount(amountA, tokenA) || CurrencyAmount.fromRawAmount(tokenA, 0)
      const tokenBDesired = tryParseCurrencyAmount(amountB, tokenB) || CurrencyAmount.fromRawAmount(tokenB, 0)

      const tokenAMin = tokenADesired.multiply(new Percent(1).subtract(slippage))
      const tokenBMin = tokenBDesired.multiply(new Percent(1).subtract(slippage))

      const actions = []

      if (tokenADesired.greaterThan(0))
        actions.push({
          account: tokenA.contract,
          name: 'transfer',
          authorization: [this.user.authorization],
          data: {
            from: this.user.name,
            to: this.network.amm.contract,
            quantity: tokenADesired.toAsset(),
            memo: 'deposit'
          }
        })

      if (tokenBDesired.greaterThan(0))
        actions.push(
          {
            account: tokenB.contract,
            name: 'transfer',
            authorization: [this.user.authorization],
            data: {
              from: this.user.name,
              to: this.network.amm.contract,
              quantity: tokenBDesired.toAsset(),
              memo: 'deposit'
            }
          }
        )

      actions.push({
        account: this.network.amm.contract,
        name: 'addliquid',
        authorization: [this.user.authorization],
        data: {
          poolId: this.position.pool.id,
          owner,
          tokenADesired: tokenADesired.toAsset(),
          tokenBDesired: tokenBDesired.toAsset(),
          tickLower,
          tickUpper,
          tokenAMin: tokenAMin.toAsset(),
          tokenBMin: tokenBMin.toAsset(),
          deadline: 0
        }
      })

      console.log({ actions })
      const result = await this.$store.dispatch('chain/sendTransaction', actions)
      console.log('result', result)
    },

    onAmountAInput(value) {
      if (!value || isNaN(value)) return
      this.amountB = this.getDependedAmount('CURRENCY_A', value).toFixed()
    },

    onAmountBInput(value) {
      if (!value || isNaN(value)) return
      this.amountA = this.getDependedAmount('CURRENCY_B', value).toFixed()
    },

    getDependedAmount(independentField, value) {
      const dependentField = independentField === 'CURRENCY_A' ? 'CURRENCY_B' : 'CURRENCY_A'

      const { tickLower, tickUpper, pool } = this.position

      const currencies = {
        CURRENCY_A: pool.tokenA,
        CURRENCY_B: pool.tokenB
      }

      const independentAmount = tryParseCurrencyAmount(
        value,
        currencies[independentField]
      )

      if (!independentAmount) return

      const dependentCurrency = dependentField === 'CURRENCY_B' ? currencies.CURRENCY_B : currencies.CURRENCY_A

      const position = independentAmount.currency.equals(pool.tokenA)
        ? Position.fromAmountA({
          pool,
          tickLower,
          tickUpper,
          amountA: independentAmount.quotient,
          useFullPrecision: true // we want full precision for the theoretical position
        })
        : Position.fromAmountB({
          pool,
          tickLower,
          tickUpper,
          amountB: independentAmount.quotient,
        })

      const dependentTokenAmount = independentAmount.currency.equals(pool.tokenA)
        ? position.amountB
        : position.amountA

      return dependentCurrency && CurrencyAmount.fromRawAmount(dependentCurrency, dependentTokenAmount.quotient)
    },
  },
}
</script>

<style lang="scss">
.increase-liquidity {
  .el-dialog {
    width: 90%;
    max-width: 480px;
  }
}
.separator {
  width: 100%;
  border-bottom: 1px solid var(--border-color);
}
.current-price{
  font-weight: 500;
}
.claim-fees-button.submit{
  background: #32D74B;
}
</style>
