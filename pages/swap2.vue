<template lang="pug">
.d-flex.gap-32.w-100
  alcor-container.pool-form.d-flex.flex-column.gap-32
    alcor-tabs.swap-tabs(:links="true" :tabs="tabs")
    element-select.token-select(:options="tokens" keyField="quote_name" :disableList="true")
      template(#preOptions)
        el-input(v-model='search' placeholder="Search by name or contract" clearable style="width: 370px")
        recycle-scroller(:emit-update="true" class="scroller" :items="tokensFiltered" :item-size="45" keyField="symbol")
          template(v-slot="{ item: token }")
            .token.d-flex.justify-content-between.align-items-center.p-2
              .d-flex.gap-8.align-items-center
                token-image(:src="$tokenLogo(token.symbol, token.contract)" height="25")
                .fs-16 {{ token.quote_name }}
                .text-muted.small {{ token.contract }}

              //.ml-auto(v-if="user")
                span.text-muted {{ token.balance | commaFloat }}

      template(#selected)
        .d-flex.gap-8.align-items-center.px-2
          el-input(type="number" v-model='inputAmount' :placeholder="0.0" clearable)
          token-image(:src='$tokenLogo(inputToken.quote_name, inputToken.contract)')
          .fs-18.disable {{ inputToken.quote_name }}

  nuxt-child
</template>

<script>
import { mapGetters } from 'vuex'
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
  computed: {
    //TODO mock tokens
    ...mapGetters({
      tokens0: 'swap/tokens0'
    }),
    //mock tokens
    tokensFiltered() {
      return this.tokens0
        .filter((t) => {
          const s = (t.symbol + '@' + t.contract).toLowerCase()
          return s.includes(this.search.toLowerCase())
        })
        .map((t) => {
          t.balance = this.$tokenBalance(t.symbol || t.currency, t.contract)
          return t
        })
        .sort((a, b) => {
          return a.balance == '0.0000' ? 1 : -1
        })
        .sort((a, b) =>
          parseFloat(a.balance) < parseFloat(b.balance) ? 1 : -1
        )
    }
  },
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

  .el-dropdown-menu.element-options {
    top: 60px;
  }

  .el-input {
    font-size: 16px;
  }

  .token:hover {
    background-color: red;
  }

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
