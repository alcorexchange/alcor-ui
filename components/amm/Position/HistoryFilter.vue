<template lang="pug">
.history-filter.d-flex.gap-8.pointer
  span(
    v-for='item in filters',
    :key='item.key',
    @click='$emit("input", item.key)',
    :class='{ active: value == item.key }'
  ) {{ item.title }}
</template>

<script>
export default {
  name: 'HistoryFilter',
  props: ['value'],
  data: () => ({
    filters: [
      { title: 'All', key: 'all' },
      { title: 'Swaps', key: 'swap' },
      { title: 'Add', key: 'mint' },
      { title: 'Remove', key: 'burn' },
      { title: 'Get Fees', key: 'collect' },
    ],
  }),
}
</script>

<style scoped lang="scss">
.history-filter {
  span {
    transition: color 0.3s;
    color: var(--text-disable);
    &.active,
    &:hover {
      color: var(--text-default);
    }
  }
}
</style>
