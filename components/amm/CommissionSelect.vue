<template lang="pug">
.d-flex.gap-10.flex-wrap.justify-content-center
  .fee.d-flex.flex-column.gap-10.justify-content-between.align-items-start.p-2.br-8.border-hover(
    :class="{ 'border-active': selected == fee.value }"
    v-for="fee in options"
    @click="onItemClick(fee)"
  )
    i.check-icon.el-icon-circle-check(v-if="selected == fee.value")
    .fs-18 {{ fee.value / 10000 }}%
    .fs-12.disable.text-break {{ fee.desc }}
    .d-flex.gap-4.selected-percent(v-if="fee.selectedPercent !== undefined")
      .fs-12(:style="{ color: getColor(fee)}") {{ fee.selectedPercent }}%
      .fs-12() Selected
    .tag.selected-percent(v-else) Not created

</template>

<script>
export default {
  props: ['selected', 'options'],
  methods: {
    getColor(fee) {
      if (fee.selectedPercent < 1) return `var(--main-red)`
      if (fee.selectedPercent > 50) return `var(--main-green)`
      return `var(--text-default)`
    },
    onItemClick(fee) {
      if (this.selected != fee.value) this.$emit('change', fee.value)
    }
  }
}
</script>

<style lang="scss" scoped>
.fee {
  flex: 1;
  width: 120px;
  cursor: pointer;
  border: 1px solid var(--border-color);
  position: relative;
  transition: border 0.3s;
  &:hover{
    border: 1px solid var(--border-2-color);
  }

  &.border-active {
    border: 1px solid var(--border-active-color);
    .disable{
      color: var(--text-default);
    }
    i.check-icon {
      position: absolute;
      color: var(--border-active-color);
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
.selected-percent{
  background: var(--background-color-base);
  padding: 2px 4px;
  border-radius: 4px;
}
</style>

