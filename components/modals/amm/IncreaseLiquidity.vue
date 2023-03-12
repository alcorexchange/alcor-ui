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
    PositionInfo(:noPL="true" :pool="pool" :position="position")
    .separator.my-2
    .d-flex.justify-content-between.gap-8
      .fs-18.current-price
        span.disable Current Price:&nbsp;
        span {{ pool.tokenAPrice.toSignificant(5) }}
      AlcorSwitch(
        v-if='true',
        @toggle='() => {}',
        :one='"tokenA"',
        :two='"tokenB"',
        :active='"one"'
      )

    ManageLiquidityMinMaxPrices(:pool="pool" :priceLower="priceLower" :priceUpper="priceUpper").mt-2

    .fs-18.disable.mt-2 Increase
    PoolTokenInput(:locked="true" :label="position.pool.tokenA.symbol" :token="position.pool.tokenA" @input="onAmountAInput" v-model="amountA")
    PoolTokenInput(:locked="true" :label="position.pool.tokenB.symbol" :token="position.pool.tokenB" @input="onAmountBInput" v-model="amountB").mt-2

    AlcorButton.claim-fees-button.submit.w-100(big @click="add").mt-2 Add Liquidity

</template>

<script>
import { mapState } from 'vuex'
import AlcorButton from '~/components/AlcorButton.vue'
import AlcorModal from '~/components/AlcorModal.vue'
import CompactTabs from '~/components/CompactTabs.vue'
import TokenImage from '~/components/elements/TokenImage'
import PairIcons from '~/components/PairIcons'
import RangeIndicator from '~/components/amm/RangeIndicator'
import AlcorContainer from '~/components/AlcorContainer'
import PoolTokenInput from '~/components/amm/PoolTokenInput'
import ManageLiquidityMinMaxPrices from '~/components/amm/ManageLiquidityMinMaxPrices'
import PositionInfo from '~/components/amm/manage-liquidity/PositionInfo'
import AlcorSwitch from '~/components/AlcorSwitch'
import InputStepCounter from '~/components/amm/InputStepCounter'

import { tryParseCurrencyAmount } from '~/utils/amm'
import { CurrencyAmount, Position } from '~/assets/libs/swap-sdk'

export default {
  components: {
    AlcorModal,
    CompactTabs,
    TokenImage,
    AlcorButton,
    PairIcons,
    RangeIndicator,
    PoolTokenInput,
    AlcorContainer,
    PositionInfo,
    AlcorSwitch,
    InputStepCounter,
    ManageLiquidityMinMaxPrices
  },

  props: ['position', 'pool', 'priceLower', 'priceUpper'],

  data: () => ({
    amountA: null,
    amountB: null,
    tokenMode: null,
    visible: false,
  }),

  watch: {
    position() {
      if (!this.tokenMode) this.tokenMode = this.position.pool.tokenA.symbol
    }
  },

  computed: {
    ...mapState(['network', 'user'])
  },

  methods: {
    async add() {
      if (!this.position) return this.$notify({ type: 'Error', title: 'No position' })

      const { tokenA, tokenB } = this.position.pool
      const { owner, tickLower, tickUpper } = this.position

      // const tokenAZero = Number(0).toFixed(tokenA.decimals) + ' ' + tokenA.symbol
      // const tokenBZero = Number(0).toFixed(tokenB.decimals) + ' ' + tokenB.symbol

      // TODO Add slippage
      const amountA = parseFloat(this.amountA).toFixed(tokenA.decimals) + ' ' + tokenA.symbol
      const amountB = parseFloat(this.amountB).toFixed(tokenB.decimals) + ' ' + tokenB.symbol

      const actions = []

      if (parseFloat(amountA) > 0)
        actions.push({
          account: tokenA.contract,
          name: 'transfer',
          authorization: [this.user.authorization],
          data: {
            from: this.user.name,
            to: this.network.amm.contract,
            quantity: parseFloat(amountA).toFixed(tokenA.decimals) + ' ' + tokenA.symbol,
            memo: 'deposit'
          }
        })

      if (parseFloat(amountB) > 0)
        actions.push(
          {
            account: tokenB.contract,
            name: 'transfer',
            authorization: [this.user.authorization],
            data: {
              from: this.user.name,
              to: this.network.amm.contract,
              quantity: parseFloat(amountB).toFixed(tokenB.decimals) + ' ' + tokenB.symbol,
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
          tokenADesired: amountA,
          tokenBDesired: amountB,
          tickLower,
          tickUpper,
          tokenAMin: amountA,
          tokenBMin: amountB,
          deadline: 0
        }
      })

      console.log({ actions })
      try {
        // TODO Notify & update position
        const result = await this.$store.dispatch('chain/sendTransaction', actions)
        console.log('result', result)
        this.$store.dispatch('amm/fetchPositions')
        this.visible = false
      } catch (e) {
        console.log(e)
      }
    },

    onAmountAInput(value) {
      if (!value) return
      this.amountB = this.getDependedAmount('CURRENCY_A', value).toFixed()
    },

    onAmountBInput(value) {
      if (!value) return
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
          amountB: independentAmount.quotient
        })

      const dependentTokenAmount = independentAmount.currency.equals(pool.tokenA)
        ? position.amountB
        : position.amountA

      return dependentCurrency && CurrencyAmount.fromRawAmount(dependentCurrency, dependentTokenAmount.quotient)
    }
  }
}
</script>

<style lang="scss">
.increase-liquidity {
  .el-dialog {
    width: 480px;
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
