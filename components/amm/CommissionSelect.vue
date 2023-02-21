<template lang="pug">
.d-flex.gap-10.flex-wrap.justify-content-center
  .fee.d-flex.flex-column.gap-10.justify-content-between.p-2.br-8.grey-border.border-hover(
    :class="{ 'border-active': selected == fee.value }"
    v-for="fee in options"
    @click="$emit('change', fee.value)"
  )
    i.check-icon.el-icon-circle-check(v-if="selected == fee.value")
    .fs-18 {{ fee.value / 10000 }}%
    .fs-12.disable.text-break {{ fee.desc }}
    .d-flex.gap-4.disable(v-if="fee.selectedPercent != undefined")
      .fs-12(:class="{ red: fee.selectedPercent < 1, 'color-action': selected == fee.value }") {{ fee.selectedPercent }}%
      .fs-12(:class="{ 'color-action': selected == fee.value }") Selected
    .tag(v-else="fee.notCreated") Not created

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

    .tag {
      border-radius: 0.5rem;
      padding: 4px 6px;
      font-size: 10px;
      background: var(--bg-alter-1);
    }
  }
</style>

