<template lang="pug">
.alcor-switch(
  @click='$emit("toggle")',
  :class='{ oneActive: active === "one" }'
)
  .background(
    :style='{ width: `${backgroundWidth}px`, left: active == "one" ? "2px" : `${2 + oneWidth}px` }'
  )
  .item.one.disable(:class='{ active: active === "one" }', ref='one') {{ one }}
  .item.two.disable(:class='{ active: active === "two" }', ref='two') {{ two }}
</template>

<script>
export default {
  props: {
    active: {
      default: 'one',
    },
    one: {},
    two: {},
  },
  data: () => ({
    oneWidth: 0,
    twoWidth: 0,
  }),
  mounted() {
    this.calcDimentions()
  },
  methods: {
    calcDimentions() {
      this.$nextTick(() => {
        this.oneWidth = this.$refs.one.getBoundingClientRect().width
        this.twoWidth = this.$refs.two.getBoundingClientRect().width
      })
    },
  },
  computed: {
    backgroundWidth() {
      return this.active == 'one' ? this.oneWidth : this.twoWidth
    },
  },
  watch: {
    one() {
      this.calcDimentions()
    },
    two() {
      this.calcDimentions()
    },
  },
}
</script>

<style scoped lang="scss">
.alcor-switch {
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  padding: 2px;
  border-radius: 6px;
  background: var(--background-color-base);
  user-select: none;
  position: relative;
  &:hover .item {
    color: var(--text-default);
  }
  .item {
    position: relative;
    z-index: 2;
    transition: color 0.3s;
    padding: 2px 6px;
    border-radius: 4px;
    &.active {
      color: var(--text-default);
    }
  }
  .background {
    transition: all 0.3s;
    border-radius: 4px;
    top: 2px;
    z-index: 0;
    position: absolute;
    height: calc(100% - 4px); // 2 bottom padding
    background: var(--btn-active);
  }
  &.oneActive {
    .background {
    }
  }
}
</style>

