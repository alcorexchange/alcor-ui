<template lang="pug">
el-dropdown.element-select(trigger="click")
  .selected
    span.selected-slot
      slot(name="selected")
    ChevronIcon
  el-dropdown-menu.element-options(slot="dropdown")
    slot(name="preOptions")
    el-dropdown-item.element-item(v-if="!disableList" v-for="option in options" :key="option[keyField || 'id']")
      slot(name="option" :option="option")
</template>

<script>
import ChevronIcon from '@/components/ChevronIcon'

export default {
  components: { ChevronIcon },
  props: ['options', 'selected', 'keyField', 'disableList']
}
</script>

<style lang="scss" scoped>
.el-dropdown.element-select {
  width: 100%;
  background-color: var(--selector-bg);
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
  background: var(--background-color-base);
  border: var(--border-2);
  padding: 5px 0;

  max-height: 250px;
  overflow: scroll;

  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  .element-item {
    cursor: pointer;
    box-sizing: border-box;
    padding: 5px 10px;
    line-height: inherit;
    align-items: center;

    &:hover {
      background: var(--btn-default);
      color: var(--text-grey-thirdly);
    }
  }
}
</style>
