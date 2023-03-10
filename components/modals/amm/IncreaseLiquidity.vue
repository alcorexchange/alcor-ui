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
    PositionInfo(:noPL="true")
    .separator.my-2
    .d-flex.justify-content-between.gap-8
      .fs-18.current-price
        span.disable Current Price:&nbsp;
        span 16.82374
      AlcorSwitch(
        v-if='true',
        @toggle='() => {}',
        :one='"tokenA"',
        :two='"tokenB"',
        :active='"one"'
      )

    .d-flex.gap-8.mt-2
      InputStepCounter(:readOnly="true" :value="10")
        template(#top)
          .fs-12.text-center Min Price
        .fs-12.text-center wax per eos
        .fs-12.text-center.disable Your position will be 100% composed of WAX at this price
      InputStepCounter(:readOnly="true" :value="12")
        template(#top)
          .fs-12.text-center Min Price
        .fs-12.text-center wax per eos
        .fs-12.text-center.disable Your position will be 100% composed of WAX at this price

    .fs-18.disable.mt-2 Increase
    //- PoolTokenInput(:locked="true" :token="position.pool.tokenA" @input="onAmountAInput" v-model="amountA")
    //- PoolTokenInput(:locked="true" :token="position.pool.tokenB" @input="onAmountBInput" v-model="amountB")


    .row(v-if="position")
      .col.d-flex.flex-column.gap-16
        .d-flex.justify-content-between
          .d-flex.align-items-center.gap-8
            pair-icons(
              :token1="position.pool.tokenA"
              :token2="position.pool.tokenB"
            )
            .fs-18 {{ position.pool.tokenA.symbol }}/{{ position.pool.tokenB.symbol }}
          range-indicator(:inRange="position.inRange")

        alcor-container(:alternative="true").d-flex.flex-column.gap-10.w-100
          .d-flex.justify-content-between.align-items-center
            .d-flex.gap-8.align-items-center
              token-image(:src="$tokenLogo(position.pool.tokenA.symbol, position.pool.tokenA.symbol.contract)" height="25")
              .fs-14.contrast {{ position.pool.tokenA.symbol }}
            .contrast {{ position.amountA.toFixed() }}
          .d-flex.justify-content-between.align-items-center
            .d-flex.gap-8.align-items-center
              token-image(:src="$tokenLogo(position.pool.tokenB.symbol, position.pool.tokenB.symbol.contract)" height="25")
              .fs-14.contrast {{ position.pool.tokenB.symbol }}
            .contrast {{ position.amountB.toFixed() }}
          .hr
          .d-flex.justify-content-between.align-items-center
            .contrast Fee Tier
            .fs-14 {{ position.pool.fee / 10000 }}%

        .d-flex.justify-content-between.align-items-center
          .disable Selected Range
          el-radio-group(
            v-model='tokenMode',
            size='small'
          )
            el-radio-button(:label='position.pool.tokenA.symbol')
            el-radio-button(:label='position.pool.tokenB.symbol')

        .d-flex.gap-20.justify-content-between.align-items-center
          alcor-container(:alternative="true").d-flex.flex-column.gap-6.w-100
            .fs-12.text-center.disable Min Price
            .fs-24.text-center.contrast {{ position.tokenAPriceLower.toFixed() }}
            .fs-12.text-center.disable wax per eos

          i.el-icon-sort.r-90

          alcor-container(:alternative="true").d-flex.flex-column.gap-6.w-100
            .fs-12.text-center.disable Max Price
            .fs-24.text-center.contrast {{ position.tokenAPriceUpper.toFixed() }}
            .fs-12.text-center.disable wax per eos

        alcor-container(:alternative="true").d-flex.flex-column.gap-6.w-100
          .fs-12.text-center.disable Current Price
          .fs-24.text-center {{ position.pool.tokenAPrice.toFixed() }}
          .fs-12.text-center.disable wax per eos

        .contrast Add more liquidity
        PoolTokenInput(:locked="true" :token="position.pool.tokenA" @input="onAmountAInput" v-model="amountA")
        PoolTokenInput(:locked="true" :token="position.pool.tokenB" @input="onAmountBInput" v-model="amountB")

        alcor-button.w-100(big @click="add") Increase

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
    InputStepCounter
  },

  props: ['position'],

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
</style>
