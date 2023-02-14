<template lang="pug">
.add-liquidity-component
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-4
    i.el-icon-circle-plus-outline
    span Add Liquidity
  .d-flex.justify-content-between.gap-32
    .d-flex.flex-column.gap-8.left
      .fs-14.disable Select Pair and deposit amounts

      PoolTokenInput(:value="amountA" @input="onAmountAInput" :token="tokenA" :tokens="tokensA" @tokenSelected="setTokenA")
      .fs-14.disable Select Pair and deposit amounts

      PoolTokenInput(:token="tokenB" :tokens="tokensA" v-model="amountB" @tokenSelected="setTokenB")
      .d-flex.justify-content-end Balance: 1,000 WAX

      .fs-14.disable Select Price Range {{ max }}

      el-slider(v-model="rangeValues" range :marks="marks" :min="-100" :max="100" @change="percentageChange").px-3.pr-4

      //.d-flex.gap-8.mt-3.justify-content-center
        .grey-border.d-flex.flex-column.gap-20.p-2.br-4
          .fs-12.text-center Min Price
          el-input-number(v-model="minPrice" :precision="2" :step="0.1" :max="100")
          .fs-12.text-center BLK per WAX
        .grey-border.d-flex.flex-column.gap-20.p-2.br-4
          .fs-12.text-center Max Price
          el-input-number(v-model="maxPrice" :precision="2" :step="0.1" :max="100")
          .fs-12.text-center BLK per WAX

      .fs-14.disable.mt-2 Select Fee

      .d-flex.gap-16
        .fee.d-flex.flex-column.gap-16(v-for="({ value, desc, selectedPercent }, idx) in fees" @click="selectedFee = idx" :class="{ active: selectedFee == idx }")
          .fs-24 {{ value }}
          .fs-14.disable {{ desc }}
          .d-flex.gap-4
            span {{ selectedPercent }}
            span Selected

      alcor-button.w-100(@click="openPreviewLiqidityModal" access big) Preview

</template>

<script>
import { mapActions, mapState, mapGetters } from 'vuex'

import { tryParsePrice, tryParseCurrencyAmount, parseToken, tryParseTick } from '~/utils/amm'
import { Token, Pool, Tick, CurrencyAmount, Price, Position } from '~/assets/libs/swap-sdk'

import PoolTokenInput from '~/components/amm/PoolTokenInput'


import AlcorButton from '~/components/AlcorButton'

export default {
  components: { PoolTokenInput, AlcorButton },

  data() {
    return {
      tokenA: null,
      tokenB: null,

      amountA: 0,
      amountB: 0,

      rangeValues: [-50, 50],

      selectedFee: 1,

      fees: [
        { value: 0.05, desc: 'Best forvery high liquidity tokens', selectedPercent: 0 },
        { value: 0.3, desc: 'Best for most pairs', selectedPercent: 44 },
        { value: 1, desc: 'Best for low liqudity pairs', selectedPercent: 56 }
      ]
    }
  },

  watch: {
    value() {
      let [leftRangeValue, rightRangeValue] = this.rangeValues

      if (leftRangeValue <= 0) { leftRangeValue = 1 / 10 ** 6 } // set default if going from min border



      console.log('value changed pool', this.pool, this.$store.getters['amm/pools'])
    }
  },

  computed: {
    ...mapGetters(['user']),

    tokensA() {
      return this.user?.balances || []
    },

    max() {
      console.log('tokenAPriceLower()', this.pool)
      return 'asdf'
    },

    pools() {
      return this.$store.getters['amm/pools']
    },

    pool() {
      if (!this.tokensA || !this.tokenB) return null

      const p = this.pools.find(p => {
        return p.tokenA.name == this.tokenA.id.toLowerCase().replace('@', '-') &&
          p.tokenB.name == this.tokenB.id.toLowerCase().replace('@', '-')
      })

      //console.log('ppp', p.tokenBPrice)

      return p
    },

    marks() {
      return {
        '-100': '-100%',
        100: '100%',
        0: {
          style: { color: '#fff' },
          label: this.$createElement('strong', this.pool ? this.pool.tokenBPrice.toFixed() : 'no price')
          //label: this.$createElement('strong', this.pool?.asfd ? this.pool.tokenBPrice.toFixed() : 'no price')
        }
      }
    }
  },

  mounted() {
    this.tokenA = this.tokensA[1]
    this.tokenB = this.tokensA[2]
  },

  methods: {
    ...mapActions('modal', ['previewLiquidity']),

    //CURRENCY_A
    getDependedAmount(independentField, typedValue) {
      const { pool } = this

      const tickLower = -900
      const tickUpper = 1800

      const dependentField = independentField === 'CURRENCY_A' ? 'CURRENCY_B' : 'CURRENCY_A'
      const currencies = { CURRENCY_A: this.pool.tokenA, CURRENCY_B: this.pool.tokenB }

      const independentAmount = tryParseCurrencyAmount(typedValue, currencies[independentField])

      let dependentAmount

      if (
        independentAmount &&
        //typeof tickLower === 'number' && // TODO
        //typeof tickUpper === 'number' && // TODO
        pool
      ) {
        // if price is out of range or invalid range - return 0 (single deposit will be independent)

        // TODO
        //if (outOfRange || invalidRange) {
        //  return undefined
        //}


        const position = independentAmount.currency.equals(this.pool.tokenA)
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

        dependentAmount = independentAmount.currency.equals(pool.tokenA)
          ? position.amountB
          : position.amountA
      } else {
        dependentAmount = undefined
      }

      return dependentAmount
    },

    onAmountAInput(value) {
      if (!value) return
      this.amountA = value

      const amountB = this.getDependedAmount('CURRENCY_A', value)
      console.log('amountB', amountB)

      if (amountB) this.amountB = amountB.toSignificant(6)

      //this.amountA = value

      //const independentAmount = tryParseCurrencyAmount(value, this.pool.tokenA)

      //const p = Position.fromAmountA({
      //  pool: this.pool,
      //  tickLower: -900,
      //  tickUpper: 1800 * 4,

      //  amountA: independentAmount.quotient,
      //  useFullPrecision: true // we want full precision for the theoretical position
      //})

      //this.amountB = p.amountB.toSignificant(6)
    },

    setTokenA(token) {
      this.tokenA = token
    },

    percentageChange() {
      console.log(this.value)
    },

    setTokenB(token) {
      this.tokenB = token
    },

    openPreviewLiqidityModal() {
      const { outputToken, inputToken, inputAmount, outputAmount, selectedFee, maxPrice, minPrice, fees, inRange } = this

      this.previewLiquidity({
        inputToken,
        outputToken,
        inputAmount,
        outputAmount,
        selectedFee,
        maxPrice,
        minPrice,
        fees,
        inRange
      })
    }
  }
}
</script>

<style lang="scss">
.add-liquidity-component {
  .left {
    width: 587px;
  }

  .el-slider__marks-text:last-child {
    width: 40px;
  }

  .fee {
    width: 185px;
    height: 156px;
    padding: 16px 24px;
    cursor: pointer;

    background: rgba(60, 60, 67, 0.36);

    border: 1px solid rgba(120, 120, 135, 0.36);
    border-radius: 4px;

    &.active {
      border: 1px solid #67C23A;
      background: #161617;
    }
  }
}
</style>
