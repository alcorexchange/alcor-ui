<template lang="pug">
.d-flex.gap-32.w-100
  alcor-container.pool-form.d-flex.flex-column.gap-32
    alcor-tabs.swap-tabs(:links="true" :tabs="tabs")
    element-select.token-select(:options="tokens" keyProps="quote_name")
      template(#preOptions)
        el-input(v-model='search' placeholder="Search by name or contract" clearable)
      template(#option="{ option }")
        token-option(:token="option" @click="changeSelected")
      template(#selected)
        .d-flex.gap-8.align-items-center.px-2
          el-input(v-model='inputAmount' :placeholder="0.0" clearable)
          token-image(:src='$tokenLogo(inputToken.quote_name, inputToken.contract)')
          .disable {{ inputToken.quote_name }}

  nuxt-child
</template>

<script>
import AlcorTabs from '~/components/AlcorTabs'
import AlcorContainer from '~/components/AlcorContainer'
import AlcorSelect from '~/components/AlcorSelect'
import ElementSelect from '~/components/elements/ElementSelect'
import TokenOption from '~/components/TokenOption'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    AlcorTabs,
    AlcorContainer,
    ElementSelect,
    AlcorSelect,
    TokenOption,
    TokenImage
  },
  data: () => ({
    inputToken: {
      quote_name: 'BRWL',
      contract: 'brawlertoken'
    },
    search: '',
    inputAmount: 1000,
    tokens: [
      { quote_name: 'BRWL', contract: 'brawlertoken' },
      { quote_name: 'AETHER', contract: 'e.rplanet' },
      { quote_name: 'DUST', contract: 'niftywizards' },
      { quote_name: 'RDAO', contract: 'e.rplanet' }
    ],
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
  methods: {
    changeSelected(token) {
      this.inputToken = token
    }
  }
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
        transition: none;
      }

      &.active {
        border: none;
        background: var(--btn-active);

        &::after {
          background: var(--btn-active);
          transition: none;
        }
      }
    }
  }
}
</style>
