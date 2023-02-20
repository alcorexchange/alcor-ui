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
            .text-decoration-underline {{ tokenA.amount | commaFloat }}
            .fs-12 {{ tokenA.currency }}
            i.el-icon-wallet.ml-1

      PoolTokenInput(
        :token="tokenA"
        :tokens="tokensA"
        v-model="amountA"
        @tokenSelected="setTokenA"
        :showMaxButton="tokenA && tokenA.amount > amountA"
        @onMax="setAToMax"
        @blur="formatA"
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

      PoolTokenInput(:token="tokenB" :tokens="tokensA" v-model="amountB" @tokenSelected="setTokenB")

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
import { mapActions, mapGetters } from 'vuex'
import PoolTokenInput from '~/components/amm/PoolTokenInput.vue'

import AlcorTabs from '~/components/AlcorTabs'
import AlcorContainer from '~/components/AlcorContainer'
import AlcorButton from '~/components/AlcorButton'
import TokenSelect from '~/components/TokenSelect'

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

    tokenA: null,
    tokenB: null,

    inputToken: {
      symbol: 'BRWL',
      contract: 'brawlertoken'
    },
    inputAmount: 100,
    outputToken: {
      symbol: 'BRWL',
      contract: 'brawlertoken'
    },
    outputAmount: 100,

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
    ...mapGetters(['user']),

    tokensA() {
      return this.user?.balances || []
    }
  },

  methods: {
    setTokenA(token) {
      this.tokenA = token
      this.formatA()
    },
    setAToMax() {
      this.amountA = this.tokenA.amount
      this.formatA()
    },
    formatA() {
      this.amountA = (+this.amountA).toFixed(this.tokeA ? this.tokenA.decimals : 4)
    },

    setTokenB(token) {
      this.tokenB = token
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
