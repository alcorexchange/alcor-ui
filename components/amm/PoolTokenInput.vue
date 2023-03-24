<template lang="pug">
.pool-token-input(:class="{focused, notSelected: !!token}")
  .label-and-balance
    .label {{ renderLabel }}
    .balance.disable(v-if="token") Balance: {{ $tokenBalance(token.symbol, token.contract) | commaFloat }} 123
  .main
    // TODO Make dot separation for decimal point instead comma
    el-input.amount(
      placeholder='0.0',
      v-if='!disabled',
      :value='localValue',
      @input='input',
      @blur='onBlur',
      @focus="onFocus"
    )
    .input-after
      MaxBage.max-bage.mr-1(@max="$emit('input', $event)" :token="token" v-if="!!token")
      //- v-if='showMaxButton',
      SelectToken(
        :locked='!!locked',
        :token='token',
        :tokens='tokens',
        @selected='$emit("tokenSelected", $event)'
      )
  .bottom {{ renderBottom }}
  .disabled-overlay(v-if="disabled")
    .icon
      i.el-icon-lock
    .message(v-if="disabledMessage") {{ disabledMessage }}
</template>

<script>
import { mapState } from 'vuex'
import SelectToken from '~/components/modals/amm/SelectToken2'
import MaxBage from '~/components/UI/input/MaxBage'
import WarnMessage from '~/components/UI/input/WarnMessage'

export default {
  components: {
    SelectToken,
    MaxBage,
    WarnMessage,
  },

  props: [
    'token',
    'tokens',
    'disabled',
    'value',
    'showMaxButton',
    'locked',
    'label',
    'disabledMessage'
  ], // TODO Disabled

  data: () => ({
    localValue: null,
    search: '',
    focused: false
  }),

  watch: {
    value(value) {
      this.localValue = value
    }
  },

  methods: {
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

      this.localValue = value
      this.$emit('input', value)
    }
  },

  computed: {
    renderLabel() {
      return this.token ? (this.label || '') : ''
    },
    renderBottom() {
      return this.token ? `~$${this.$tokenToUSD(this.localValue, this.token.symbol, this.token.contract)}` : ''
    },
    ...mapState(['user'])
  },
}
</script>

<style lang="scss">
.pool-token-input {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--selector-bg);
  border-radius: 8px;
  padding: 8px;
  border: 1px solid transparent;
  transition: border-color 0.3s;
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
  .bottom{
    min-height: 18px;
    font-size: 0.8rem;
    display: flex; align-items: center;
  }
  .main {
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
      &::placeholder{
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
  .max-bage{
    font-size: 0.9rem;
  }
  .disabled-overlay{
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: var(--selector-bg);
    padding: 8px;
    gap: 4px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    .icon{
      font-size: 1.4rem;
    }
    .message{
      font-size: 0.86rem;
      text-align: center;
    }
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
