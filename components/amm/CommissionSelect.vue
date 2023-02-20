<template lang="pug">
.d-flex.gap-16.flex-wrap.justify-content-center
  .fee.d-flex.flex-column.justify-content-between(v-for="fee in options" @click="$emit('change', fee)" :class="{ active: selected.value == fee.value }")
    i.check-icon.el-icon-circle-check(v-if="selected.value == fee.value")
    .fs-24 {{ fee.value }}%
    .fs-14.disable.text-break {{ fee.desc }}
    el-tag.tag.d-flex.gap-4
      span(:class="{red: fee.selectedPercent < 1}") {{ fee.selectedPercent }}%
      span Selected
</template>

<script>
export default {
  props: ['selected', 'options']
}
</script>

<style lang="scss" scoped>
  .fee {
    .tag {
      background-color: var(--tag-color);
      border-color: var(--light-border-color);
    }
    width: 185px;
    height: 156px;
    padding: 16px 24px;
    cursor: pointer;

    background: rgba(60, 60, 67, 0.36);

    border: 1px solid rgba(120, 120, 135, 0.36);
    border-radius: 4px;
    position: relative;

    &.active {
      border: 1px solid #67C23A;
      background: #161617;

      i.check-icon {
        position: absolute;
        color: #67C23A;
        font-size: 24px;
        right: 26px;
      }
    }
  }
</style>

