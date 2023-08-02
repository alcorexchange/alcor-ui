<template lang="pug">
.fee-tier-selection
  .farm-create-section-title Select Fee Tier
  .items(class="mt-2")
    .item(v-for="option in options" :class="{active: value == option.value}")
      .value {{ option.value }}%
      .check(v-if="value == option.value")
        i.el-icon-circle-check
</template>

<script>
export default {
  name: 'FeeTierSelection',
  components: {},
  props: {
    value: {
      type: [String, Number],
      default: undefined,
    },
    options: {
      default: undefined,
    },
  },
}
</script>

<style scoped lang="scss">
.fee-tier-selection {
  .items {
    user-select: none;
    display: flex;
    gap: 8px;
    .item {
      flex: 1;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid var(--light-border-color);
      padding: 10px 16px;
      font-weight: bold;
      font-size: 24px;
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        background: var(--hover);
      }
      &.active {
        border-color: var(--main-green);
        background: var(--hover);
      }
    }
    .check {
      color: var(--main-green);
    }
  }
}
</style>
