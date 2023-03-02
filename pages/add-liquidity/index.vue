<template lang="pug">
.row.justify-content-center
  alcor-container.add-liquidity-component.w-100.p-2
    .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-4
      i.el-icon-circle-plus-outline
      span add liquidity
    .right(v-if="pool")
      .pointer(@click="toggleTokens") {{ tokenA.symbol }} / {{ tokenB.symbol }}
      .div InvertPrice {{ invertPrice }}

    .row.px-3
      .col
        .fs-16.disable.mb-2 Select Pairs

        .d-flex.mt-3.justify-content-between
          select-token(:token="tokenA" :tokens="tokens" @selected="setTokenA").sustom-select-token
          select-token(:token="tokenB" :tokens="tokens" @selected="setTokenB").sustom-select-token

        .fs-14.disable.my-2 Select fee
        commission-select(:selected="feeAmount" :options="fees" @change="v => feeAmount = v")

        .fs-16.disable.mt-3 Deposit Amounts
          PoolTokenInput(:token="tokenA" v-model="amountA" @input="onInputAmountA" @tokenSelected="setTokenA").mt-2
          PoolTokenInput(:token="tokenB" v-model="amountB" @tokenSelected="setTokenA").mt-3

        alcor-button(outline @click="submit").mt-3.w-100 Add liquidity

      template(v-if="!pool")
        auth-only.col.d-flex.flex-column.gap-12
          .fs-16.disable Set Starting Price
          info-container(:access="true")
            | This pool must be initialized before you can add liquidity.
            | To initialize, select a starting price for the pool.
            | Then, enter your liquidity price range and deposit amount.
            | Gas fees will be higher than usual due to the initialization transaction.

          el-input(placeholder="0" v-model="startPriceTypedValue")

          info-container
            .d-flex.justify-content-between
              .fs-16 Current {{ tokenA ? tokenA.symbol : '' }} price
              .fs-16.disable {{ startPriceTypedValue ? startPriceTypedValue + ' ' + (tokenB ? tokenB.symbol : '') : '-' }}

          .d-flex.gap-8.justify-content-center
            .grey-border.d-flex.flex-column.gap-20.p-2.br-4
              .fs-12.text-center Min Price
              el-input-number(v-model="leftRangeTypedValue" :step="0.000001")
              .fs-12.text-center BLK per WAX
            .grey-border.d-flex.flex-column.gap-20.p-2.br-4
              .fs-12.text-center Max Price
              el-input-number(v-model="rightRangeTypedValue" :step="0.000001")
              .fs-12.text-center BLK per WAX

          //alcor-button.w-100(access) Connect Wallet

      template(v-else)
        .col
          .fs-16.disable.mb-1 Set Price Range
          LiquidityChartRangeInput(
            v-if="pool"
            :currencyA="tokenA || undefined"
            :currencyB="tokenB || undefined"
            :feeAmount="feeAmount"
            :priceLower="priceLower"
            :priceUpper="priceUpper"
            :ticksAtLimit="ticksAtLimit"
            :price="price ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8)) : undefined"
            @onLeftRangeInput="onLeftRangeInput"
            @onRightRangeInput="onRightRangeInput"
            :interactive="interactive")

          .d-flex.gap-8.mt-3.justify-content-center(v-if="leftRangeTypedValue && rightRangeTypedValue")
            .grey-border.d-flex.flex-column.gap-20.p-2.br-4
              .fs-12.text-center Min Price
              el-input-number(v-model="leftRangeTypedValue" :step="0.000001")
              //el-input-number(v-model="leftRangeTypedValue" :precision="6" :step="0.1" :max="100")
              .fs-12.text-center BLK per WAX
            .grey-border.d-flex.flex-column.gap-20.p-2.br-4
              .fs-12.text-center Max Price
              // TODO Min/Max prices based on limit ticks
              el-input-number(v-model="rightRangeTypedValue" :step="0.000001")
              //el-input(v-model="rightRangeTypedValue" :precision="6" :step="0.1" :max="100")
              .fs-12.text-center BLK per WAX

  //.d-flex.align-items-center
    alcor-container.add-liquidity-component.w-100
      .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-4
        i.el-icon-circle-plus-outline
        span Add Liquidity

      .row
        .col
          select-token(:token="tokenA" :tokens="tokens" @selected="setTokenA")

          select-token(:token="tokenB" :tokens="tokens" @selected="setTokenB")

    //.d-flex.justify-content-between.gap-32
      .d-flex.flex-column.gap-8.left
        .fs-14.disable Select Pair and deposit amounts

        PoolTokenInput(:value="amountA" @input="onAmountAInput" :token="tokenA" :tokens="tokens" @tokenSelected="setTokenA")
        .fs-14.disable Select Pair and deposit amounts

        PoolTokenInput(:token="tokenB" :tokens="tokens" v-model="amountB" @tokenSelected="setTokenB")
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
import { asset } from 'eos-common'
import { mapActions, mapState, mapGetters } from 'vuex'

