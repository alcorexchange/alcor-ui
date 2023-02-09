<template>
  <button
    :class="['alcor-button', { flat, alternative, access, orange, danger, outline, transparent, iconOnly, iconOnlyAlt, round, big, compact }]"
    @click.prevent="$emit('click')"
    v-bind="$attrs">
    <div class="inner">
      <slot />
    </div>
  </button>
</template>

<script>
export default {
  name: 'AlcorButton',
  props: {
    flat: {
      default: false,
      type: Boolean
    },
    alternative: {
      default: false,
      type: Boolean
    },
    access: {
      default: false,
      type: Boolean
    },
    danger: {
      default: false,
      type: Boolean
    },
    orange: {
      default: false,
      type: Boolean
    },
    outline: {
      default: false,
      type: Boolean
    },
    transparent: {
      default: false,
      type: Boolean
    },
    round: {
      default: false,
      type: Boolean
    },
    compact: {
      default: false,
      type: Boolean
    },
    big: {
      default: false,
      type: Boolean
    },
    iconOnly: {
      default: false,
      type: Boolean
    },
    iconOnlyAlt: {
      default: false,
      type: Boolean
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
