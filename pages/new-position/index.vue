<template lang="pug">
.row.justify-content-center
  AlcorContainer.add-liquidity-component.w-100
    PageHeader(title="Add Liquidity")
    .main-section.mt-2
      .section
        .fs-16.disable.mb-2 Select Pool

        .d-flex.mt-1.gap-10
          SelectToken(:token="tokenA" :tokens="tokens" @selected="setTokenA").sustom-select-token
          SelectToken(:token="tokenB" :tokens="tokens" @selected="setTokenB").sustom-select-token

        div(v-mutted="!tokenA || !tokenB")
          .disable.mt-3.mb-2 Fee Tier
          CommissionSelect(:selected="feeAmount" :options="fees" @change="v => feeAmount = v")

          .fs-16.disable.mt-3(v-mutted="!price") Deposit
            PoolTokenInput(:token="tokenA" v-model="amountA" @input="onInputAmountA" :disabled="depositADisabled" :locked="true" label="Token 1").mt-2
            PoolTokenInput(:token="tokenB" v-model="amountB" @input="onInputAmountB" :disabled="depositBDisabled" :locked="true" label="Token 2").mt-3

          AuthOnly.mt-3.w-100
            AlcorButton.submit(@click='submit',:class='{ disabled: false }',:disabled='false') Add liquidity

      .section(v-mutted="!tokenA || !tokenB")
        template(v-if="!pool")
          .d-flex.flex-column.gap-10
            .fs-16.disable Set Starting Price
            InfoContainer.info-container(:access="true")
              | This pool must be initialized before you can add liquidity.
              | To initialize, select a starting price for the pool.
              | Then, enter your liquidity price range and deposit amount.
              | Gas fees will be higher than usual due to the initialization transaction.

            el-input.starting-price-input(placeholder="0" v-model="startPriceTypedValue")

            InfoContainer.price-info-container
              .d-flex.justify-content-between
                .fs-16 Current {{ tokenA ? tokenA.symbol : '' }} price
                .fs-16.disable(v-if="price") {{ invertPrice ? price.invert().toSignificant(5) : price.toSignificant(5)  + ' ' + (tokenB ? tokenB.symbol : '') }}
                .fs-16.disable(v-else) -

        template(v-else)
          LiquidityChartRangeInput(
            v-if="pool"
            :tokenA="tokenA || undefined"
            :tokenB="tokenB || undefined"
            :feeAmount="feeAmount"
            :priceLower="priceLower"
            :priceUpper="priceUpper"
            :ticksAtLimit="ticksAtLimit"
            :price="price ? parseFloat((invertPrice ? price.invert() : price).toSignificant(6)) : undefined"
            @onLeftRangeInput="onLeftRangeInput"
            @onRightRangeInput="onRightRangeInput"
            chartTitle="Set Price Range"
            :interactive="interactive")

              template(#afterZoomIcons)
               AlcorSwitch(
                v-if='tokenA && tokenB',
                @toggle='toggleTokens',
                :one='invertPrice ? tokenB.symbol : tokenA.symbol',
                :two='invertPrice ? tokenA.symbol : tokenB.symbol',
                :active='invertPrice ? "two" : "one"'
              )

        .pre-defined-ranges.mt-2(v-mutted="!price")
          AlcorButton.item(bordered v-for="{ text } in priceRangeItems" @click="onPreDefinedRangeSelect") {{text}}

        .d-flex.gap-8.mt-2.justify-content-center
          InputStepCounter(
            :value="leftRangeValue"
            @change="onLeftRangeInput"
            :decrement="isSorted ? decrementLower : incrementUpper"
            :increment="isSorted ? incrementLower : decrementUpper"
            :disabled="!price && !startPriceTypedValue"
            :hasError="tickLower >= tickUpper"
          )
            template(#top) Min Price
            template
              .pair-names.mb-1(v-if="tokenA && tokenB") {{tokenA.symbol}} per {{tokenB.symbol}}
              .info.disable(v-if="tokenB") Your position will be 100% composed of {{tokenB.symbol}} at this price

          InputStepCounter(
            :value="rightRangeValue"
            @change="onRightRangeInput"
            :decrement="isSorted ? decrementUpper : incrementLower"
            :increment="isSorted ? incrementUpper : decrementLower"
            :disabled="!price && !startPriceTypedValue"
            :hasError="tickLower >= tickUpper"
          )
            template(#top) Max Price
            template
              .pair-names.mb-1(v-if="tokenA && tokenB") {{tokenA.symbol}} per {{tokenB.symbol}}
              .info.disable(v-if="tokenB") Your position will be 100% composed of {{tokenB.symbol}} at this price
  // TODO ROUTES MANAGEMENT
  nuxt-child

</template>

<script>
import { mapActions, mapState, mapGetters } from 'vuex'
import { asset } from 'eos-common'


import AlcorButton from '~/components/AlcorButton'
import AlcorContainer from '~/components/AlcorContainer'

import SelectToken from '~/components/modals/amm/SelectToken'
import PoolTokenInput from '~/components/amm/PoolTokenInput'
import LiquidityChartRangeInput from '~/components/amm/range'
import Zoom from '~/components/amm/range/Zoom'
import CommissionSelect from '~/components/amm/CommissionSelect'
import InputStepCounter from '~/components/amm/InputStepCounter'
import InfoContainer from '~/components/UI/InfoContainer'
import AuthOnly from '~/components/AuthOnly'
import AlcorSwitch from '~/components/AlcorSwitch'
import AlcorRadio from '~/components/AlcorRadio'
import PageHeader from '~/components/amm/PageHeader'

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
  TickMath, Rounding, priceToClosestTick, tickToPrice
} from '~/assets/libs/swap-sdk'

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10000)

export default {
  components: {
    SelectToken,
    PoolTokenInput,
    AlcorButton,
    AlcorContainer,
    LiquidityChartRangeInput,
    InputStepCounter,
    CommissionSelect,
    InfoContainer,
    AuthOnly,
    AlcorSwitch,
    Zoom,
    AlcorRadio,
    PageHeader
  },

  // Enabling managige route in nested component
  fetch({ route, redirect }) {
    if (route.path == '/add-liquidity') redirect('/add-liquidity/')
  },

  data() {
    return {
      amountA: '',
      amountB: '',

      //feeAmountFromUrl: FeeAmount.,

      startPriceTypedValue: null,

      leftRangeTypedValue: '',
      rightRangeTypedValue: '',

      fees: [
        { value: FeeAmount.LOW, desc: 'Best forvery high liquidity tokens', selectedPercent: 0 },
        { value: FeeAmount.MEDIUM, desc: 'Best for most pairs', selectedPercent: 44 },
        { value: FeeAmount.HIGH, desc: 'Best for low liqudity pairs', selectedPercent: 56 }
      ],

      // TODO: better variable naming?
      priceRangeValue: '',
      priceRangeItems: [
        { text: 'Inifinity Range', higherValue: 'infinity', lowerValue: 'infinity' },
        { text: '+/-5%', higherValue: '5', lowerValue: '5' },
        { text: '+/-10&', higherValue: '10', lowerValue: '10' },
        { text: '+10/-2%', higherValue: '10', lowerValue: '2' },
        { text: '+2/-10%', higherValue: '2', lowerValue: '10' },
      ].map((item) => {
        return { ...item, value: `${item.higherValue}-${item.lowerValue}` }
      })
    }
  },

  watch: {
    feeAmount(val) {
      if (!this.pool) {
        this.leftRangeTypedValue = ''
        this.rightRangeTypedValue = ''
      }
    }
  },

  computed: {
    ...mapState(['user', 'network']),
    ...mapGetters('amm', ['slippage']),
    ...mapGetters('amm/liquidity', [
      'tokenA',
      'tokenB',
      'tokens',
      'pool',
      'invertPrice',
      'isSorted',
      'sortedA',
      'sortedB'
    ]),

    feeAmount: {
      get() {
        return this.$store.state.amm.liquidity.feeAmount
      },

      set(val) {
        this.$store.commit('amm/liquidity/setFeeAmount', val)
      }
    },

    leftRangeValue() {
      const { isSorted, ticksAtLimit, priceLower, priceUpper } = this
      const price = isSorted ? priceLower : priceUpper?.invert()
      return ticksAtLimit[isSorted ? 'LOWER' : 'UPPER'] ? '0' : price?.toSignificant(5) ?? ''
    },

    rightRangeValue() {
      const { isSorted, ticksAtLimit, priceUpper, priceLower } = this
      const price = isSorted ? priceUpper : priceLower?.invert()
      return ticksAtLimit[isSorted ? 'UPPER' : 'LOWER'] ? '∞' : price?.toSignificant(5) ?? ''
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
      const { sortedA, sortedB, position, invertPrice, tickSpaceLimits, feeAmount, rightRangeTypedValue, leftRangeTypedValue } = this

      // Initates initial prices for inputs(using event from crart based on mask bounds)
      return {
        LOWER:
          typeof position?.tickLower === 'number'
            ? position.tickLower
            : (invertPrice && typeof rightRangeTypedValue === 'boolean') || // если тру то это фулл-рэнж
              (!invertPrice && typeof leftRangeTypedValue === 'boolean')
              ? tickSpaceLimits.LOWER
              : invertPrice
                ? tryParseTick(sortedB, sortedA, feeAmount, rightRangeTypedValue.toString())
                : tryParseTick(sortedA, sortedB, feeAmount, leftRangeTypedValue.toString()),

        UPPER:
          typeof position?.tickUpper === 'number'
            ? position.tickUpper
            : (!invertPrice && typeof rightRangeTypedValue === 'boolean') ||
              (invertPrice && typeof leftRangeTypedValue === 'boolean')
              ? tickSpaceLimits.UPPER
              : invertPrice
                ? tryParseTick(sortedB, sortedA, feeAmount, leftRangeTypedValue.toString())
                : tryParseTick(sortedA, sortedB, feeAmount, rightRangeTypedValue.toString())
      }
    },

    price() {
      const { sortedA, sortedB, noLiquidity, startPriceTypedValue, invertPrice, pool } = this

      if (noLiquidity) {
        // if no liquidity use typed value
        const parsedQuoteAmount = tryParseCurrencyAmount(startPriceTypedValue, invertPrice ? sortedA : sortedB)
        if (parsedQuoteAmount && sortedA && sortedB) {
          const baseAmount = tryParseCurrencyAmount('1', invertPrice ? sortedB : sortedA)
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
        return pool && sortedA ? pool.priceOf(sortedA) : undefined
      }
    },

    pricesAtTicks() {
      const { sortedA, sortedB, ticks: { LOWER, UPPER } } = this

      return {
        LOWER: getTickToPrice(sortedA, sortedB, LOWER),
        UPPER: getTickToPrice(sortedA, sortedB, UPPER)
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

    invalidPrice() {
      return isPriceInvalid(this.price)
    },

    outOfRange() {
      const { invalidRange, price, priceLower, priceUpper } = this

      return Boolean(
        !invalidRange &&
        price &&
        priceLower &&
        priceUpper &&
        (price.lessThan(priceLower) || price.greaterThan(priceUpper))
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
      const { tokenA, tokenB, feeAmount, price, invalidPrice, isSorted } = this

      if (tokenA && tokenB && feeAmount && price && !invalidPrice) {
        const tickCurrent = priceToClosestTick(price)
        const sqrtPriceX64 = TickMath.getSqrtRatioAtTick(tickCurrent)

        return new Pool({
          tokenA: isSorted ? tokenA : tokenB,
          tokenB: isSorted ? tokenB : tokenA,
          fee: feeAmount,
          sqrtPriceX64,
          tickCurrent,
          liquidity: 0,
          ticks: []
        })
      }

      return undefined
    },

    depositADisabled() {
      const { invalidRange, mockPool, tickLower, tickUpper, tokenA } = this

      return invalidRange || Boolean(
        (typeof tickUpper === 'number' && mockPool && mockPool.tickCurrent >= tickUpper && mockPool.tokenA.equals(tokenA)) ||
        (typeof tickLower === 'number' && mockPool && mockPool.tickCurrent <= tickLower && mockPool.tokenB.equals(tokenA))
      )
    },

    depositBDisabled() {
      const { invalidRange, mockPool, tickLower, tickUpper, tokenB } = this

      return invalidRange || Boolean(
        (typeof tickUpper === 'number' && mockPool && mockPool.tickCurrent >= tickUpper && mockPool.tokenA.equals(tokenB)) ||
        (typeof tickLower === 'number' && mockPool && mockPool.tickCurrent <= tickLower && mockPool.tokenB.equals(tokenB))
      )
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
      this.onInputAmountA(this.amountA)
    },

    init() {

      //this.parseUrlParams()
      //this.checkPosition()

      //this.tokenA = this.tokens[1]
      //this.tokenB = this.tokens[2]
    },

    onInputAmountA(value) {
      if (!value) return this.amountB = null
      const dependentAmount = this.getDependedAmount(value, 'CURRENCY_A')
      if (dependentAmount) {
        this.amountB = dependentAmount.toFixed()
        console.log(dependentAmount.toFixed(undefined, undefined, Rounding.ROUND_UP), dependentAmount.toFixed())
      }
    },

    onInputAmountB(value) {
      const dependentAmount = this.getDependedAmount(value, 'CURRENCY_B')
      if (dependentAmount) this.amountA = dependentAmount.toFixed(undefined, undefined, Rounding.ROUND_DOWN)
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

        // TODO Hmm работает хорошо в !isSorted
        const position = independentAmount.currency.equals(pool.tokenA)
          ? Position.fromAmountA({
            pool,
            tickLower,
            tickUpper,
            amountA: independentAmount.quotient,

            // TODO Check it in SDK
            //useFullPrecision: true // we want full precision for the theoretical position
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

    // TODO RESET ON POOL CHANGE
    //const handleFeePoolSelect = useCallback(
    //  (newFeeAmount: FeeAmount) => {
    //    onLeftRangeInput('')
    //    onRightRangeInput('')
    //    navigate(`/add/${currencyIdA}/${currencyIdB}/${newFeeAmount}`)
    //  },
    //  [currencyIdA, currencyIdB, navigate, onLeftRangeInput, onRightRangeInput]
    //)

    onLeftRangeInput(value) {
      this.leftRangeTypedValue = value // To trigger computed to calc price and after update with corrected

      this.onInputAmountB(this.amountB)
    },

    onRightRangeInput(value) {
      //if (value === undefined) return

      this.rightRangeTypedValue = value
      this.onInputAmountA(this.amountA)
    },

    setTokenA(token) {
      this.$store.dispatch('amm/liquidity/setTokenA', token)
    },

    setTokenB(token) {
      this.$store.dispatch('amm/liquidity/setTokenB', token)
    },

    async submit() {
      try {
        const poolId = await this.addLiquidity()
        //this.$router.push('/positions/my-positions')
        this.$store.dispatch('amm/poolUpdate', poolId)
        this.$store.dispatch('amm/fetchPositions')
      } catch (e) {
        console.log(e)
        this.$notify({ title: 'Market creation', message: e.message, type: 'error' })
      }
    },

    async addLiquidity() {
      // TODO Fix one side deposit
      const {
        isSorted, sortedA, sortedB, tokenA, tokenB, tickLower, tickUpper, noLiquidity,
        mockPool, depositADisabled, depositBDisabled, slippage, amountA, amountB
      } = this

      console.log({ depositADisabled, depositBDisabled })

      const tokenADesired = tryParseCurrencyAmount((isSorted ? amountA : amountB) || '0', isSorted ? tokenA : tokenB)
      const tokenBDesired = tryParseCurrencyAmount((isSorted ? amountB : amountA) || '0', isSorted ? tokenB : tokenA)

      const tokenAMin = tokenADesired.multiply(new Percent(1).subtract(slippage))
      const tokenBMin = tokenBDesired.multiply(new Percent(1).subtract(slippage))

      const tokenAZero = tokenAMin.multiply(0)
      const tokenBZero = tokenBMin.multiply(0)

      const actions = []

      let poolId = this.pool?.id

      if (noLiquidity) {
        // Fetch last pool just to predict new created pool id
        try {
          const { rows: [{ id }] } = await this.$rpc.get_table_rows({
            code: this.network.amm.contract,
            scope: this.network.amm.contract,
            table: 'pools',
            limit: 1,
            reverse: true
          })

          poolId = id + 1
        } catch (e) {
          try {
            const { rows } = await this.$rpc.get_table_rows({
              code: this.network.amm.contract,
              scope: this.network.amm.contract,
              table: 'pools',
            })
            if (rows.length == 0) { poolId = 0 } else { throw e }
          } catch (e) {
            throw e
          }
        }

        actions.push({
          account: this.network.amm.contract,
          name: 'createpool',
          authorization: [this.user.authorization],
          data: {
            account: this.$store.state.user.name,
            tokenA: { contract: sortedA.contract, quantity: tokenAZero.toAsset() },
            tokenB: { contract: sortedB.contract, quantity: tokenBZero.toAsset() },
            sqrtPriceX64: mockPool.sqrtPriceX64.toString(),
            fee: this.feeAmount
          }
        })
      }

      if (!depositADisabled)
        actions.push({
          account: sortedA.contract,
          name: 'transfer',
          authorization: [this.user.authorization],
          data: {
            from: this.user.name,
            to: this.network.amm.contract,
            quantity: tokenADesired.toAsset(),
            memo: 'deposit'
          }
        })

      if (!depositBDisabled)
        actions.push(
          {
            account: sortedB.contract,
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

      actions.push(
        {
          account: this.network.amm.contract,
          name: 'addliquid',
          authorization: [this.user.authorization],
          data: {
            poolId,
            owner: this.user.name,
            tokenADesired: (depositADisabled ? tokenAZero : tokenADesired).toAsset(),
            tokenBDesired: (depositBDisabled ? tokenBZero : tokenBDesired).toAsset(),
            tickLower,
            tickUpper,
            tokenAMin: (depositADisabled ? tokenAZero : tokenAMin).toAsset(),
            tokenBMin: (depositBDisabled ? tokenBZero : tokenBMin).toAsset(),
            deadline: 0
          }
        }
      )

      console.log({ actions })

      const r = await this.$store.dispatch('chain/sendTransaction', actions)
      console.log({ r })

      return poolId
    },

    decrementLower() {
      const { tokenA, tokenB, tickLower, feeAmount } = this

      const pool = this.pool || this.mockPool

      if (tokenA && tokenB && typeof tickLower === 'number' && feeAmount) {
        const newPrice = tickToPrice(tokenA, tokenB, tickLower - TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }

      // use pool current tick as starting tick if we have pool but no tick input
      if (!(typeof tickLower === 'number') && tokenA && tokenB && feeAmount && pool) {
        const newPrice = tickToPrice(tokenA, tokenB, pool.tickCurrent - TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }
      return ''
    },

    incrementLower() {
      const { tokenA, tokenB, tickLower, feeAmount } = this

      const pool = this.pool || this.mockPool

      if (tokenA && tokenB && typeof tickLower === 'number' && feeAmount) {
        const newPrice = tickToPrice(tokenA, tokenB, tickLower + TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }
      // use pool current tick as starting tick if we have pool but no tick input
      if (!(typeof tickLower === 'number') && tokenA && tokenB && feeAmount && pool) {
        const newPrice = tickToPrice(tokenA, tokenB, pool.tickCurrent + TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }
      return ''
    },

    decrementUpper() {
      const { tokenA, tokenB, tickUpper, feeAmount } = this

      const pool = this.pool || this.mockPool

      if (tokenA && tokenB && typeof tickUpper === 'number' && feeAmount) {
        const newPrice = tickToPrice(tokenA, tokenB, tickUpper - TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }
      // use pool current tick as starting tick if we have pool but no tick input
      if (!(typeof tickUpper === 'number') && tokenA && tokenB && feeAmount && pool) {
        const newPrice = tickToPrice(tokenA, tokenB, pool.tickCurrent - TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }
      return ''
    },

    incrementUpper() {
      const { tokenA, tokenB, tickUpper, feeAmount } = this

      const pool = this.pool || this.mockPool

      if (tokenA && tokenB && typeof tickUpper === 'number' && feeAmount) {
        const newPrice = tickToPrice(tokenA, tokenB, tickUpper + TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }
      // use pool current tick as starting tick if we have pool but no tick input
      if (!(typeof tickUpper === 'number') && tokenA && tokenB && feeAmount && pool) {
        const newPrice = tickToPrice(tokenA, tokenB, pool.tickCurrent + TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }
      return ''
    },
    onPreDefinedRangeSelect(range) {

    }

    // TODO
    // getSetFullRange() {
    //   dispatch(setFullRange())
    // }
  },
}
</script>

<style lang="scss">
.add-liquidity-component {
  padding: 14px !important;
  .main-section{
    display: flex;
    gap: 18px;
    .section{
      flex: 1;
    }
  }
  .submit {
    width: 100%;
    padding: 10px 18px;
    background: var(--border-active-color);
    color: #000;
    border-radius: 8px;
    font-weight: 500;
    &:hover {
      background: var(--main-green) !important;
    }
    &.disabled {
      background: var(--btn-default);
      position: none;
      opacity: 0.8;
      color: #636366;
    }
  }
  .info-container{
    background: var(--selector-bg) !important;
  }
  .starting-price-input{
    input{
      border-radius: 6px;
      background: transparent;
      border: 1px solid var(--border-2-color);
      &:hover, &:focus{
        border-color: var(--light-border-color);
      }
    }
  }
  .price-info-container{
    padding: 8px 15px !important;
  }
}
.sustom-select-token {
  flex: 1;
  .select-token-button{
    flex: 1;
  }
}
.chart-header{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.current-price{
  display: flex;
  justify-content: center;
}
.pre-defined-ranges{
  display: flex;
  white-space: nowrap;
  justify-content: space-between;
  .item{
    padding: 2px 6px;
    font-size: 0.86rem;
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
