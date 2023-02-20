<template lang="pug">
alcor-container.pool-form.d-flex.flex-column.gap-32
  .d-flex.justify-content-between.align-items-center
    alcor-tabs.swap-tabs(:links="true" :tabs="tabs")
    i.el-icon-setting.fs-24.pointer

  .d-flex.flex-column.gap-10
    .d-flex.flex-column.gap-8
      .d-flex.flex-row.justify-content-between.align-items-center
        .fs-12.text-muted {{ $t("Sell") }}
        el-button(v-if="tokenA" type="text" size="mini" @click="setAToMax").ml-auto
          .d-flex.gap-4.fs-12
            .text-decoration-underline {{ balanceInput }}
            .fs-12 WAX
            i.el-icon-wallet.ml-1

      PoolTokenInput(
        :token="tokenA"
        :tokens="tokensA"
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
        :tokens="tokensB"
        v-model="amountB"
        @tokenSelected="setTokenB"
      )
      //:locked="{ message: 'The market price is outside your specified price range. Single-asset deposit only.' }"

  alcor-button.w-100(big disabled) Swap {{ tokenA && tokenB ? tokenA.currency : '' }} to {{ tokenA && tokenB ? tokenB.currency : '' }}

  .grey-border.d-flex.flex-column.gap-4.p-3.br-8
    .d-flex.justify-content-between
      .fs-12 Minimum Received
      .fs-12 79.01222
    .d-flex.justify-content-between
      .fs-12 Rate
      .fs-12 3.6198 BRWL per WAX
    .d-flex.justify-content-between
      .fs-12 Price Impact
      .fs-12.green 0%
    .d-flex.justify-content-between
      .fs-12 Slippage
      .fs-12 0.1%
    .d-flex.justify-content-between
      .fs-12 Liquidity Source Fee
      .fs-12 0.3%

</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

import { tryParseCurrencyAmount } from '~/utils/amm'

import AlcorTabs from '~/components/AlcorTabs'
import AlcorContainer from '~/components/AlcorContainer'
import AlcorButton from '~/components/AlcorButton'
import TokenSelect from '~/components/TokenSelect'
import PoolTokenInput from '~/components/amm/PoolTokenInput.vue'


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
    AlcorTabs,
    AlcorContainer,
    TokenSelect,
    AlcorButton,
    PoolTokenInput
  },
  data: () => ({
    amountA: null,
    amountB: null,

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
      'tokensA',
      'tokensB',
      'pool'
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
      this.$store.dispatch('amm/swap/setTokenA', token.name)
    },

    setAToMax() {
      console.log('setAToMax')
    },

    setTokenB(token) {
      this.$store.dispatch('amm/swap/setTokenB', token.name)
    },

    async calcOutput(value, independentField) {
      const { tokenA, tokenB } = this
      const currencyAmountIn = tryParseCurrencyAmount(value, tokenA)
      const r = await this.bestTradeExactIn({ currencyAmountIn, currencyOut: tokenB })

      console.log({ r })

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
