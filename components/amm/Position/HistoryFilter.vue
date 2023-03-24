<template lang="pug">
.history-filter.d-flex.gap-8.pointer
  span(
    v-for='item in filters',
    :key='item',
    @click='$emit("input", item)',
    :class='{ active: value == item }'
  ) {{ item }}
</template>

<script>
export default {
  name: 'HistoryFilter',
  props: ['value'],
  data: () => ({
    filters: ['All', 'Swaps', 'Add', 'Remove'],
  }),
}
</script>

<style scoped lang="scss">
.history-filter {
  span {
    transition: color 0.3s;
    color: var(--text-disable);
    &.active, &:hover {
      color: var(--text-default);
    }
  }
}
</style>
