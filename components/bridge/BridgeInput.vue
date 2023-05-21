<template lang="pug">
.bridge-token(:class="{focused, notSelected: !!token}")
  .before
    SelectNetwork(:networks="networksMock" v-model="selectedNetwork")
  .main
    .label-and-balance
      .label {{ label }}
      .balance.disable(v-if="token" @click="onBalanceClick" :class="{clickable: !!user}") {{ $t('Balance') }}: {{ $tokenBalance(token.symbol, token.contract) | commaFloat }}
    .input-and-select
      // TODO Make dot separation for decimal point instead comma
      el-input.amount(
        placeholder='0.0',
        :value='localValue',
        @input='input',
        @blur='onBlur',
        @focus="onFocus"
      )
      .input-after
        MaxBage.max-bage.mr-1(@max="$emit('input', $event)" :token="token" v-if="!!token && user")
        //- v-if='showMaxButton',
        SelectToken(
          :locked='!!locked',
          :token='token',
          :tokens='tokens',
          @selected='$emit("tokenSelected", $event)'
        )
    .bottom {{ renderBottom }}
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import SelectNetwork from '@/components/modals/SelectNetwork'
import SelectToken from '~/components/modals/amm/SelectToken2'
import MaxBage from '~/components/UI/input/MaxBage'
import { getPrecision } from '~/utils'

export default {
  components: {
    SelectToken,
    MaxBage,
    SelectNetwork,
  },

  props: [
    'token',
    'tokens',
    'value',
    'showMaxButton',
    'locked',
    'label',
    'isSource'
  ],

  data: () => ({
    localValue: null,
    search: '',
    focused: false,
    networksMock: [
      {
        value: 'eos',
        label: 'EOS'
      },
      {
        value: 'wax',
        label: 'WAX'
      },
      {
        value: 'telos',
        label: 'Telos'
      }, {
        value: 'ux',
        label: 'UX Network'
      }
    ]
  }),

  computed: {
    renderBottom() {
      return this.token ? `~$${this.$tokenToUSD(this.localValue, this.token.symbol, this.token.contract)}` : ''
    },
    selectedNetwork: {
      set (chain) {
        return this[this.isSource ? 'setSourceName' : 'setDestinationName'](chain)
      },

      get () {
        return this.$store.state.ibcBridge[this.isSource ? 'sourceName' : 'destinationName']
      }
    },
    ...mapState(['user']),
  },

  watch: {
    value(value) {
      this.localValue = value
    }
  },

  methods: {
    ...mapMutations({
      setSourceName: 'ibcBridge/setSourceName',
      setDestinationName: 'ibcBridge/setDestinationName',
    }),
    onBlur() {
      this.$emit('blur')
      this.focused = false
    },
    onFocus() {
      this.$emit('focus')
      this.focused = true
    },

    input(value) {
      if (isNaN(value)) return

      if (this.token && getPrecision(value) > this.token.decimals) return

      this.localValue = value
      this.$emit('input', value)
    },
    onNetworkSelect(e) {
      this.selectedNetwork = e
    },
    onBalanceClick() {
      if (this.user) this.$emit('input', this.$tokenBalance(this.token.symbol, this.token.contract))
    }
  },

}
</script>

<style lang="scss">
.bridge-token {
  position: relative;
  width: 100%;
  display: flex;
  background: var(--selector-bg);
  border-radius: 8px;
  padding: 6px;
  gap: 10px;
  border: 1px solid transparent;
  transition: border-color 0.3s;
  .main {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  &:hover {
    border: 1px solid var(--border-color);
  }
  .label-and-balance {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--text-default);
    min-height: 18px;
    align-items: center;
  }
  .balance.clickable {
    cursor: pointer;
    transition: color 0.2s;
    &:hover {
      color: var(--text-default);
    }
  }
  .bottom {
    min-height: 18px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
  }
  .input-and-select {
    display: flex;
    align-items: center;
  }
  .amount {
    flex: 1;
    .el-input__inner:disabled {
      background-color: var(--background-color-base);
    }
    input {
      font-size: 1.4rem;
      padding: 0;
      height: auto;
      line-height: 1;
      &::placeholder {
        opacity: 0.6;
      }
    }
  }
  .input-after {
    display: flex;
    align-items: center;
  }
  .select-token-button {
    display: flex;
    align-items: center;
    //background: transparent;
    padding: 5px 9px;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      border-color: var(--text-disable);
      color: var(--text-disable);
    }
  }

  .el-input-group__append,
  .el-input__inner {
    border-color: var(--selector-bg);
    background: var(--selector-bg);
    border-color: transparent !important;
    //display: flex;
  }

  .el-button {
    border: 1px solid;
    //padding: 5px 5px;
  }

  input {
    background-color: var(--selector-bg);
  }
  .max-bage {
    font-size: 0.9rem;
  }

  .before {
    display: flex;
  }

  &.focused {
    border-color: var(--border-2-color);
  }
}

.token-input {
  width: 300px;

  .select-token-button {
    display: flex;
    align-items: center;

    padding: 5px 9px;
    border: 1px solid;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      border-color: white;
    }
  }

  .el-input__inner {
    height: 50px;
  }

  .el-button {
    border: 1px solid;
    //padding: 5px 5px;
  }

  input {
    background-color: var(--selector-bg);
  }
}

.token-select {
  padding: 10px 16px !important;
  border-radius: 4px !important;
}
.token-select,
.el-popup-parent--hidden {
  .token-select.scroller {
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

  .el-input-number .el-input {
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
