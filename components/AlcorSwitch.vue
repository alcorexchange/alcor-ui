<template lang="pug">
.alcor-switch(@click='$emit("toggle")')
  .item.one.disable(:class='{ active: active === "one" }') {{ one }}
  .item.two.disable(:class='{ active: active === "two" }') {{ two }}
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
  &:hover .item{
    color: var(--text-default);
  }
  .item {
    transition: color 0.3s;
    padding: 2px 6px;
    border-radius: 4px;
    &.active {
      color: var(--text-default);
      background: var(--btn-active);
    }
  }
}
</style>

