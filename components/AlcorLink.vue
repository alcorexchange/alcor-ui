<template lang="pug">
nuxt-link(:to="localePath(to, $i18n.locale)" :class="['alcor-button', { big, flat, iconOnly, iconOnlyAlt }]" :exact='exact' @click.prevent="$emit('click')")
  .inner
    slot
</template>

<script>
export default {
  name: 'AlcorButton',
  props: {
    to: {
      default: '/'
    },
    big: {
      default: false,
      type: Boolean
    },
    exact: {
      default: false
    },
    flat: {
      default: false,
      type: Boolean
    },
    iconOnly: {
      default: false
    },
    iconOnlyAlt: {
      default: false
    },
    green: {
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
  color: var(--text-default) !important;
  background: var(--btn-default);
  transition: all 0.3s;
  display: inline-block;
  text-decoration: none;
}

.alcor-button.big {
  padding: 17px 12px;
  width: 135px;
  border-radius: var(--radius-2);
}

.alcor-button.active {
  background: var(--background-color-third);
}

.alcor-button .vs-icon {
  margin: 0 2px;
}

.alcor-button.flat {
  background: transparent;
}

.alcor-button:hover {
  background: var(--background-color-third);
}

.alcor-button.flat:hover {
  box-shadow: none;
}

.inner {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
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
