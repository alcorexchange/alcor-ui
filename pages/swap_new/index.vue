<template lang="pug">
.d-flex.gap-6.justify-content-center
  alcor-container.mt-5.swap-widget
    .d-flex.justify-content-between.align-items-center.p-1
      .fs-18 {{ $t('Swap') }}
      .d-flex.gap-16.align-items-center
        i.el-icon-refresh.pointer(@click="loading = !loading")
        settings

    PoolTokenInput.mt-2(
      label="Sell"
      :token="tokenA"
      :tokens="tokens"
      v-model="amountA"
      @input="calcOutput"
      @tokenSelected="setTokenA"
      :show-max-button="false"
      @onMax="setAToMax"
    )
    PoolTokenInput.mt-2(
      label="Buy"
      :token="tokenB"
      :tokens="tokens"
      v-model="amountB"
      @tokenSelected="setTokenB"
    )

    alcor-container.mt-2(:alternative="true")
      el-collapse.default
        el-collapse-item
          template(#title)
            .d-flex.align-items-center.gap-8.py-1(v-if="loading")
              i.el-icon-loading.el-icon-refresh.h-fit
              .fs-12.disable Fetching Best price...
            .d-flex.align-items-center.gap-8.py-1(v-else)
              .disable.fs-12 Rate
              .d-flex.gap-4
                .fs-12 3.6198 BRWL per WAX
                .fs-12.disable (1402,10.01$)
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
              .fs-12(v-else) 79.01222 WAX
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
              .fs-12(v-else) 0%
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
              .fs-12(v-else) 79.01222 WAX (0.4%)
          .d-flex.flex-column.gap-4
            .d-flex.justify-content-between.align-items-center
              .fs-12.disable Network fee
              vue-skeleton-loader(
                v-if='loading'
                :width='52',
                :height='14',
                animation='wave',
                wave-color='rgba(150, 150, 150, 0.1)',
                :rounded='true',
              )
              .fs-12(v-else) 0.00

          alcor-container.mt-2
            el-collapse.default.multiroute
              el-collapse-item
                template(#title)
                  .d-flex.justify-content-between.align-items-center.w-100.p-1
                    .d-flex.gap-8.color-action.align-items-center
                      i.el-icon-connection
                      .fs-12 Multiroute

                    i.el-icon-plus
                .p-1
                  swap-route

    alcor-button.w-100.mt-2(@click="submit" big access) Swap WAX to BRWL

</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import AlcorContainer from '~/components/AlcorContainer'
import ReturnLink from '~/components/ReturnLink'
import AlcorCollapse from '~/components/AlcorCollapse'
import AlcorButton from '~/components/AlcorButton'
import PoolTokenInput from '~/components/amm/PoolTokenInput'
import Settings from '~/components/amm/Settings'
import SwapRoute from '~/components/swap/SwapRoute'
import VueSkeletonLoader from 'skeleton-loader-vue'
import { Percent, Trade } from '~/assets/libs/swap-sdk'
import { tryParseCurrencyAmount } from '~/utils/amm'

const DEFAULT_SWAP_SLIPPAGE = new Percent(50, 10000) // 0.5%

export default {
  components: {
    AlcorContainer,
    ReturnLink,
    AlcorCollapse,
    AlcorButton,
    PoolTokenInput,
    Settings,
    SwapRoute,
    VueSkeletonLoader
  },
  data: () => ({
    loading: false,
    amountA: null,
    amountB: null,
  }),
  computed: {
    ...mapState(['user', 'network']),
    ...mapState(['amm', 'slippage']),
    ...mapGetters('amm/swap', [
      'tokenA',
      'tokenB',
      'tokens',
    ]),
  },
  methods: {
    ...mapActions('amm/swap', [
      'bestTradeExactIn',
      'bestTradeExactOut'
    ]),

    setTokenA(token) {
      console.log('token', token)
      this.$store.dispatch('amm/swap/setTokenA', token)
    },

    setAToMax() {
      console.log('setAToMax')
    },

    setTokenB(token) {
      this.$store.dispatch('amm/swap/setTokenB', token)
    },

    async submit() {
      const slippage = !isNaN(this.slippage) ? new Percent(this.slippage * 100, 10000) : DEFAULT_SWAP_SLIPPAGE

      const { amountA, tokenA, tokenB } = this
      if (!tokenA || !tokenB) return console.log('no tokens selected')

      const currencyAmountIn = tryParseCurrencyAmount(amountA, tokenA)
      if (!currencyAmountIn) return

      const actions = []
      // TODO Swap with 2 same pools with different fee
      const [trade] = await this.bestTradeExactIn({ currencyAmountIn, currencyOut: tokenB }) // First is the best trade
      console.log('swaps:', { trade })
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

      try {
        const r = await this.$store.dispatch('chain/sendTransaction', actions)
        console.log(r)
      } catch (e) {
        console.log('err', e)
      }
    },
    async calcOutput(value, independentField) {
      const { tokenA, tokenB } = this

      if (!value) return this.amountB = null

      const currencyAmountIn = tryParseCurrencyAmount(value, tokenA)
      const [best] = await this.bestTradeExactIn({ currencyAmountIn, currencyOut: tokenB })
      console.log({ best })

      const { outputAmount, executionPrice, priceImpact } = best

      //console.log(outputAmount.toSignificant(), outputAmount.toFixed(), outputAmount.toExact())
      //console.log({ badOutput: outputAmount.toFixed(), goodOutput })
      this.amountB = outputAmount.toSignificant()
      this.rate = executionPrice.toFixed(6)
      this.impact = priceImpact.toFixed(2)

      this.miniumOut = best.minimumAmountOut(new Percent(5, 100)).toFixed()

      //public minimumAmountOut(slippageTolerance: Percent, amountOut = this.outputAmount): CurrencyAmount<TOutput> {

      //console.log(best)

      //const { tokenA, tokenB } = this

      //if (independentField == 'INPUT') {
      //} else {
      //  const currencyAmountOut = tryParseCurrencyAmount(value, tokenB)
      //  return this.currencyAmountOut({ currencyAmountOut, currencyIn: tokenA })
      //}
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
  width: 450px;
}
</style>
