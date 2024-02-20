<template lang="pug">
.fee-tier-selection
  .farm-create-section-title Select Fee Tier
  .items.mt-1
    .item(v-for="option in options" :class="{active: value == option.value}" @click="onItemClick(option)")
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

  methods: {
    onItemClick(option) {
      this.$emit('input', option.value)
    },
  },
}
</script>

<style scoped lang="scss">
.items {
  user-select: none;
  display: flex;
  gap: 8px;
  .check {
    color: var(--main-green);
  }
}
.item {
  /* flex: 1; */
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--light-border-color);
  padding: 8px 20px;
  width: 33%;
  font-weight: bold;
  font-size: 15px;
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

@media only screen and (max-width: 480px) {
  .item {
    padding: 8px 12px;
    font-size: 18px;
  }
}
</style>
