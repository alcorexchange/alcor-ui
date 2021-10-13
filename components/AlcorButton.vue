<template>
  <button
    :class="[
      'alcor-button',
      { flat, alternative, iconOnly, iconOnlyAlt, round, compact }
    ]"
    @click.prevent="$emit('click')"
  >
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
    round: {
      default: false,
      type: Boolean
    },
    compact: {
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
}
.alcor-button .vs-icon {
  margin: 0 2px;
}
.alcor-button.flat {
  background: transparent;
}
.alcor-button:hover {
  background: var(--hover);
}
.alcor-button.flat:hover {
  box-shadow: none;
}
.alcor-button.round {
  border-radius: 40px;
  padding: 6px 14px;
}
.alcor-button.compact {
  padding: 4px 12px;
}
.inner {
  display: flex;
  justify-content: center;
  align-items: center;
}
.iconOnly {
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.iconOnlyAlt {
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
