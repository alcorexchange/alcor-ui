<template lang="pug">
.d-flex.align-items-center.gap-16.p-1
  NuxtLink.item(:to="localeRoute('/bridge_new')").fs-18 Bridge
  NuxtLink.item(:to="localeRoute('/bridge_new/history')").fs-18 History
</template>

<script>
export default {
  name: 'BridgeHeader'
}
</script>

<style lang="scss">
.item {
  color: var(--text-disable);
  &:hover {
    color: var(--text-default);
  }
}
.active {
  color: var(--text-default)
}
</style>
