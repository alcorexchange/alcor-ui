<template lang="pug">
.info-container-component.p-3.br-8.fs-14(:class="{access}")
  slot
</template>

<script>
export default {
  props: ['access']
}
</script>

<style lang="scss" scoped>
.info-container-component {
  background: var(--background-color-base);
  color: var(--text-disable);

  &.access {
    color: var(--access-text-color);
    background: var(--access-bg);
  }
}
</style>