import AlcorButton from '~/components/AlcorButton'
import AlcorContainer from '~/components/AlcorContainer'

import SelectToken from '~/components/modals/amm/SelectToken'
import PoolTokenInput from '~/components/amm/PoolTokenInput'
import LiquidityChartRangeInput from '~/components/amm/range'
import CommissionSelect from '~/components/amm/CommissionSelect'
import InfoContainer from '~/components/UI/InfoContainer'
import AuthOnly from '~/components/AuthOnly'

import {
  tryParsePrice,
  tryParseCurrencyAmount,
  parseToken,
  tryParseTick,
  getPoolBounds,
  getTickToPrice,
  isPriceInvalid
} from '~/utils/amm'

import {
  Currency, Percent, Token, Pool, Tick, CurrencyAmount,
  Price, Position, FeeAmount, nearestUsableTick, TICK_SPACINGS,
  TickMath, Rounding, priceToClosestTick
} from '~/assets/libs/swap-sdk'

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10000)

export default {
  components: {
    SelectToken,
    PoolTokenInput,
    AlcorButton,
    AlcorContainer,
    LiquidityChartRangeInput,
    CommissionSelect,
    InfoContainer,
    AuthOnly
  },

  // Enabling managige route in nested component
  fetch({ route, redirect }) {
    if (route.path == '/add-liquidity') redirect('/add-liquidity/')
  },

  data() {
    return {
      amountA: 0,
      amountB: 0,

      //feeAmountFromUrl: FeeAmount.,

      startPriceTypedValue: null,
      leftRangeTypedValue: '',
      rightRangeTypedValue: '',

      fees: [
        { value: FeeAmount.LOW, desc: 'Best forvery high liquidity tokens', selectedPercent: 0 },
        { value: FeeAmount.MEDIUM, desc: 'Best for most pairs', selectedPercent: 44 },
        { value: FeeAmount.HIGH, desc: 'Best for low liqudity pairs', selectedPercent: 56 }
      ]
    }
  },

  watch: {
    value() {
      console.log('value changed pool', this.pool, this.$store.getters['amm/pools'])
    },

    tokens() {
      console.log('tokens a updates')
    }
  },

  computed: {
    ...mapState(['user', 'network']),
    ...mapGetters('amm/liquidity', [
      'tokenA',
      'tokenB',
      'tokens',
      'pool',
      'invertPrice'
    ]),

    feeAmount: {
      get() {
        return this.$store.state.amm.liquidity.feeAmount
      },

      set(val) {
        this.$store.commit('amm/liquidity/setFeeAmount', val)
      }
    },

    position() {
      return null
    },

    interactive() {
      return !this.position
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
      return getPoolBounds(this.feeAmount)
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
      const { tokenA, tokenB, position, invertPrice, tickSpaceLimits, feeAmount, rightRangeTypedValue, leftRangeTypedValue } = this

      console.log({ invertPrice })
      // Initates initial prices for inputs(using event from crart based on mask bounds)
      return {
        LOWER:
          typeof position?.tickLower === 'number'
            ? position.tickLower
            : (invertPrice && typeof rightRangeTypedValue === 'boolean') ||
              (!invertPrice && typeof leftRangeTypedValue === 'boolean')
              ? tickSpaceLimits.LOWER
              : invertPrice
                ? tryParseTick(tokenB, tokenA, feeAmount, rightRangeTypedValue.toString())
                : tryParseTick(tokenA, tokenB, feeAmount, leftRangeTypedValue.toString()),

        UPPER:
          typeof position?.tickUpper === 'number'
            ? position.tickUpper
            : (!invertPrice && typeof rightRangeTypedValue === 'boolean') ||
              (invertPrice && typeof leftRangeTypedValue === 'boolean')
              ? tickSpaceLimits.UPPER
              : invertPrice
                ? tryParseTick(tokenB, tokenA, feeAmount, leftRangeTypedValue.toString())
                : tryParseTick(tokenA, tokenB, feeAmount, rightRangeTypedValue.toString())
      }
    },

    price() {
      const { tokenA, tokenB, noLiquidity, startPriceTypedValue, invertPrice, pool } = this

      if (noLiquidity) {
        console.log({ tokenA, tokenB, noLiquidity, startPriceTypedValue, invertPrice, pool })
        // if no liquidity use typed value
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

      console.log({ LOWER, UPPER })

      return {
        LOWER: getTickToPrice(tokenA, tokenB, LOWER),
        UPPER: getTickToPrice(tokenA, tokenB, UPPER)
      }
    },

    priceLower() {
      console.log('priceLower', this.pricesAtTicks?.LOWER?.toFixed())
      return this.pricesAtTicks?.LOWER
    },

    priceUpper() {
      console.log('priceUpper', this.pricesAtTicks?.UPPER?.toFixed())
      return this.pricesAtTicks?.UPPER
    },

    invalidRange() {
      const { tickLower, tickUpper } = this
      return Boolean(typeof tickLower === 'number' && typeof tickUpper === 'number' && tickLower >= tickUpper)
    },

    invalidPrice() {
      return isPriceInvalid(this.price)
    },

    outOfRange() {
      const { invalidRange, price, lowerPrice, upperPrice } = this

      return Boolean(
        !invalidRange &&
        price &&
        lowerPrice &&
        upperPrice &&
        (price.lessThan(lowerPrice) || price.greaterThan(upperPrice))
      )
    },

    max() {
      return 100
    },

    pools() {
      return this.$store.getters['amm/pools']
    },

    mockPool() {
      // Used when pool is not initialized
      const { tokenA, tokenB, feeAmount, price, invalidPrice } = this
      console.log('mock pool', { tokenA, tokenB, feeAmount, price, invalidPrice })

      if (tokenA && tokenB && feeAmount && price && !invalidPrice) {
        const tickCurrent = priceToClosestTick(price)
        const sqrtPriceX64 = TickMath.getSqrtRatioAtTick(tickCurrent)

        console.log({ tickCurrent, sqrtPriceX64 })

        return new Pool({
          tokenA,
          tokenB,
          fee: feeAmount,
          sqrtPriceX64,
          tickCurrent,
          liquidity: 0,
          ticks: [],
          feeGrowthGlobalAX64: 0,
          feeGrowthGlobalBX64: 0
        })
      }

      return undefined
    }
  },

  mounted() {
    this.init()
  },

  methods: {
    ...mapActions('modal', ['previewLiquidity']),

    toggleTokens() {
      const { invertPrice, ticksAtLimit, priceLower, priceUpper } = this

      if (!ticksAtLimit.LOWER && !ticksAtLimit.UPPER) {
        this.onLeftRangeInput((invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? '')
        this.onRightRangeInput((invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? '')
        this.onInputAmountA(this.amountB ?? '')
      }

      this.$store.dispatch('amm/liquidity/toggleTokens')
    },

    init() {

      //this.parseUrlParams()
      //this.checkPosition()

      //this.tokenA = this.tokens[1]
      //this.tokenB = this.tokens[2]
    },

    onInputAmountA(value) {
      const dependentAmount = this.getDependedAmount(value, 'CURRENCY_A')
      console.log({ dependentAmount })
      if (dependentAmount) {
        this.amountB = dependentAmount.toFixed()
        console.log('dependentAmount', dependentAmount.toFixed(dependentAmount.currency.digits, undefined, 'ROUND_HALF_UP'))
      }
    },

    getDependedAmount(value, independentField) {
      const { tickLower, tickUpper, invalidRange, outOfRange } = this

      const pool = this.pool || this.mockPool

      const dependentField = independentField === 'CURRENCY_A' ? 'CURRENCY_B' : 'CURRENCY_A'

      const currencies = {
        CURRENCY_A: this.tokenA,
        CURRENCY_B: this.tokenB
      }

      const independentAmount = tryParseCurrencyAmount(
        value,
        currencies[independentField]
      )

      const dependentCurrency = dependentField === 'CURRENCY_B' ? currencies.CURRENCY_B : currencies.CURRENCY_A

      if (
        independentAmount &&
        typeof tickLower === 'number' &&
        typeof tickUpper === 'number' &&
        pool
      ) {
        // if price is out of range or invalid range - return 0 (single deposit will be independent)
        if (outOfRange || invalidRange) {
          return undefined
        }

        console.log({
          pool,
          tickLower,
          tickUpper,
          amountA: independentAmount.quotient,
          useFullPrecision: true // we want full precision for the theoretical position
        })

        const position = independentAmount.currency.equals(pool.tokenA)
          ? Position.fromAmountA({
            pool,
            tickLower,
            tickUpper,
            amountA: independentAmount.quotient,
            useFullPrecision: true, // we want full precision for the theoretical position
            feeGrowthInsideALastX64: 0, // we are not going to calculate fees
            feeGrowthInsideBLastX64: 0
          })
          : Position.fromAmountB({
            pool,
            tickLower,
            tickUpper,
            amountB: independentAmount.quotient,
            feeGrowthInsideALastX64: 0, // we are not going to calculate fees
            feeGrowthInsideBLastX64: 0
          })

        const dependentTokenAmount = independentAmount.currency.equals(pool.tokenA)
          ? position.amountB
          : position.amountA

        return dependentCurrency && CurrencyAmount.fromRawAmount(dependentCurrency, dependentTokenAmount.quotient)
      }

      return undefined
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
      this.onInputAmountA(this.amountA)
    },

    onRightRangeInput(value) {
      console.log('onRightRangeInput', value)
      this.rightRangeTypedValue = value
      this.onInputAmountA(this.amountA)
    },

    setTokenA(token) {
      this.$store.dispatch('amm/liquidity/setTokenA', token)
    },

    percentageChange() {
      console.log(this.value)
    },

    setTokenB(token) {
      this.$store.dispatch('amm/liquidity/setTokenB', token)
    },

    async submit() {
      const { amountA, amountB, tokenA, tokenB, tickLower, tickUpper } = this
      console.log(tokenA, tokenB)
      console.log({ amountA, amountB })

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

      actions.push(
        {
          account: this.network.amm.contract,
          name: 'addliquid',
          authorization: [this.user.authorization],
          data: {
            poolId: this.pool.id,
            owner: this.user.name,
            tokenADesired: parseFloat(amountA).toFixed(tokenA.decimals) + ' ' + tokenA.symbol,
            tokenBDesired: parseFloat(amountB).toFixed(tokenB.decimals) + ' ' + tokenB.symbol,
            tickLower,
            tickUpper,
            tokenAMin: (parseFloat(amountA)).toFixed(tokenA.decimals) + ' ' + tokenA.symbol,
            tokenBMin: (parseFloat(amountB)).toFixed(tokenB.decimals) + ' ' + tokenB.symbol,
            deadline: 0
          }
        }
      )

      console.log('aa', amountB, tokenB)
      const r = tryParseCurrencyAmount(amountB, tokenB)

      console.log(r, { actions })

      try {
        const r = await this.$store.dispatch('chain/sendTransaction', actions)
        console.log(r)
      } catch (e) {
        console.log('err', e)
      }
    }
  }
}
</script>

<style lang="scss">
.sustom-select-token {
  .select-token-button {
    width: 140px;
  }
}

.add-liquidity-component {
  margin-top: 50px;
  max-width: 880px;

  .el-slider__marks-text:last-child {
    width: 40px;
  }
}
</style>
