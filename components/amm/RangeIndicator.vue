<template lang="pug">
.d-flex.gap-8.align-items-center.wrapper
  .indicator(:class="{ 'in-range': inRange }")
  .fs-16 {{ inRange ? 'In range': 'Out of range' }}
</template>

<script>
export default {
  props: ['inRange']
}
</script>

<style lang="scss" scoped>
.wrapper {
  border: var(--border-1);
  background: var(--bg-alter-2);
  border-radius: 8px;
  padding: 0 10px;
}

.indicator {
  width: 14px;
  height: 14px;

  background: var(--disabled-indicator);
  border-radius: 4px;

  &.in-range {
    background: var(--access-indicator);
  }
}
</style>
