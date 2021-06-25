<template lang="pug">
  label.pool-select-item(:class="{isSelected}")
    input(
      class="checkbox"
      type="radio"
      :checked="isSelected"
      :value="value"
      @change="$emit('change', $event.target.value)"
    )
    .content
      .title-and-icon
        span.title {{title}}
        i.el-icon-check(v-if="isSelected")
      .description {{description}}
</template>

<script>
export default {
  model: {
    prop: 'modelValue',
    event: 'change'
  },
  props: {
    title: { type: String, default: '' },
    modelValue: { default: '' },
    value: { type: Number, default: undefined },
    description: {
      default: ''
    }
  },
  computed: {
    isSelected() {
      return this.modelValue == this.value
    }
  }
}
</script>

<style lang="scss" scoped>
.pool-select-item {
  display: block;
  position: relative;
  cursor: pointer;
  user-select: none;
  border: 1px solid var(--border-color);
  padding: 6px;
  border-radius: var(--radius-2);
  transition: border 0.3s;
  &.isSelected {
    border: 1px solid var(--main-green);
  }
}
input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}
.content {
  display: flex;
  flex-direction: column;
}
.title-and-icon {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .title {
    font-weight: bold;
  }
  .el-icon-check {
    color: white;
    background: var(--main-green);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
