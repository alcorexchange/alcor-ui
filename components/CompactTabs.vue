<template lang="pug">
#compact-tabs-component.d-flex.w-100
  .tab.pointer(
    v-for="{ label, value } in tabs"
    :class="{ active: value === active }"
    @click="$emit('update:active', value)"
  )
    .p-2.d-flex.align-items-center.justify-content-center.gap-8
      slot(name="tab" :tab="{ label, value }") {{ label }}
</template>

<script>
export default {
  props: ['tabs', 'active']
}
</script>

<style scoped lang="scss">
.tab {
  -ms-flex: 1;
  flex: 1;
  border: var(--border-1);
  border-left: 0;
  position: relative;
  color: var(--text-disable);

  &:last-of-type {
    border-right: 0;
  }

  &::after {
    transition: all .3s;
    opacity: 0;
    transform: scale(0, 1);
    content: '';
    position: absolute;
    display: block;
    width: 100%;
    border-bottom: 1px solid white;
  }

  &.active {
    color: var(--text-default);
  }

  &.active::after {
    opacity: 1;
    transform: scale(1, 1);
  }

}
</style>
