<template lang="pug">
.bridge-to-input(:class="{focused}")
  .before
    SelectNetwork(:networks="networksMock" v-model="selectedNetwork")
  .main
    el-input.amount(
      placeholder='Enter Adderss',
      :value='localValue',
      :disabled='inputDisabled'
      @input='input',
      @blur='onBlur',
      @focus="onFocus"
    )
    .input-after.d-flex.items-center.gap-4
      .address-status(v-if="addressStatus" :class="addressStatus || ''")
        i.el-icon-loading(v-if="addressStatus === 'loading'")
        i.el-icon-check(v-if="addressStatus === 'valid'")
        i.el-icon-close(v-if="addressStatus === 'invalid'")
      AlcorButton(iconOnly @click="onPaste")
        i.el-icon-copy-document
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'
import SelectNetwork from '@/components/modals/SelectNetwork'
import AlcorButton from '@/components/AlcorButton'
import { getMultyEndRpc } from '~/utils/eosjs'

export default {
  components: {
    SelectNetwork,
    AlcorButton
  },

  props: [
    'value',
    'label',
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
    ],
    addressStatus: undefined, // 'valid', 'invalid', 'loading'
  }),

  computed: {
    selectedNetwork: {
      set (chain) {
        this.setDestinationName(chain)
        this.validateAddress()
      },

      get () {
        return this.$store.state.ibcBridge.destinationName
      }
    },

    inputDisabled() {
      return !this.selectedNetwork
    },

    ...mapGetters({
      destination: 'ibcBridge/destination',
    })
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

    async validateAddress() {
      const { destination } = this
      if (!destination || !this.localValue || (this.localValue && this.localValue.length < 4)) {
        this.addressStatus = undefined
        return
      }
      const destinationRpc = getMultyEndRpc(Object.keys(destination.client_nodes))
      try {
        this.addressStatus = 'loading'
        await destinationRpc.get_account(this.localValue)
        this.addressStatus = 'valid'
      } catch (e) {
        this.addressStatus = 'invalid'
      }
    },

    async onPaste() {
      try {
        const res = await navigator.clipboard.readText()
        this.localValue = res
      } catch (e) {
      }
    },
    onBlur() {
      this.$emit('blur')
      this.focused = false
    },
    onFocus() {
      this.$emit('focus')
      this.focused = true
    },

    input(value) {
      this.localValue = value
      this.$emit('input', value)
      this.validateAddress()
    },
    onNetworkSelect(e) {
      this.selectedNetwork = e
    },
  },

}
</script>

<style lang="scss">
.bridge-to-input {
  position: relative;
  width: 100%;
  display: flex;
  background: var(--selector-bg);
  border-radius: 8px;
  padding: 6px;
  gap: 10px;
  border: 1px solid transparent;
  transition: border-color 0.3s;
  min-height: 94px;
  .main {
    display: flex;
    align-self: center;
    gap: 4px;
    flex: 1;
  }
  &:hover {
    border: 1px solid var(--border-color);
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
  .address-status {
    &.loading { color: var(--text-default) }
    &.valid { color: var(--main-green) }
    &.invalid { color: var(--main-red) }
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
