<template lang="pug">
el-select(
  class="alcor-select"
  popper-class="alcor-select___dropdown"
  :value="value"
  @change="value => { $emit('update:value', value); $emit('change', value); }"
  v-bind="$attrs"
)
  template(#prefix)
    slot(name="prefix" :value="value")
  el-option(
    v-for="option in options"
    :key="option.value"
    :label="option.label"
    :value="option.value"
    :disabled="option.disabled"
  )
    slot(name="option" :option="option")

</template>

<script>
export default {
  name: 'AlcorSelect',
  props: ['options', 'value']
}
</script>

<style lang="scss">
.alcor-select {

  & .el-input.is-focus .el-input__inner,
  & .el-input.is-active .el-input__inner,
  & .el-input__inner:focus,
  &:hover .el-input__inner {
    border-color: var(--main-green) !important;
  }

  & .el-input__inner,
  & .el-input--prefix .el-input__inner {
    background: var(--select-color);
    border-radius: 4px;
    padding-left: 35px;
  }

  & .el-input__prefix {
    display: flex;
    left: 12px;
    align-items: center;
  }

}

.alcor-select___dropdown {
  border-radius: 4px !important;
  margin-top: 4px !important;

  & .el-scrollbar {
    border-radius: 4px !important;
  }

  & .el-scrollbar__wrap {
    background: var(--select-color);
    overflow-x: hidden;
  }

  & .el-select-dropdown__item {
    padding: 0 10px;
  }

}
</style>
