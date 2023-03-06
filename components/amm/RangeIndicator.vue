<template lang="pug">
.d-flex.gap-8.align-items-center
  .indicator(:class="{ 'in-range': inRange }")
  .fs-16 {{ inRange ? 'In range': 'Out of range' }}
</template>

<script>
export default {
  props: ['inRange']
}
</script>

<style lang="scss" scoped>

.indicator {
  width: 10px;
  height: 10px;

  background: var(--disabled-indicator);
  border-radius: 50%;

  &.in-range {
    background: var(--access-indicator);
  }
}
</style>
