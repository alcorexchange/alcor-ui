<template lang="pug">
.row.justify-content-center
  alcor-container.add-liquidity-component.w-100.p-2
    .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-4
      i.el-icon-circle-plus-outline
      span Add Liquidity

    .row.px-3
      .col
        // Tokens select
        .fs-16.disable.mb-2 Select Pairs

        .d-flex
          select-token(:token="tokenA" :tokens="tokensA" @selected="setTokenA").sustom-select-token
          select-token(:token="tokenB" :tokens="tokensB" @selected="setTokenB").sustom-select-token.ml-4

        .fs-16.disable.mt-3 Select Fee
        el-radio-group.el-radio-full-width.el-radio-group(v-model='selectedFee' size='small').w-75
          el-radio-button(label='0.05%')
          el-radio-button(label='0.3%')
          el-radio-button(label='1%')

      .col
        .fs-20.disable.mb-2(v-if="price") Set Price Range {{ price.toFixed() }}
        LiquidityChartRangeInput(
          v-if="pool"
          :currencyA="pool.tokenA || undefined"
          :currencyB="pool.tokenB || undefined"
          :feeAmount="feeAmount"
          :priceLower="priceLower"
          :priceUpper="priceUpper"
          :ticksAtLimit="ticksAtLimit"
          :price="price ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8)) : undefined"
          @onLeftRangeInput="onLeftRangeInput"
          @onRightRangeInput="onRightRangeInput"
          :interactive="interactive")
          //:price="23442.32"

        .d-flex.gap-8.mt-3.justify-content-center(v-if="leftRangeTypedValue && rightRangeTypedValue")
          .grey-border.d-flex.flex-column.gap-20.p-2.br-4
            .fs-12.text-center Min Price
            el-input-number(v-model="leftRangeTypedValue" :precision="6" :step="0.1" :max="100")
            //el-input-number(v-model="leftRangeTypedValue" :precision="6" :step="0.1" :max="100")
            .fs-12.text-center BLK per WAX
          .grey-border.d-flex.flex-column.gap-20.p-2.br-4
            .fs-12.text-center Max Price
            el-input-number(v-model="rightRangeTypedValue" :precision="6" :step="0.1" :max="100")
            //el-input(v-model="rightRangeTypedValue" :precision="6" :step="0.1" :max="100")
            .fs-12.text-center BLK per WAX

  //.d-flex.align-items-center
    alcor-container.add-liquidity-component.w-100
      .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-4
        i.el-icon-circle-plus-outline
        span Add Liquidity

      .row
        .col
          select-token(:token="tokenA" :tokens="tokensA" @selected="setTokenA")

          select-token(:token="tokenB" :tokens="tokensB" @selected="setTokenB")

    //.d-flex.justify-content-between.gap-32
      .d-flex.flex-column.gap-8.left
        .fs-14.disable Select Pair and deposit amounts

        PoolTokenInput(:value="amountA" @input="onAmountAInput" :token="tokenA" :tokens="tokensA" @tokenSelected="setTokenA")
        .fs-14.disable Select Pair and deposit amounts

        PoolTokenInput(:token="tokenB" :tokens="tokensA" v-model="amountB" @tokenSelected="setTokenB")
        .d-flex.justify-content-end Balance: 1,000 WAX

        .fs-14.disable Select Price Range {{ max }}

        .d-flex.gap-8.mt-3.justify-content-center
          .grey-border.d-flex.flex-column.gap-20.p-2.br-4
            .fs-12.text-center Min Price
            el-input-number(v-model="minPrice" :precision="2" :step="0.1" :max="100")
            .fs-12.text-center BLK per WAX
          .grey-border.d-flex.flex-column.gap-20.p-2.br-4
            .fs-12.text-center Max Price
            el-input-number(v-model="maxPrice" :precision="2" :step="0.1" :max="100")
            .fs-12.text-center BLK per WAX

        .fs-14.disable.mt-2 Select Fee

        .d-flex.gap-16.flex-wrap.justify-content-center
          .fee.d-flex.flex-column.gap-16(v-for="({ value, desc, selectedPercent }, idx) in fees" @click="selectedFee = idx" :class="{ active: selectedFee == idx }")
            .fs-24 {{ value }}
            .fs-14.disable {{ desc }}
            .d-flex.gap-4
              span {{ selectedPercent }}
              span Selected

        alcor-button.w-100(@click="openPreviewLiqidityModal" access big) Preview

  // Empty, for routes manage
  nuxt-child

</template>

<script>
import { mapActions, mapState, mapGetters } from 'vuex'

