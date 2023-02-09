<template>
  <button
    class="el-button"
    @click="handleClick"
    :disabled="buttonDisabled || loading"
    :autofocus="autofocus"
    :type="nativeType"
    :class="[
      type ? 'el-button--' + type : '',
      buttonSize ? 'el-button--' + buttonSize : '',
      {
        'is-disabled': buttonDisabled,
        'is-loading': loading,
        'is-plain': plain,
        'is-round': round,
        'is-circle': circle
      }
    ]"
  >
    <i class="el-icon-loading" v-if="loading"></i>
    <i :class="icon" v-if="icon && !loading"></i>
    <span v-if="$slots.default"><slot></slot></span>
  </button>
</template>
<script>
export default {
  name: 'ElButton',

  inject: {
    elForm: {
      default: ''
    },
    elFormItem: {
      default: ''
    }
  },

  props: {
    type: {
      type: String,
      default: 'default'
    },
    size: String,
    icon: {
      type: String,
      default: ''
    },
    nativeType: {
      type: String,
      default: 'button'
    },
    loading: Boolean,
    disabled: Boolean,
    plain: Boolean,
    autofocus: Boolean,
    round: Boolean,
    circle: Boolean
  },

  computed: {
    _elFormItemSize() {
      return (this.elFormItem || {}).elFormItemSize
    },
    buttonSize() {
      return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size
    },
    buttonDisabled() {
      return this.$options.propsData.hasOwnProperty('disabled')
        ? this.disabled
        : (this.elForm || {}).disabled
    }
  },

  methods: {
    handleClick(evt) {
      this.$emit('click', evt)
    }
  }
}
</script>

<style scoped lang="scss">
button {
  border: none;
  font-family: 'Sans', sans-serif;
  color: inherit;
  font-size: 1rem;
  cursor: pointer;
}

.alcor-button {
  padding: 6px 10px;
  border-radius: var(--radius);
  color: var(--text-default);
  background: var(--btn-default);
  transition: all 0.3s;
  display: inline-block;

  &.alternative {
    background: var(--btn-alternative);
  }

  &.active {
    background: var(--hover);
  }
  &:disabled {
    cursor: not-allowed;
  }
}

.alcor-button .vs-icon {
  margin: 0 2px;
}

.alcor-button.flat {
  background: transparent;
}

.alcor-button:hover:not([disabled]) {
  background: var(--hover);
}

.alcor-button.flat:hover {
  box-shadow: none;
}

.alcor-button.round {
  border-radius: 40px;
  padding: 6px 14px;
}

.alcor-button.outline {
  background: transparent;
  border: 1px solid var(--main-action-green);
  color: var(--main-action-green);
}

.alcor-button.outline:hover {
  box-shadow: 0px 0px 30px 0px #54A05466 inset;
  background: var(--btn-outline);
}

.alcor-button.orange {
  background: linear-gradient(90deg, #854000 0%, #FF8A00 100%);
  border: 1px solid #854000;
}

.alcor-button.orange:hover {
  background: transparent;
  border: 1px solid #FF8A00;
  color: #FF8A00;
}

.alcor-button.orange:disabled {
  background: transparent;
  border: 1px solid #854000;
  color: #854000;
}

.alcor-button.danger {
  background: var(--main-action-red);
  border: 1px solid var(--main-action-red);
  color: var(--text-theme);
}

.alcor-button.danger:hover {
  background: transparent;
  color: var(--main-action-red);
  border: 1px solid var(--main-action-red);
}

.alcor-button.danger:disabled {
  background: var(--main-action-red);
  border: 1px solid var(--main-action-red);
  color: var(--text-theme);
  filter: brightness(50%);
  cursor: not-allowed;
}

.alcor-button.access {
  background: var(--main-action-green);
  border: 1px solid var(--main-action-green);
  color: var(--text-theme);
}

.alcor-button.access:hover {
  background: transparent;
  color: var(--main-action-green);
  border: 1px solid var(--main-action-green);
}

.alcor-button.access:disabled {
  background: var(--main-action-green);
  border: 1px solid var(--main-action-green);
  color: var(--text-theme);
  filter: brightness(50%);
  cursor: not-allowed;
}

.alcor-button.compact {
  padding: 4px 12px;
}

.alcor-button.big {
  padding: 12px;
  width: 135px;
  border-radius: var(--radius-2);
}

.inner {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  font-size: 14px;

  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
}

.iconOnly {
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.alcor-button.iconOnlyAlt {
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
