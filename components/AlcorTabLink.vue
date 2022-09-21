<template lang="pug">
nuxt-link(:to="localePath(to, $i18n.locale)" class='alcor-tab-link')
  .inner
    slot
</template>

<script>
export default {
  name: 'AlcorButton',
  props: {
    to: {
      default: '/'
    }
  }
}
</script>

<style lang="scss">
.alcor-tab-link {
  color: var(--text-disable);
  border-bottom: 1px solid var(--tab-link-border);
  position: relative;

  &:hover {
    color: var(--text-disable);
  }

  &::after {
    transition: all .3s;
    opacity: 0;
    transform: scale(0, 1);
    content: '';
    position: absolute;
    display: block;
    width: 100%;
    height: 1px;
    background: var(--main-action-green);
  }

  .inner {
    padding: 8px;
  }

  &.active {
    color: var(--text-contrast);
  }

  &.active::after {
    opacity: 1;
    transform: scale(1, 1);
  }
}
</style>
