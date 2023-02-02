<template lang="pug">
.d-flex.gap-32.w-100
  alcor-container.pool-form.d-flex.flex-column.gap-32
    alcor-tabs.swap-tabs.mt-2(:links="true" :tabs="tabs")
    token-select(:token.sync='inputToken' :amount.sync="inputAmount")
    token-select(:token.sync='outputToken' :amount.sync="outputAmount" disabled)
    alcor-button.w-100(big access disabled) Swap

  nuxt-child
</template>

<script>
import AlcorTabs from '~/components/AlcorTabs'
import AlcorContainer from '~/components/AlcorContainer'
import AlcorButton from '~/components/AlcorButton'
import TokenSelect from '~/components/TokenSelect'

export default {
  components: {
    AlcorTabs,
    AlcorContainer,
    TokenSelect,
    AlcorButton
  },
  data: () => ({
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
  })
}
</script>

<style lang="scss">
.pool-form {
  width: 405px;

  .swap-tabs {
    gap: 0px;
    background: var(--btn-alternative);
    padding: 8px;
    border-radius: 4px;

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