import AlcorButton from '~/components/AlcorButton'
import AlcorContainer from '~/components/AlcorContainer'

import SelectToken from '~/components/modals/amm/SelectToken'
import PoolTokenInput from '~/components/amm/PoolTokenInput'
import LiquidityChartRangeInput from '~/components/amm/range/LiquidityChartRangeInput'

import {
  tryParsePrice,
  tryParseCurrencyAmount,
  parseToken,
  tryParseTick,
  getPoolBounds,
  getTickToPrice
} from '~/utils/amm'

import {
  Currency, Percent, Token, Pool, Tick, CurrencyAmount,
  Price, Position, FeeAmount, nearestUsableTick, TICK_SPACINGS,
  TickMath
} from '~/assets/libs/swap-sdk'

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10000)

export default {
  components: { SelectToken, PoolTokenInput, AlcorButton, AlcorContainer, LiquidityChartRangeInput },

  // Enabling managige route in nested component
  fetch({ route, redirect }) {
    if (route.path == '/add-liquidity') redirect('/add-liquidity/')
  },

  data() {
    return {
      invertPrice: false,

      amountA: 0,
      amountB: 0,

      minPrice: 0,
      maxPrice: 0,

      feeAmountFromUrl: 3000,

      independentField: 'CURRENCY_A',
      leftRangeTypedValue: '',
      rightRangeTypedValue: '',

      rangeValues: [-50, 50],

      selectedFee: '0.3%',

      fees: [
        { value: 0.05, desc: 'Best forvery high liquidity tokens', selectedPercent: 0 },
        { value: 0.3, desc: 'Best for most pairs', selectedPercent: 44 },
        { value: 1, desc: 'Best for low liqudity pairs', selectedPercent: 56 }
      ]
    }
  },

  watch: {
    value() {
      console.log('value changed pool', this.pool, this.$store.getters['amm/pools'])
    },
  },

  computed: {
    ...mapGetters(['user']),
    ...mapGetters('amm/addLiquidity', ['tokensA', 'tokensB', 'pool']),
    ...mapState('amm/addLiquidity', ['tokenA', 'tokenB']),

    interactive() {
      return !this.position
    },

    feeAmount() {
      const { feeAmountFromUrl } = this

      const feeAmount =
        feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
          ? parseFloat(feeAmountFromUrl)
          : undefined

      return feeAmount
    },

    noLiquidity() {
      return !this.pool
    },

    baseCurrency() {
      return 0
    },

    quoteCurrency() {
      //const quoteCurrency = baseCurrency && currencyB && baseCurrency.wrapped.equals(currencyB.wrapped) ? undefined : currencyB

      return 0
    },

    tickSpaceLimits() {
      return getPoolBounds(this.pool.fee)
    },

    ticksAtLimit() {
      const { feeAmount, tickLower, tickUpper, tickSpaceLimits } = this

      return {
        LOWER: feeAmount && tickLower === tickSpaceLimits.LOWER,
        UPPER: feeAmount && tickUpper === tickSpaceLimits.UPPER
      }
    },

    tickLower() {
      return this.ticks?.LOWER
    },

    tickUpper() {
      return this.ticks?.UPPER
    },

    ticks() {
      if (!this.pool) return undefined

      const { position, invertPrice, tickSpaceLimits, feeAmount, rightRangeTypedValue, leftRangeTypedValue, pool: { tokenA, tokenB } } = this

      // Initates initial prices for inputs(using event from crart based on mask bounds)
      console.log({ rightRangeTypedValue, leftRangeTypedValue, position })
      const r = {
        LOWER:
          typeof position?.tickLower === 'number'
            ? position.tickLower
            : (invertPrice && rightRangeTypedValue === 0) ||
              (!invertPrice && leftRangeTypedValue === 0)
              ? tickSpaceLimits.LOWER
              : invertPrice
                ? tryParseTick(tokenB, tokenA, feeAmount, rightRangeTypedValue.toString())
                : tryParseTick(tokenA, tokenB, feeAmount, leftRangeTypedValue.toString()),

        UPPER:
          typeof position?.tickUpper === 'number'
            ? position.tickUpper
            : (!invertPrice && rightRangeTypedValue === 0) ||
              (invertPrice && leftRangeTypedValue === 0)
              ? tickSpaceLimits.UPPER
              : invertPrice
                ? tryParseTick(tokenB, tokenA, feeAmount, leftRangeTypedValue.toString())
                : tryParseTick(tokenA, tokenB, feeAmount, rightRangeTypedValue.toString())
      }

      return r
    },

    position() {
      // check for existing position if tokenId in url
      //const { position: existingPositionDetails, loading: positionLoading } = useV3PositionFromTokenId(
      //  tokenId ? BigNumber.from(tokenId) : undefined
      //)

      return undefined
    },

    price() {
      // Все верно
      if (!this.pool) return undefined

      const { noLiquidity, startPriceTypedValue, invertPrice, pool } = this
      const { tokenA, tokenB } = pool

      // if no liquidity use typed value
      if (noLiquidity) {
        const parsedQuoteAmount = tryParseCurrencyAmount(startPriceTypedValue, invertPrice ? tokenA : tokenB)
        if (parsedQuoteAmount && tokenA && tokenB) {
          const baseAmount = tryParseCurrencyAmount('1', invertPrice ? tokenB : tokenA)
          const price =
            baseAmount && parsedQuoteAmount
              ? new Price(
                baseAmount.currency,
                parsedQuoteAmount.currency,
                baseAmount.quotient,
                parsedQuoteAmount.quotient
              )
              : undefined
          return (invertPrice ? price?.invert() : price) ?? undefined
        }
        return undefined
      } else {
        // get the amount of quote currency
        return pool && tokenA ? pool.priceOf(tokenA) : undefined
      }
    },

    pricesAtTicks() {
      if (!this.pool) return undefined

      const { pool: { tokenA, tokenB }, ticks: { LOWER, UPPER } } = this

      console.log('TRY TICK TO PRICE', { LOWER, UPPER })

      return {
        LOWER: getTickToPrice(tokenA, tokenB, LOWER),
        UPPER: getTickToPrice(tokenA, tokenB, UPPER)
      }
    },

    priceLower() {
      return this.pricesAtTicks?.LOWER
    },

    priceUpper() {
      return this.pricesAtTicks?.UPPER
    },

    invalidRange() {
      const { tickLower, tickUpper } = this
      return Boolean(typeof tickLower === 'number' && typeof tickUpper === 'number' && tickLower >= tickUpper)
    },

    max() {
      console.log('tokenAPriceLower()', this.pool)
      return 100
    },

    pools() {
      return this.$store.getters['amm/pools']
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
    this.init()
  },

  methods: {
    ...mapActions('modal', ['previewLiquidity']),



    init() {

      //this.parseUrlParams()
      //this.checkPosition()

      //this.tokenA = this.tokensA[1]
      //this.tokenB = this.tokensA[2]
    },

    parseUrlParams() {
      // TODO GET FROM QUERYSTRING
      //currencyIdA,
      //currencyIdB,
      //feeAmount: feeAmountFromUrl,
      //tokenId,

      // TODO щас разбираемся с этим
      //if (
      //  parsedQs.minPrice &&
      //  typeof parsedQs.minPrice === 'string' &&
      //  parsedQs.minPrice !== leftRangeTypedValue &&
      //  !isNaN(parsedQs.minPrice as any)
      //) {
      //  onLeftRangeInput(parsedQs.minPrice)
      //}

      //if (
      //  parsedQs.maxPrice &&
      //  typeof parsedQs.maxPrice === 'string' &&
      //  parsedQs.maxPrice !== rightRangeTypedValue &&
      //  !isNaN(parsedQs.maxPrice as any)
      //) {
      //  onRightRangeInput(parsedQs.maxPrice)
      //}
      return 0
    },

    // TODO
    //const handleFeePoolSelect = useCallback(
    //  (newFeeAmount: FeeAmount) => {
    //    onLeftRangeInput('')
    //    onRightRangeInput('')
    //    navigate(`/add/${currencyIdA}/${currencyIdB}/${newFeeAmount}`)
    //  },
    //  [currencyIdA, currencyIdB, navigate, onLeftRangeInput, onRightRangeInput]
    //)

    onLeftRangeInput(value) {
      console.log('onLeftRangeInput', value)
      this.leftRangeTypedValue = value
    },

    onRightRangeInput(value) {
      console.log('onRightRangeInput', value)
      this.rightRangeTypedValue = value
    },

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
      this.$store.dispatch('amm/addLiquidity/setTokenA', token)
    },

    percentageChange() {
      console.log(this.value)
    },

    setTokenB(token) {
      this.$store.dispatch('amm/addLiquidity/setTokenB', token)
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
.add-liquidity-page {
  max-width: 880px;
}

.sustom-select-token {
  .select-token-button {
    width: 140px;
  }
}

.add-liquidity-component {
  margin-top: 50px;
  max-width: 880px;

  .left {
    width: 100%;
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
