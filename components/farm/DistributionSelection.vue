<template lang="pug">
.distribution-selection
  .farm-create-section-title Select Distribution Duration
  .items(class="mt-2")
    .item(v-for="option in options" :class="{active: value == option.value}" @click="onItemClick(option)")
      .main
        .value {{ option.display }}
        .check(v-if="value == option.value")
          i.el-icon-circle-check
      //.daily.fs-12 TODO FIXME
        .left {{ option.daily }}
        .right Daily
</template>

<script>
export default {
  name: 'DistributionSelection',
  components: {},
  props: {
    value: {
      type: [String, Number],
      default: undefined,
    },
    options: {
      default: undefined,
    },
    token: {
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
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}
.item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  border-radius: 6px;
  border: 1px solid var(--light-border-color);
  padding: 10px;
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
.main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  // font-weight: bold;
  font-size: 16px;
}
.daily {
  display: flex;
  justify-content: space-between;
  padding: 6px 12px;
  border-radius: 80px;
  background: var(--background-color-base);
  color: var(--disabled-indicator);
}
.check {
  color: var(--main-green);
}

@media only screen and (max-width: 600px) {
  .main {
    font-size: 18px;
  }
}
</style>
