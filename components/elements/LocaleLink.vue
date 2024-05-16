<template lang="pug">
nuxt-link.link(:to="localePath(to, $i18n.locale)")
  slot
</template>

<script>
export default {
  props: ['to']
}
</script>

<style lang="scss" scoped>
.link {
  color: var(--main-action-green);

  &:hover {
    opacity: 0.8;
  }
}
</style>
