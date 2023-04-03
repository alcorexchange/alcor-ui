<template lang="pug">
.d-flex.gap-6.justify-content-center
  alcor-container.swap-widget
    .d-flex.justify-content-between.align-items-center.p-1
      .d-flex.align-items-center.gap-16
        .fs-18 {{ $t('Swap') }}
        NuxtLink.navigation(:to="localeRoute('/positions')").fs-18.disable {{ $t('Pool') }}

      .d-flex.gap-2.align-items-center
        AlcorButton(iconOnly flat).p-0
          i.el-icon-data-analysis.pointer.fs-18(@click="$emit('onChartClick')")
        Settings

    PoolTokenInput.mt-2(
      label="Sell"
      :token="tokenA"
      :tokens="tokens"
      v-model="amountA"
      @input="calcOutputDebounced"
      @tokenSelected="setTokenA"
      :show-max-button="false"
    )

    .w-100.position-relative
      .d-flex.align-items-center.justify-content-center.position-absolute.w-100.z-1.arrow-pos
        .bottom-icon(@click="toggleTokens")
          i.el-icon-bottom.text-center.fs-20.pointer

    PoolTokenInput.mt-1(
      label="Buy"
      :token="tokenB"
      :tokens="tokens"
      v-model="amountB"
      @input="calcInputDebounced"
      @tokenSelected="setTokenB"
    )

    alcor-container.info-container.mt-2(:alternative="true" v-if="tokenA && tokenB")
      el-collapse(:value="routerCollapse").default
        el-collapse-item(name="1")
          template(#title)
            .rate-container(@click.prevent.stop="onRateClick")
              .d-flex.align-items-center.gap-8.py-1(v-if="loading")
                i.el-icon-loading.el-icon-refresh.h-fit
                .fs-12.disable Fetching Best price...
              .d-flex.align-items-center.gap-8.py-1(v-else)
                .disable.fs-12 Rate
                .d-flex.gap-4
                  .fs-12 {{ rate }} {{ rateInverted ? tokenA.symbol : tokenB.symbol }} per {{ rateInverted ? tokenB.symbol : tokenA.symbol}}
                  .fs-12.disable (0.00$)
          .d-flex.flex-column.gap-4
            .d-flex.justify-content-between.align-items-center
              .fs-12.disable Expected Output
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
              .fs-12.disable Price Impact
              vue-skeleton-loader(
                v-if='loading'
                :width='52',
                :height='14',
                animation='wave',
                wave-color='rgba(150, 150, 150, 0.1)',
                :rounded='true',
              )
              .price-impact.fs-12(v-else :style="priceImpactStyle && { color: `var(--main-${priceImpactStyle})` }") {{ priceImpact }}
          .d-flex.flex-column.gap-4
            .d-flex.justify-content-between.align-items-center
              .fs-12.disable Minimum Received after slippage
              vue-skeleton-loader(
                v-if='loading'
                :width='52',
                :height='14',
                animation='wave',
                wave-color='rgba(150, 150, 150, 0.1)',
                :rounded='true',
              )
              .fs-12(v-else) {{ miniumOut }} WAX ({{ slippage.toFixed() }}%)

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

          alcor-container.mt-2(v-if="route")
            el-collapse.default.multiroute
              el-collapse-item
                template(#title)
                  .d-flex.justify-content-between.align-items-center.w-100.p-1
                    .d-flex.gap-8.color-action.align-items-center
                      i.el-icon-connection
                      .fs-12 Multiroute

                    i.el-icon-plus
                .p-1
                  SwapRoute(:route="route")
    AuthOnly.w-100.mt-2
      AlcorButton.w-100.submit(@click="submit" big access :disabled="!canSubmit" :class="{ disabled: !canSubmit }") {{ renderSubmitText }}
</template>

<script>
// TODO DEBOUINCE FOR INPUTS
// https://stackoverflow.com/questions/42199956/how-to-implement-debounce-in-vue2

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
import { tryParseCurrencyAmount } from '~/utils/amm'
import { getPrecision } from '~/utils'
import AuthOnly from '~/components/AuthOnly'

export default {
  name: 'SwapWidget',

  components: {
    AlcorContainer,
    ReturnLink,
    AlcorCollapse,
    AlcorButton,
    PoolTokenInput,
    Settings,
    SwapRoute,
    VueSkeletonLoader,
    AuthOnly
  },

  data: () => ({
    loading: false,
    amountA: null,
    amountB: null,
    details: ['1'], // Details are open by default

    rate: '0.00',
    priceImpact: '0.00%',
    miniumOut: 0,
    expectedOutput: null,
    route: null,

    routerCollapse: ['1'],
    lastField: 'input', // might be input/output

    rateInverted: false
  }),

  fetch() {
    // fetch has access to `this`
    const { input, output } = this.$route.query

    if (input) {
      const [symbol, contract] = input.split('-')
      this.$store.commit('amm/swap/setInput', { symbol, contract })
    }

    if (output) {
      const [symbol, contract] = output.split('-')
      this.$store.commit('amm/swap/setOutput', { symbol, contract })
    }
    this.$store.dispatch('amm/swap/setDefaultInputOutput')
  },

  computed: {
    priceImpactStyle() {
      const impact = parseFloat(this.priceImpact.replace('%', ''))
      if (impact < 0) return 'red'
      if (impact <= 3) return 'green'
      if (impact <= 5) return 'yellow'
      return 'red'
    },
    renderSubmitText() {
      if (!this.tokenA || !this.tokenB) return 'Select Tokens'
      else if (!this.amountA || !this.amountB) return 'Enter Amounts'
      else return `Swap ${this.tokenA.symbol} to ${this.tokenB.symbol}`
    },
    canSubmit() {
      return this.tokenA && this.tokenB && this.amountA && this.amountB
    },
    ...mapState(['user', 'network']),
    ...mapGetters('amm', ['slippage', 'pools']),
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

    pools() {
      // Recalculate on pools update
      this.lastField == 'input' ? this.calcOutput(this.amountA) : this.calcOutput(this.amountB)
    }
  },

  methods: {
    ...mapActions('amm/swap', [
      'bestTradeExactIn',
      'bestTradeExactOut'
    ]),

    toggleTokens() {
      const [amountA, amountB] = [this.amountB, this.amountA]

      this.amountA = amountA
      this.amountB = amountB
      this.$store.dispatch('amm/swap/flipTokens')

      this.calcOutput(this.amountA)
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

      if (this.tokenA && this.tokenB) this.calcOutput(this.amountA)
    },

    async submit() {
      try {
        await this.swap()
        this.amountA = null
        this.amountB = null

        return this.$notify({ type: 'success', title: 'Swap', message: 'Swap completed successfully' })
      } catch (e) {
        console.log(e)
        return this.$notify({ type: 'error', title: 'Swap Error', message: e.message })
      }
    },

    async swap() {
      // TODO Check that input amount is overmuch
      const { amountA, tokenA, tokenB, slippage } = this
      if (!tokenA || !tokenB) return console.log('no tokens selected')

      const currencyAmountIn = tryParseCurrencyAmount(parseFloat(amountA).toFixed(tokenA.decimals), tokenA)
      if (!currencyAmountIn) return console.log({ currencyAmountIn })

      const actions = []
      // TODO Swap with 2 same pools with different fee (router)
      const [trade] = await this.bestTradeExactIn({ currencyAmountIn, currencyOut: tokenB }) // First is the best trade
      const { swaps: [{ inputAmount, route }] } = trade

      const path = route.pools.map(p => p.id).join(',')
      const min = trade.minimumAmountOut(slippage) // TODO Manage slippages

      // Memo Format <Service Name>#<Pool ID's>#<Recipient>#<Output Token>#<Deadline>
      const memo = `swapexactin#${path}#${this.user.name}#${min.toExtendedAsset()}#0`

      if (parseFloat(amountA) > 0)
        actions.push({
          account: tokenA.contract,
          name: 'transfer',
          authorization: [this.user.authorization],
          data: {
            from: this.user.name,
            to: this.network.amm.contract,
            quantity: inputAmount.toAsset(),
            memo
          }
        })

      const r = await this.$store.dispatch('chain/sendTransaction', actions)
      console.log('SWAP: ', r)
    },

    calcInputDebounced: debounce(function(value) {
      this.loading = true
      setTimeout(() => {
        try {
          this.calcInput(value)
        } catch (e) {
          console.error('calcOutput', e)
        } finally {
          this.loading = false
        }
      }, 0)
    }, 500),

    calcOutputDebounced: debounce(function(value) {
      this.loading = true
      setTimeout(() => {
        try {
          this.calcOutput(value)
        } catch (e) {
          console.error('calcOutput', e)
        } finally {
          this.loading = false
        }
      }, 0)
    }, 500),

    // TODO Refactor into one function
    async calcInput(value) {
      const { tokenA, tokenB, slippage, rateInverted } = this

      if (!value || isNaN(value) || !tokenA || !tokenB) return this.amountA = null

      if (getPrecision(value) > tokenB.decimals) {
        const [num, fraction] = value.split('.')
        return this.amountB = `${num}.${fraction.slice(0, tokenB.decimals)}`
      }

      const currencyAmountOut = tryParseCurrencyAmount(value, tokenB)
      if (!currencyAmountOut) return this.amountA = null

      const routes = await this.bestTradeExactOut({ currencyIn: tokenA, currencyAmountOut })

      const [best] = routes

      routes.forEach(r => {
        console.log('input: ', r.inputAmount.toFixed(), 'output: ', r.outputAmount.toFixed(), 'priceImpact:', r.priceImpact.toSignificant())
      })

      //console.log({ routes })

      if (!best) {
        // TODO clear tokenB
        return this.$notify({ type: 'error', title: 'Swap Error', message: 'No swap route found' })
      }

      const { inputAmount, executionPrice, priceImpact, route } = best
      this.amountA = inputAmount.toFixed()
      this.expectedOutput = inputAmount.toAsset()

      this.route = JSON.parse(JSON.stringify(route))
      this.rate = rateInverted ? executionPrice.invert().toSignificant(6) : executionPrice.toSignificant(6)
      this.priceImpact = priceImpact.toFixed(2)
      this.miniumOut = best.minimumAmountOut(slippage).toFixed()
      this.lastField = 'output'
    },

    async calcOutput(value) {
      const { tokenA, tokenB, slippage, rateInverted } = this

      if (!value || isNaN(value) || !tokenA || !tokenB) return this.amountB = null

      if (getPrecision(value) > tokenA.decimals) {
        const [num, fraction] = value.split('.')
        value = `${num}.${fraction.slice(0, tokenA.decimals)}`
      }

      const currencyAmountIn = tryParseCurrencyAmount(value, tokenA)
      if (!currencyAmountIn) return this.amountB = null

      //const [best] = await this.bestTradeExactIn({ currencyAmountIn, currencyOut: tokenB })
      const routes = await this.bestTradeExactIn({ currencyAmountIn, currencyOut: tokenB })

      // routes.forEach(r => console.log(r.inputAmount.toFixed()))
      // console.log(routes)

      const [best] = routes

      if (!best) {
        // TODO clear tokenB
        return this.$notify({ type: 'error', title: 'Swap Error', message: 'No swap route found' })
      }

      const { outputAmount, executionPrice, priceImpact, route } = best
      this.amountB = this.$options.filters.commaFloat(outputAmount.toFixed(), tokenB.decimals)
      this.expectedOutput = outputAmount.toAsset()

      this.route = JSON.parse(JSON.stringify(route))
      this.rate = rateInverted ? executionPrice.invert().toSignificant(6) : executionPrice.toSignificant(6)
      this.priceImpact = priceImpact.toFixed(2)
      this.miniumOut = best.minimumAmountOut(slippage).toFixed()
      this.lastField = 'input'
    },
    onRateClick() {
      console.log('on rate click')
      this.rateInverted = !this.rateInverted
      this.lastField == 'input' ? this.calcOutput(this.amountA) : this.calcOutput(this.amountB)
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
