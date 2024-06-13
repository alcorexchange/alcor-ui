<template lang="pug">
  .analytics-tabs
    .tab-item.pointer.hover-opacity(v-for="item in items" @click="changeTab(item.value)" :class="{ active: value === item.value }") {{ item.label }}
</template>

<script>
export default {
  name: 'AnalyticsTabs',
  // items is array of { label, value }
  props: ['items', 'value'],
  methods: {
    changeTab(v) {
      this.$emit('input', v)
    },
  },
}
</script>

<style lang="scss">
.analytics-tabs {
  display: flex;
  gap: 14px;
  font-size: 24px;
  .tab-item {
    padding: 12px 0;
    transition: 0.2s;
    color: var(--text-disable);
    &.active {
      color: var(--text-default);
    }
  }
}
</style>
