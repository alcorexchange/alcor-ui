<template lang="pug">
.pool-token-input(:class="{focused, notSelected: !!token, readonly}")
  .label-and-balance
    .label {{ renderLabel }}
    .balance.disable(v-if="token" :class="{clickable: !!user && !readonly}" @click="onBalanceClick") {{ $t('Balance') }}: {{ balance | commaFloat }}
  .main
    // TODO Make dot separation for decimal point instead comma
    el-input.amount(
      placeholder='0.0',
      v-if='!disabled',
      :value='localValue',
      :readonly="readonly"
      :tabindex="readonly ? '-1': '0'"
      inputmode="decimal"
      type="number"
      @input='input',
      @blur='onBlur',
      @focus="onFocus"
    )
    .input-after
      MaxBage.max-bage.mr-1(@max="$emit('input', $event)" :token="token" v-if="showMaxButton")
      SelectToken(
        :locked='!!locked',
        :token='token',
        :tokens='tokens',
        @selected='$emit("tokenSelected", $event)'
      )
  .bottom
    .left {{ renderBottom }}
    PreSelections(v-if="showMaxButton" :max="balance" @setValue="input($event)")
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
import { getPrecision } from '~/utils'
import PreSelections from '~/components/amm/PoolTokenInputPreSelect.vue'

export default {
  components: {
    SelectToken,
    MaxBage,
    WarnMessage,
    PreSelections,
  },

  props: ['token', 'tokens', 'disabled', 'value', 'locked', 'label', 'disabledMessage', 'readonly', 'tokenBalance'],

  data: () => ({
    localValue: null,
    search: '',
    focused: false,
  }),

  watch: {
    value: {
      handler(value) {
        this.localValue = value
      },
      immediate: true,
    },
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
      // keep only number and dot
      value = value.replaceAll('[^\\d.]', '')

      // remove comma ","
      value = value.replaceAll(',', '')

      if (isNaN(value)) return

      if (this.token && getPrecision(value) > (this.token.decimals ?? this.token.precision)) {
        // TO fixed precision
        const [num, fraction] = value.split('.')
        value = num + '.' + fraction.slice(0, this.token.decimals ?? this.token.precision)
      }

      this.localValue = value
      this.$emit('input', value)
    },
    onBalanceClick() {
      if (this.user)
        this.$emit('input', this.$tokenBalance(this.token.symbol ?? this.token.currency, this.token.contract))
    },
  },

  computed: {
    balance() {
      if (this.tokenBalance) return this.tokenBalance

      return this.$tokenBalance(this.token.symbol ?? this.token.currency, this.token.contract)
    },

    showMaxButton() {
      return !!this.token && this.user && !this.readonly
    },
    renderLabel() {
      return this.token ? this.label || '' : ''
    },
    renderBottom() {
      return this.token
        ? `~$${this.$tokenToUSD(this.localValue, this.token.symbol ?? this.token.currency, this.token.contract)}`
        : ''
    },
    ...mapState(['user']),
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
  .balance {
    pointer-events: none;
  }
  .balance.clickable {
    cursor: pointer;
    pointer-events: auto;
    transition: color 0.2s;
    &:hover {
      color: var(--text-default);
    }
  }
  .bottom {
    min-height: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 4px;
    .left {
      font-size: 0.8rem;
      display: flex;
      align-items: center;
    }
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
  .disabled-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--selector-bg);
    padding: 8px;
    gap: 4px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    .icon {
      font-size: 1.4rem;
    }
    .message {
      font-size: 0.86rem;
      text-align: center;
    }
  }
  &.focused {
    border-color: var(--border-2-color);
  }

  &.readonly {
    cursor: not-allowed;
    // for some reason input is not respecting not-allowed
    input {
      cursor: not-allowed;
    }
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
