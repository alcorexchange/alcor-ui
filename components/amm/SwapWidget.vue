<template lang="pug">
.d-flex.justify-content-center.flex-column
  alcor-container.swap-widget
    .d-flex.justify-content-between.align-items-center.p-1
      .d-flex.align-items-center.gap-16
        .fs-18 {{ $t('Swap') }}
        NuxtLink.navigation(:to="localeRoute('/positions')").fs-18.disable {{ $t('Pool') }}

      .d-flex.gap-2.align-items-center
        AlcorButton(v-show="!recalculateOnPriceChange" iconOnly flat).p-0
          i.el-icon-refresh.pointer.fs-18(@click="recalculate")
        AlcorButton(iconOnly flat).p-0
          i.el-icon-data-analysis.pointer.fs-18(@click="$emit('onChartClick')")
        Settings(:swapPage="true")

    PoolTokenInput.mt-2(
      :label="$t('Sell')"
      :token="tokenA"
      :tokens="tokens"
      v-model="amountA"
      @input="onTokenAInput"
      @tokenSelected="setTokenA"
      :show-max-button="false"
    )

    .w-100.position-relative
      .d-flex.align-items-center.justify-content-center.position-absolute.w-100.z-1.arrow-pos
        .bottom-icon(@click="toggleTokens")
          i.el-icon-bottom.text-center.fs-20.pointer(v-mutted="loading")

    PoolTokenInput.mt-1(
      :label="$t('Buy')"
      :token="tokenB"
      :tokens="tokens"
      v-model="amountB"
      @input="onTokenBInput"
      @tokenSelected="setTokenB"
    )

    alcor-container.info-container.mt-2(:alternative="true" v-if="tokenA && tokenB && (amountA || amountB)")
      el-collapse(:value="routerCollapse").default
        el-collapse-item(name="1")
          template(#title)
            .rate-container(@click.prevent.stop="onRateClick")
              .d-flex.align-items-center.gap-8.py-1(v-if="loading")
                i.el-icon-refresh.rotate-reverse.h-fit
                .fs-12.disable {{ $t('Fetching Best price...') }}
              .d-flex.align-items-center.gap-8.py-1(v-else)
                .disable.fs-12 {{ $t('Rate') }}
                .d-flex.gap-4
                  .fs-12 {{ rate }} {{ rateInverted ? tokenA.symbol : tokenB.symbol }} per {{ rateInverted ? tokenB.symbol : tokenA.symbol}}
                  .fs-12.disable ({{$tokenToUSD(1, rateInverted ? tokenB.symbol : tokenA.symbol, rateInverted ? tokenB.contract : tokenA.contract)}}$)
          .d-flex.flex-column.gap-4
            .d-flex.justify-content-between.align-items-center
              .fs-12.disable {{ $t('Expected Output') }}
              vue-skeleton-loader(
                v-if='loading'
                :width='52',
                :height='14',
                animation='wave',
                wave-color='rgba(150, 150, 150, 0.1)',
                :rounded='true',
              )
              .fs-12(v-else) {{ expectedOutput ? expectedOutput : '0.0000 ' + tokenB.symbol }}
          .d-flex.flex-column.gap-4
            .d-flex.justify-content-between.align-items-center
              .fs-12.disable {{ $t('Price Impact') }}
              vue-skeleton-loader(
                v-if='loading'
                :width='52',
                :height='14',
                animation='wave',
                wave-color='rgba(150, 150, 150, 0.1)',
                :rounded='true',
              )
              .price-impact.fs-12(v-else :style="priceImpactStyle && { color: `var(--main-${priceImpactStyle})` }") {{ priceImpact }}%

          .d-flex.flex-column.gap-4
            .d-flex.justify-content-between.align-items-center(v-if="lastField == 'input'")
              .fs-12.disable {{ $t('Minimum Received after slippage') }}
              vue-skeleton-loader(
                v-if='loading'
                :width='52',
                :height='14',
                animation='wave',
                wave-color='rgba(150, 150, 150, 0.1)',
                :rounded='true',
              )
              .fs-12(v-else) {{ minReceived }} {{ tokenB.symbol }} ({{ slippage.toFixed() }}%)

            .d-flex.justify-content-between.align-items-center(v-else)
              .fs-12.disable Maximum Send after slippage
              vue-skeleton-loader(
                v-if='loading'
                :width='52',
                :height='14',
                animation='wave',
                wave-color='rgba(150, 150, 150, 0.1)',
                :rounded='true',
              )
              .fs-12(v-else) {{ maximumSend }} {{ tokenA.symbol }} ({{ slippage.toFixed() }}%)

          // TODO PROVIDER FEE
          //- .d-flex.flex-column.gap-4
          //-   .d-flex.justify-content-between.align-items-center
          //-     .fs-12.disable Network fee
          //-     vue-skeleton-loader(
          //-       v-if='loading'
          //-       :width='52',
          //-       :height='14',
          //-       animation='wave',
          //-       wave-color='rgba(150, 150, 150, 0.1)',
          //-       :rounded='true',
          //-     )
          //-     .fs-12(v-else) 0.00

          alcor-container.mt-2(v-if="swaps")
            el-collapse.default.multiroute
              el-collapse-item
                template(#title)
                  .d-flex.justify-content-between.align-items-center.w-100.p-1
                    .d-flex.gap-8.color-action.align-items-center
                      i.el-icon-connection
                      .fs-12 {{ $t('Multiroute') }}

                    i.el-icon-plus
                .p-1
                  SwapRoute(:tokenA="tokenA" :tokenB="tokenB" :swaps="swaps")
    AuthOnly.w-100.mt-2
      AlcorButton.w-100.submit(@click="submit" big access :disabled="!canSubmit || loading" :class="{ disabled: !canSubmit }") {{ renderSubmitText }}
  RandomBanner(
    v-if="!hideBanner"
    :banners="banners"
  )
</template>

<script>
// TODO DEBOUINCE FOR INPUTS
// https://stackoverflow.com/questions/42199956/how-to-implement-debounce-in-vue2

import { Price } from '@alcorexchange/alcor-swap-sdk'

import { debounce } from 'lodash'
import VueSkeletonLoader from 'skeleton-loader-vue'
import { mapState, mapActions, mapGetters } from 'vuex'
import AlcorContainer from '~/components/AlcorContainer'
import ReturnLink from '~/components/ReturnLink'
import AlcorCollapse from '~/components/AlcorCollapse'
import AlcorButton from '~/components/AlcorButton'
import PoolTokenInput from '~/components/amm/PoolTokenInput'
import Settings from '~/components/amm/Settings'
import SwapRoute from '~/components/swap/SwapRoute'
import { parseToken, tryParseCurrencyAmount, constructPoolInstance } from '~/utils/amm'
import { getPrecision } from '~/utils'
import AuthOnly from '~/components/AuthOnly'
import RandomBanner from '~/components/alcor-element/RandomBanner'

let lastOutputPromise
let lastInputPromise

export default {
  name: 'SwapWidget',

  props: ['hideBanner'],

  components: {
    AlcorContainer,
    ReturnLink,
    AlcorCollapse,
    AlcorButton,
    PoolTokenInput,
    Settings,
    SwapRoute,
    VueSkeletonLoader,
    AuthOnly,
    RandomBanner
  },

  data: () => ({
    loading: false,
    amountA: null,
    amountB: null,
    details: ['1'], // Details are open by default

    priceInverted: '0.00',
    price: '0.00',

    priceImpact: '0.00',
    minReceived: 0,
    maximumSend: 0,
    expectedInput: null,
    expectedOutput: null,
    route: null,
    swaps: null,

    memo: '', // Used for swap
    market: null,
    routerCollapse: ['1'],
    lastField: 'input', // might be input/output

    // Event listener
    swapListener: null,

    rateInverted: false,
    banners: [
      {
        link: 'https://www.wuffi.io/',
        image: require('@/assets/images/swap-banner-1.jpg'),
        colors: [
          'rgba(78,24,168,0.2)',
          'rgba(230,145,54, 1)',
          'rgba(35,216,186,1)',
        ],
      },
      // {
      //   link: 'https://machiavellic.io/season-0-1/',
      //   image: require('@/assets/images/swap-banner-2.gif'),
      //   colors: [
      //     'rgba(177,14,20,0.2)',
      //     'rgba(224,193,131,1)',
      //     'rgba(225,103,51, 1)',
      //   ],
      // },
    ]
  }),

  fetch() {
    // fetch has access to `this`
    const { input, output, only, market } = this.$route.query

    if (input) {
      this.$store.commit('amm/swap/setInput', input.toLowerCase())
    }

    if (output) {
      this.$store.commit('amm/swap/setOutput', output.toLowerCase())
    }

    if (only) {
      const tokens = only.toLowerCase().split(',')
      this.$store.commit('amm/swap/setOnly', tokens)
    }

    if (market) {
      this.market = market
    }

    this.$store.dispatch('amm/swap/setDefaultInputOutput')
  },

  mounted() {
    this.swapListener = this.$socket.on('swap:pool:update', data => {
      if (!this.tokenA || !this.tokenB || !this.recalculateOnPriceChange) return

      for (const pool of data) {
        const tokenA = parseToken(pool.tokenA)
        const tokenB = parseToken(pool.tokenB)

        if (
          (this.tokenA.equals(tokenA) && this.tokenB.equals(tokenB)) ||
          (this.tokenA.equals(tokenB) && this.tokenB.equals(tokenA))
        ) {
          this.recalculateDelayed()
        }
      }
    })
  },

  beforeDestroy() {
    this.$socket.off('swap:pool:update', this.swapListener)
  },

  computed: {
    rate() {
      const { rateInverted, price, priceInverted } = this

      return rateInverted ? priceInverted : price
    },

    priceImpactStyle() {
      const impact = parseFloat(this.priceImpact.replace('%', ''))
      if (impact < 0) return 'red'
      if (impact <= 3) return 'green'
      if (impact <= 5) return 'yellow'
      return 'red'
    },

    renderSubmitText() {
      if (!this.tokenA || !this.tokenB) return this.$t('Select Tokens')
      else if (!this.amountA || !this.amountB) return this.$t('Enter Amounts')
      else return this.$t('Swap A To B', { A: this.tokenA.symbol, B: this.tokenB.symbol })
    },

    canSubmit() {
      return this.tokenA && this.tokenB && this.amountA && this.amountB
    },
    ...mapState(['user', 'network']),
    ...mapState('amm', ['maxHops', 'pools', 'recalculateOnPriceChange']),
    ...mapGetters('amm', ['slippage']),
    ...mapGetters('amm/swap', [
      'tokenA',
      'tokenB',
      'tokens',
      'isSorted',
      'sortedA',
      'sortedB'
    ]),
  },

  watch: {
    tokenA(token) {
      setTimeout(() => {
        const currentQuery = this.$route.query
        this.$router.replace(
          this.localeRoute({
            query: {
              ...currentQuery,
              input: token ? `${token.symbol}-${token.contract}` : undefined
            }
          })
        ).catch((e) => {})
      }, 0)
    //   this.$store.dispatch('amm/swap/subscribeToCurrentPairPoolsUpdates')
    },

    tokenB(token) {
      setTimeout(() => {
        const currentQuery = this.$route.query
        this.$router.replace(
          this.localeRoute({
            query: {
              ...currentQuery,
              output: token ? `${token.symbol}-${token.contract}` : undefined
            }
          })
        ).catch((e) => {})
      }, 0)
    //   this.$store.dispatch('amm/swap/subscribeToCurrentPairPoolsUpdates')
    },

    maxHops() {
      this.recalculate()
    },

    'user.name'() {
      this.reset()
    },

    slippage() {
      this.recalculateDelayed()
    }
  },

  methods: {
    ...mapActions('amm/swap', [
      'bestTradeExactIn',
      'bestTradeExactOut'
    ]),

    recalculateDelayed() {
      if (this.loading) return

      this.loading = true
      this.lastField == 'input' ? this.onTokenAInput(this.amountA) : this.onTokenBInput(this.amountB)
    },

    recalculate() {
      if (this.loading) return

      this.loading = true
      this.lastField == 'input' ? this.calcOutput(this.amountA) : this.calcInput(this.amountB)
    },

    toggleTokens() {
      if (this.loading) return

      const amountB_before = this.amountB

      this.reset()

      this.lastField = 'input'
      this.$store.dispatch('amm/swap/flipTokens')
      this.amountA = amountB_before

      if (parseFloat(this.amountA)) this.calcOutput(this.amountA)
    },

    setTokenA(token) {
      if (this.tokenB && token.equals(this.tokenB)) {
        if (this.tokenA) {
          this.toggleTokens()
        } else {
          this.$store.dispatch('amm/swap/setTokenB', null)
        }
      }
      this.$store.dispatch('amm/swap/setTokenA', token)

      this.reset()

      if (this.tokenA && this.tokenB) this.calcOutput(this.amountA)
    },

    setTokenB(token) {
      if (this.tokenA && token.equals(this.tokenA)) {
        if (this.tokenB) {
          this.toggleTokens()
        } else {
          this.$store.dispatch('amm/swap/setTokenA', null)
        }
      }

      this.$store.dispatch('amm/swap/setTokenB', token)

      this.reset()

      if (this.tokenA && this.tokenB) this.calcOutput(this.amountA)
    },

    reset({ amountA = null, amountB = null } = {}) {
      this.loading = false
      this.amountA = amountA
      this.amountB = amountB

      this.priceInverted = '0.00'
      this.price = '0.00'

      this.priceImpact = '0.00'
      this.minReceived = 0
      this.maximumSend = 0
      this.expectedInput = null
      this.expectedOutput = null
      this.route = null
      this.swaps = null

      this.memo = ''
    },

    async submit() {
      try {
        await this.swap()
        this.reset()
        this.updateBalances()
        return this.$notify({ type: 'success', title: 'Swap', message: 'Swap completed successfully' })
      } catch (e) {
        console.log(e)
        return this.$notify({ type: 'error', title: 'Swap Error', message: e.message })
      }
    },

    updateBalances() {
      const { tokenA, tokenB } = this

      setTimeout(() => {
        this.$store.dispatch('updateBalance', tokenA, { root: true })
        this.$store.dispatch('updateBalance', tokenB, { root: true })
      }, 1000)
    },

    async swap() {
      const { expectedInput, maximumSend, tokenA, tokenB, market } = this
      if (!tokenA || !tokenB) return console.log('no tokens selected')

      const exactIn = this.lastField == 'input'

      console.log({ exactIn, expectedInput, maximumSend, tokenA })
      const currencyAmountIn = tryParseCurrencyAmount((exactIn ? parseFloat(expectedInput) : parseFloat(maximumSend)).toFixed(tokenA.decimals), tokenA)

      if (!currencyAmountIn) throw new Error('Invalid currency in: ', currencyAmountIn?.toAsset())

      const actions = []

      for (let { memo, input } of this.swaps) {
        memo = memo.replace('<receiver>', this.user.name)

        if (market) {
          memo += `#${market}`
        }

        actions.push({
          account: tokenA.contract,
          name: 'transfer',
          authorization: [this.user.authorization],
          data: {
            from: this.user.name,
            to: this.network.amm.contract,
            quantity: input,
            memo
          }
        })
      }

      const r = await this.$store.dispatch('chain/sendTransaction', actions)

      this.$gtag.event('swap', { chain: this.network.name })

      console.log('SWAP: ', r)
    },

    onTokenAInput(val) {
      this.amountB = null
      this.lastField = 'input'
      if (parseFloat(val)) this.calcOutputDebounced(val)
    },

    onTokenBInput(val) {
      this.amountA = null
      this.lastField = 'output'
      if (parseFloat(val)) this.calcInputDebounced(val)
    },

    calcInputDebounced: debounce(function(value) {
      this.calcInput(value)
    }, 600),

    calcOutputDebounced: debounce(function(value) {
      this.calcOutput(value)
    }, 600),

    async calcInput(value) {
      if (!parseFloat(value)) return

      try {
        this.loading = true
        await this.tryCalcInput(value)
      } catch (e) {
        this.reset({ amountB: this.amountB })
        console.error('calcInput', e)
        const reason = e?.response?.data ? e?.response?.data : e.message
        this.$notify({ type: 'error', title: 'Input Calculation', message: reason })
      }
    },

    tryCalcInput(value) {
      const { tokenA, tokenB, slippage } = this

      if (!value || isNaN(value) || !tokenA || !tokenB) return this.amountA = null

      if (getPrecision(value) > tokenA.decimals) {
        const [num, fraction] = value.split('.')
        value = `${num}.${fraction.slice(0, tokenB.decimals)}`
      }

      const currencyAmountOut = tryParseCurrencyAmount(value, tokenB)
      if (!currencyAmountOut) return this.amountA = null

      return new Promise((resolve, reject) => {
        const currentPromise = this.$axios('/v2/swapRouter/getRoute', {
          params: {
            trade_type: 'EXACT_OUTPUT',
            input: tokenA.id,
            output: tokenB.id,
            amount: currencyAmountOut.toFixed(),
            slippage: slippage.toFixed(),
            receiver: this.user?.name,
            maxHops: this.maxHops,
            v2: true
          }
        }).then(r => {
          if (currentPromise !== lastOutputPromise) {
            resolve()
            return console.log('NOT CURRENT RESPONCE')
          }

          const { data: { executionPrice, input, maxSent, memo, output, priceImpact, route, swaps } } = r

          const price = new Price(tokenA, tokenB, executionPrice.denominator, executionPrice.numerator)

          this.priceInverted = executionPrice.numerator == 0 ? '0' : price.invert().toSignificant(6)
          this.price = executionPrice.numerator == 0 ? '0' : price.toSignificant(6)

          this.memo = memo
          this.swaps = swaps
          this.amountA = input
          this.expectedInput = input
          this.expectedOutput = output
          this.priceImpact = priceImpact
          this.route = { pools: route.map(poolId => constructPoolInstance(this.pools.find(p => p.id == poolId))), input: tokenA, output: tokenB }
          this.maximumSend = maxSent

          this.loading = false
          resolve()
        }).catch(e => {
          if (currentPromise !== lastOutputPromise) {
            resolve()
            return console.log('NOT CURRENT RESPONCE')
          }

          this.loading = false
          reject(e)
        })

        lastOutputPromise = currentPromise
      })
    },

    async calcOutput(value) {
      if (!parseFloat(value)) return

      try {
        this.loading = true
        await this.tryCalcOutput(value)
      } catch (e) {
        this.reset({ amountA: this.amountA })
        console.error('calcOutput', e)
        const reason = e?.response?.data ? e?.response?.data : e.message
        this.$notify({ type: 'error', title: 'Output Calculation', message: reason })
      }
    },

    tryCalcOutput(value) {
      const { tokenA, tokenB, slippage } = this

      if (!value || isNaN(value) || !tokenA || !tokenB) return this.amountB = null

      if (getPrecision(value) > tokenA.decimals) {
        const [num, fraction] = value.split('.')
        value = `${num}.${fraction.slice(0, tokenA.decimals)}`
      }

      const currencyAmountIn = tryParseCurrencyAmount(value, tokenA)
      if (!currencyAmountIn) return this.amountB = null

      return new Promise((resolve, reject) => {
        const currentPromise = this.$axios('/v2/swapRouter/getRoute', {
          params: {
            trade_type: 'EXACT_INPUT',
            input: tokenA.id,
            output: tokenB.id,
            amount: currencyAmountIn.toFixed(),
            slippage: slippage.toFixed(),
            receiver: this.user?.name,
            maxHops: this.maxHops,
            v2: true
          }
        }).then(r => {
          if (currentPromise !== lastOutputPromise) {
            resolve()
            return console.log('NOT CURRENT RESPONCE')
          }

          const { data: { executionPrice, minReceived, memo, input, output, priceImpact, route, swaps } } = r
          const price = new Price(tokenA, tokenB, executionPrice.denominator, executionPrice.numerator)

          this.priceInverted = executionPrice.numerator == 0 ? '0' : price.invert().toSignificant(8)
          this.price = executionPrice.numerator == 0 ? '0' : price.toSignificant(8)

          this.memo = memo
          this.swaps = swaps
          this.amountB = output
          this.expectedInput = input
          this.expectedOutput = output
          this.priceImpact = priceImpact
          this.minReceived = minReceived
          this.route = { pools: route.map(poolId => constructPoolInstance(this.pools.find(p => p.id == poolId))), input: tokenA, output: tokenB }

          this.loading = false
          resolve()
        }).catch(e => {
          if (currentPromise !== lastOutputPromise) {
            resolve()
            return console.log('NOT CURRENT RESPONCE')
          }

          this.loading = false
          reject(e)
        })

        lastOutputPromise = currentPromise
      })
    },

    onRateClick() {
      this.rateInverted = !this.rateInverted
    }
  }
}
</script>

<style lang="scss">
.multiroute {
  .el-collapse-item__arrow {
    display: none !important;
  }

  i.el-icon-plus {
    transition: all 0.3s;
  }

  .is-active {
    i.el-icon-plus {
      transform: rotate(45deg);
    }
  }
}
</style>

<style lang="scss" scoped>
.swap-widget {
  width: 100%;
}
.bottom-icon {
  background: var(--btn-default);
  border-radius: 4px;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1.5px solid var(--background-color-secondary);

  i {
    transition: all 0.2s ease 0s;
  }

  &:hover {
    i {
      transform: rotate(180deg);
    }
    // background-color: var(--hover);
  }
}
.arrow-pos {
  top: -12px;
}
.navigation {
  transition: color 0.3s;
  &:hover {
    color: var(--text-default)
  }
}
.price-impact {
  font-weight: 500;
}
.submit {
  font-weight: 500;
  &.disabled {
    background: var(--btn-default) !important;
    color: #636366 !important;
    border-color: var(--btn-default) !important;
    opacity: 0.8;
    filter: none !important;
  }
}
.submit:hover{
  background: var(--main-green) !important;
  color: var(--text-theme) !important;
}
.info-container {
  border-radius: 8px !important;
  border: 1px solid transparent !important;
  transition: border-color 0.3s;
  &:hover {
    border: 1px solid var(--border-color) !important;
  }
}
.rate-container {
  user-select: none;
  color: var(--text-default);
}
</style>
<style lang="scss">
.theme-light{
  --background-color-third: #E5E5EA;
  --selector-bg: #F2F2F7;
  --text-disable: rgba(35, 35, 37, 0.6);
}
</style>
