<template lang="pug">
alcor-container.pool-form.d-flex.flex-column.gap-32
  alcor-tabs.swap-tabs.mt-2(:links="true" :tabs="tabs")

  .d-flex.flex-column.gap-10
    .d-flex.flex-column.gap-8
      .d-flex.flex-row.justify-content-between.align-items-center
        .fs-12.text-muted {{ $t("Sell") }}
        el-button(v-if="user && user.balances" type="text" size="mini" @click="inputAmount = parseFloat(inputBalance)").ml-auto
          .d-flex.gap-4.fs-12
            .text-decoration-underline {{ inputBalance | commaFloat }}
            .fs-12 {{ inputToken.symbol }}
            i.el-icon-wallet.ml-1

      PoolTokenInput(:token="tokenA" :tokens="tokensA" v-model="amountA" @tokenSelected="setTokenA")

    i.el-icon-bottom.pointer.text-center.fs-24

    .d-flex.flex-column.gap-8
      .d-flex.flex-row.justify-content-between.align-items-center
        .fs-12.text-muted {{ $t('Buy (Estimated)') }}
        .d-flex.align-items-center.gap-4.fs-12(v-if="user && user.balances")
          .text-decoration-underline {{ outputBalance | commaFloat }}
          .fs-12 {{ outputToken.symbol }}
          i.el-icon-wallet.ml-1

      PoolTokenInput(:token="tokenB" :tokens="tokensA" v-model="amountB" @tokenSelected="setTokenB")

  alcor-button.w-100(big access disabled) Swap
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import PoolTokenInput from '~/components/amm/PoolTokenInput.vue'

import AlcorTabs from '~/components/AlcorTabs'
import AlcorContainer from '~/components/AlcorContainer'
import AlcorButton from '~/components/AlcorButton'
import TokenSelect from '~/components/TokenSelect'
import PoolTokenInputVue from '~/components/amm/PoolTokenInput.vue'

export default {
  components: {
    AlcorTabs,
    AlcorContainer,
    TokenSelect,
    AlcorButton,
    PoolTokenInput
  },
  data: () => ({
    tokenA: null,
    amountA: 0,

    tokenB: null,
    amountB: 0,

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
        label: 'Manage Liquidity',
        route: { path: '/swap2/manage-liquidity' }
      }
    ]
  }),

  computed: {
    ...mapGetters(['user']),

    tokensA() {
      return this.user?.balances || []
    },

    inputBalance() {
      return (
        this.user.balances.find(
          (b) =>
            b.currency === this.inputToken.symbol &&
            b.contract == this.inputToken.contract
        )?.amount || (0).toFixed(4)
      )
    },
    outputBalance() {
      return (
        this.user.balances.find(
          (b) =>
            b.currency === this.outputToken.symbol &&
            b.contract == this.outputToken.contract
        )?.amount || (0).toFixed(4)
      )
    }
  },

  methods: {
    setTokenA(token) {
      this.tokenA = token
    },

    setTokenB(token) {
      this.tokenB = token
    }
  }
}
</script>

<style lang="scss">
.pool-form {
  height: 500px;
  width: 370px;

  .swap-tabs {
    gap: 0px;
    background: var(--btn-alternative);
    padding: 8px;
    border-radius: 4px;
    width: 340px;

    .alcor-tab-link {
      width: 50%;
      text-align: center;
      border: none;
      border-radius: 4px;

      & .inner {
        padding: 6px;
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
