<template lang="pug">
el-collapse#alcor-collapse
  el-collapse-item
    template(slot="title")
      slot(name="title")
    slot

</template>

<style lang="scss">
#alcor-collapse {
  .el-collapse-item {
    &__header {
      color: var(--text-default);
      padding: 15px;
      &.is-active {
        border-radius: 10px 10px 0 0;
      }
    }
    &__wrap {
      border-radius: 0 0 10px 10px;
      padding: 0px 15px;
    }
  }
}

</style>
