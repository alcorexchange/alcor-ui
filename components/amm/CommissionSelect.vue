<template lang="pug">
.d-flex.gap-10.flex-wrap.justify-content-center
  .fee.d-flex.flex-column.gap-10.justify-content-between.p-2.br-8.grey-border.border-hover(
    :class="{ 'border-active': selected.value == fee.value }"
    v-for="fee in options"
    @click="$emit('change', fee)"
  )
    i.check-icon.el-icon-circle-check(v-if="selected.value == fee.value")
    .fs-18 {{ fee.value / 10000 }}%
    .fs-12.disable.text-break {{ fee.desc }}
    .d-flex.gap-4.disable
      .fs-12(:class="{ red: fee.selectedPercent < 1, 'color-action': selected.value == fee.value }") {{ fee.selectedPercent }}%
      .fs-12(:class="{ 'color-action': selected.value == fee.value }") Selected
</template>

<script>
export default {
  props: ['selected', 'options']
}
</script>

<style lang="scss" scoped>
  .fee {
    width: 120px;
    cursor: pointer;

    position: relative;

    &.border-active {
      i.check-icon {
        position: absolute;
        color: #67C23A;
        font-size: 18px;
        right: 7px;
      }
    }
  }
</style>

