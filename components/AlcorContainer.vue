<template lang="pug">
#alcor-container.p-2(:class="{alternative}")
  slot

</template>

<script>
export default {
  props: ['alternative']
}
</script>

<style lang="scss">
#alcor-container {
  background-color: var(--background-color-third);
  border-radius: 16px;
  &.alternative {
    background: var(--background-color-base);
    border: var(--border-1);
  }
}
</style>
