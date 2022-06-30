<template lang="pug">
  el-dropdown.element-select(trigger="click")
    .selected
      span.selected-slot
        slot(name="selected")
      ChevronIcon
    el-dropdown-menu.element-options(slot="dropdown")
      el-dropdown-item.element-item(v-for="option in options")
        slot(name="option" :option="option")
</template>

<script>
import ChevronIcon from '@/components/ChevronIcon'

export default {
  components: { ChevronIcon },
  props: ['options', 'selected']
}
</script>

<style lang="scss" scoped>
.el-dropdown.element-select {
  width: 100%;
  background-color: #282828;
  border-radius: 2px;
  box-sizing: border-box;
  padding: 8px 10px;

  .selected {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;

    &-slot {
      width: 100%;
    }
  }
}

.el-dropdown-menu.element-options {
  background: var(--bg-alter-1);
  border: 2px solid rgb(63, 63, 63);
  padding: 5px 0;

  .element-item {
    display: flex;
    cursor: pointer;
    width: 260px;
    box-sizing: border-box;
    padding: 5px 10px;
    line-height: inherit;
    align-items: center;

    &:hover {
      background: var(--btn-default);
      color: #fff
    }
  }
}
</style>

