<template lang="pug">
alcor-container.pool-form.d-flex.flex-column.gap-32
  .d-flex.justify-content-between.align-items-center
    alcor-tabs.swap-tabs(:links="true" :tabs="tabs")
    settings

  .d-flex.flex-column.gap-10
    .d-flex.flex-column.gap-8
      .d-flex.flex-row.justify-content-between.align-items-center
        .fs-12.text-muted {{ $t("Sell") }}
        el-button(v-if="$store.state.user" type="text" size="mini" @click="setAToMax").ml-auto
          .d-flex.gap-4.fs-12
            .text-decoration-underline {{ $store.getters.assetBalance({ symbol: 'BRWL', contract: 'brawlertoken'}) }}
            .fs-12 WAX
            i.el-icon-wallet.ml-1

      PoolTokenInput(
        :token="tokenA"
        :tokens="tokens"
        v-model="amountA"
        @input="calcOutput"
        @tokenSelected="setTokenA"
        :show-max-button="false"
        @onMax="setAToMax"
      )

    .d-flex.align-items-center.justify-content-center.mt-2
      i.el-icon-bottom.text-center.fs-20.bottom-icon.pointer

    .d-flex.flex-column.gap-8
      .d-flex.flex-row.justify-content-between.align-items-center
        .fs-12.text-muted {{ $t('Buy (Estimated)') }}
        .d-flex.align-items-center.gap-4.fs-12(v-if="tokenB")
          .text-decoration-underline {{ tokenB.amount | commaFloat }}
          .fs-12 {{ tokenB.currency }}
          i.el-icon-wallet.ml-1

      PoolTokenInput(
        :token="tokenB"
        :tokens="tokens"
        v-model="amountB"
        @tokenSelected="setTokenB"
      )
      //:locked="{ message: 'The market price is outside your specified price range. Single-asset deposit only.' }"

  //alcor-button.w-100(big disabled) Swap {{ tokenA && tokenB ? tokenA.currency : '' }} to {{ tokenA && tokenB ? tokenB.currency : '' }}

  alcor-button.w-100(big @click="submit") Swap {{ tokenA && tokenB ? tokenA.symbol : '' }} to {{ tokenA && tokenB ? tokenB.symbol : '' }}

  .grey-border.d-flex.flex-column.gap-4.p-3.br-8
    .d-flex.justify-content-between
      .fs-12 Minimum Received
      .fs-12 {{ miniumOut }}
    .d-flex.justify-content-between(v-if="tokenA && tokenB")
      .fs-12 Rate
      .fs-12 {{ rate }} {{ tokenB.symbol }} per {{ tokenA.symbol }}
    .d-flex.justify-content-between
      .fs-12 Price Impact
      .fs-12(
        :class="{ 'text-success': impact < 2, 'text-warning': impact >= 2 && impact < 5, 'text-danger': impact >= 5  }"
      ) {{ impact }}%
    .d-flex.justify-content-between
      .fs-12 Slippage
      .fs-12 0.3%
    .d-flex.justify-content-between
      .fs-12 Liquidity Providers Fee
      .fs-12 todo%

</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

import { tryParseCurrencyAmount } from '~/utils/amm'
import { Percent, Trade } from '~/assets/libs/swap-sdk'

import AlcorTabs from '~/components/AlcorTabs'
import AlcorContainer from '~/components/AlcorContainer'
import AlcorButton from '~/components/AlcorButton'
import TokenSelect from '~/components/TokenSelect'
import PoolTokenInput from '~/components/amm/PoolTokenInput.vue'
import Settings from '~/components/amm/Settings'

export function getV2BestTrade() {

}

export function getBestTrade(tradeType, amountSpecified, otherCurrency) {
  // TODO Multi rounding

  const [currencyIn, currencyOut] =
    tradeType === 'EXACT_INPUT'
      ? [amountSpecified?.currency, otherCurrency]
      : [otherCurrency, amountSpecified?.currency]

}


export default {
  components: {
    Settings,
    AlcorTabs,
    AlcorContainer,
    TokenSelect,
    AlcorButton,
    PoolTokenInput
  },
  data: () => ({
    amountA: null,
    amountB: null,

    impact: 0,
    rate: 0,
    miniumOut: 0,

    tabs: [
      {
        label: 'Swap',
        route: { path: '/swap2/swap-tokens' }
      },
      {
        label: 'Transfer',
        route: { path: '/swap2/transfer' }
      },
      {
        label: 'Liquidity',
        route: { path: '/swap2/manage-liquidity' }
      }
    ]
  }),

  computed: {
    ...mapState(['user', 'network']),
    ...mapGetters('amm/swap', [
      'tokenA',
      'tokenB',
      'tokens'
    ]),

    balanceInput() {
      return 0
    },

    balanceOut() {
      return 0
    }
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
      const DEFAULT_SWAP_SLIPPAGE = new Percent(500, 10000)

      const { amountA, tokenA, tokenB } = this
      if (!tokenA || !tokenB) return console.log('no tokens selected')

      const currencyAmountIn = tryParseCurrencyAmount(amountA, tokenA)
      if (!currencyAmountIn) return

      const actions = []
      const [trade] = await this.bestTradeExactIn({ currencyAmountIn, currencyOut: tokenB }) // First is the best trade
      const { swaps: [{ inputAmount, route }] } = trade

      const path = route.pools.map(p => p.id).join(',')
      console.log({ trade, path })
      //return
      const min = trade.minimumAmountOut(new Percent(0, 10000)) // TODO Manage slippages

      // Memo Format <Service Name>#<Pool ID>#<Recipient>#<Output Token>#<Deadline>
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
      if (!value || parseFloat(value) <= 0) return this.amountB = null // TODO Reset

      const { tokenA, tokenB } = this
      const currencyAmountIn = tryParseCurrencyAmount(value, tokenA)
      const [best] = await this.bestTradeExactIn({ currencyAmountIn, currencyOut: tokenB })

      const { outputAmount, executionPrice, priceImpact } = best

      //const goodOutput = outputAmount.

      console.log(outputAmount.toSignificant(), outputAmount.toFixed(), outputAmount.toExact())
      //console.log({ badOutput: outputAmount.toFixed(), goodOutput })
      this.amountB = outputAmount.toFixed()

      this.rate = executionPrice.toFixed(6)
      //this.impact = priceImpact.toFixed()
      this.impact = parseFloat(priceImpact.toFixed())
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
.pool-form {
  max-width: 586px;
  width: 370px;

  .bottom-icon {
    background: var(--btn-default);
    border-radius: 50%;
    padding: 6px;
    transition: all 0.2s ease 0s;

    &:hover {
      transform: rotate(180deg);
      background-color: var(--hover);
    }
  }

  .swap-tabs {
    gap: 16px;
    padding: 8px;
    border-radius: 4px;
    width: 340px;

    .alcor-tab-link {
      text-align: center;
      border: none;
      border-radius: 4px;

      & .inner {
        padding: 6px 16px;
      }

      &::after {
        display: none;
      }

      &.active {
        border: none;
        background: var(--btn-active);

        &::after {
          display: none;
        }
      }
    }
  }
}
</style>
