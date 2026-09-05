<template lang="pug">
.d-flex.gap-4.align-items-center
  .indicator(:class="{ 'in-range': inRange }")
  span {{ inRange ? 'In range': 'Out of range' }}
</template>

<script>
export default {
  props: ['inRange'],
}
</script>

<style lang="scss" scoped>
span {
  font-size: 0.68rem;
  white-space: nowrap;
}
.indicator {
  width: 8px;
  height: 8px;
  background: var(--disabled-indicator);
  border-radius: 50%;

  &.in-range {
    background: var(--access-indicator);
  }
}
</style>
