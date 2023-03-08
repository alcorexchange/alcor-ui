<template lang="pug">
.d-flex.gap-8.align-items-center
  .indicator(:class="{ 'in-range': inRange }")
  span {{ inRange ? 'In range': 'Out of range' }}
</template>

<script>
export default {
  props: ['inRange']
}
</script>

<style lang="scss" scoped>
span{
  font-size: 0.86rem;
}
.indicator {
  width: 4px;
  height: 4px;
  background: var(--disabled-indicator);
  border-radius: 50%;

  &.in-range {
    background: var(--access-indicator);
  }
}
</style>
