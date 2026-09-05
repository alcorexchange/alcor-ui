<template lang="pug">
.farm-token-input(:class="{focused, notSelected: !!token}")
  .label-and-balance
    .label {{ renderLabel }}
    .balance.disable(v-if="token" @click="onBalanceClick" :class="{clickable: !!user}") {{ $t('Balance') }}: {{ $tokenBalance(token.currency, token.contract) | commaFloat }}
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
      MaxBage.max-bage.mr-1(@max="$emit('input', $event)" :token="token" v-if="!!token && user")
      SelectToken(
        :locked='!!locked',
        :token='token',
        :tokens='tokens',
        @selected='$emit("tokenSelected", $event)'
      )
  .bottom
    .bottom-start {{ renderBottom }}
    .bottom-end(v-if="canRemove")
      AlcorButton(@click="$emit('remove')" bordered class="remove-button")
        i.el-icon-minus
        span(class="fs-12") Remove Reward
</template>

<script>
import { mapState } from 'vuex'
import AlcorButton from '@/components/AlcorButton'
import SelectToken from '~/components/modals/amm/SelectToken2'
import MaxBage from '~/components/UI/input/MaxBage'
import { getPrecision } from '~/utils'

export default {
  components: {
    SelectToken,
    MaxBage,
    AlcorButton,
  },

  props: [
    'token',
    'tokens',
    'disabled',
    'value',
    'locked',
    'label',
    'canRemove',
  ],

  data: () => ({
    localValue: null,
    search: '',
    focused: false,
  }),

  watch: {
    value(value) {
      this.localValue = value
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
      if (isNaN(value)) return

      if (this.token && getPrecision(value) > this.token.decimals) return

      this.localValue = value
      this.$emit('input', value)
    },
    onBalanceClick() {
      if (this.user)
        this.$emit(
          'input',
          this.$tokenBalance(this.token.currency, this.token.contract)
        )
    },
  },

  computed: {
    renderLabel() {
      return this.token ? this.label || '' : ''
    },
    renderBottom() {
      return this.token
        ? `~$${this.$tokenToUSD(
            this.localValue,
            this.token.currency,
            this.token.contract
          )}`
        : ''
    },
    ...mapState(['user']),
  },
}
</script>

<style lang="scss">
.farm-token-input {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
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
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 4px;
  }

  .remove-button {
    border-color: var(--main-red) !important;
    color: var(--main-red) !important;
    padding: 4px 8px;
    .inner {
      gap: 4px !important;
    }
    &:hover {
      background: var(--hover);
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
