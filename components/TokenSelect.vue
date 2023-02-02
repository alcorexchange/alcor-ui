<template lang="pug">
element-select.token-select(:options="tokens" keyField="quote_name" :disableList="true")
  template(#preOptions)
    el-input.search(v-model='search' placeholder="Search by name or contract")
    recycle-scroller.scroller(:emit-update="true" class="scroller" :items="tokensFiltered" :item-size="42")
      template(v-slot="{ item: token }")
        .token.d-flex.justify-content-between.align-items-center.p-2(@click="changeSelected(token)" :class="{ active: isActiveToken(token) }")
          .d-flex.gap-8.align-items-center
            token-image(:src="$tokenLogo(token.symbol, token.contract)" height="24")
            .fs-16.color-default {{ token.symbol }}
            .text-muted.small {{ token.contract }}

          //.ml-auto(v-if="user")
            span.text-muted {{ token.balance | commaFloat }}

  template(#selected)
    .d-flex.gap-8.align-items-center.pr-2
      el-input.amount(v-model.number="amountValue" @blur="blur" type="number" :placeholder="0.0" :clearable="!disabled" :disabled="disabled")
      token-image(:src='$tokenLogo(token.symbol, token.contract)' height="24")
      .fs-24.color-default {{ token.symbol }}
</template>

<script>
import { mapGetters } from 'vuex'
import AlcorSelect from '~/components/AlcorSelect'
import ElementSelect from '~/components/elements/ElementSelect'
import TokenOption from '~/components/TokenOption'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    ElementSelect,
    AlcorSelect,
    TokenOption,
    TokenImage
  },
  props: ['token', 'amount', 'disabled'],
  data: () => ({
    //TODO
    inputToken: {
      quote_name: 'BRWL',
      contract: 'brawlertoken'
    },

    search: '',
    tokens: [
      { quote_name: 'BRWL', contract: 'brawlertoken' },
      { quote_name: 'AETHER', contract: 'e.rplanet' },
      { quote_name: 'DUST', contract: 'niftywizards' },
      { quote_name: 'RDAO', contract: 'e.rplanet' }
    ]
  }),
  computed: {
    amountValue: {
      get() {
        return this.amount
      },
      set(value) {
        this.$emit('update:amount', value)
      }
    },
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
    blur() {
      this.$emit(
        'update:amount',
        (+this.amount || 0).toFixed(this.token.precision)
      )
    },
    isActiveToken(token) {
      return (
        this.token.contract == token.contract &&
        this.token.symbol == token.symbol
      )
    },
    changeSelected(token) {
      this.$emit('update:token', token)
    }
  }
}
</script>

<style lang="scss">
.token-select {
  padding: 10px 16px !important;
  border-radius: 4px !important;

  .scroller {
    padding: 0px 10px;
  }

  .search {
    width: 373px;
    position: sticky;
    top: 0;
    z-index: 100;
    padding: 10px;
    background: var(--background-color-base);

    .el-input__inner {
      background: var(--background-color-secondary);
      font-size: 12px;
      border-radius: 4px;
    }
  }

  .amount {
    .el-input__inner {
      font-size: 18px;
    }
    &.is-disabled {
      .el-input__inner {
        background-color: var(--background-color-secondary);
      }
    }
  }

  .selected svg {
    width: 10px;
    height: 10px;
  }
  .selected svg[data-icon='dollar'] {
    height: 40px;
    width: 40px;
  }

  .el-dropdown-menu.element-options {
    top: 60px;
    padding: 0;
    border-radius: 5px;
    border: none;
    max-height: 300px;
  }

  .el-input {
    font-size: 16px;
  }

  .token {
    border-radius: 5px;
    cursor: pointer;
  }
  .token:hover,
  .token.active {
    background: var(--background-color-secondary);
  }
}
</style>
