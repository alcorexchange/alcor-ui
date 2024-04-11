<template lang="pug">
.d-flex.gap-10.flex-wrap.justify-content-center.mt-2
  .fee.d-flex.flex-column.gap-10.justify-content-between.align-items-start.p-2.br-8.border-hover(
    :class="{ 'border-active': selected == 'instant' }"
    @click="onItemClick('instant')"
  )
    i.check-icon.el-icon-circle-check(v-if="selected == 'instant'")
    .fs-18
      span Instant
    .fs-12.disable.text-break Instant using Swap
    .d-flex.gap-4.selected-percent {{ swapReceive }}

  .fee.d-flex.flex-column.gap-10.justify-content-between.align-items-start.p-2.br-8.border-hover(
    :class="{ 'border-active': selected == 'delayed' }"
    @click="onItemClick('delayed')"
  )
    i.check-icon.el-icon-circle-check(v-if="selected == 'delayed'")
    .fs-18.d-flex.gap-4.align-items-center
      span Delayed
      ElTooltip()
        i.el-icon-info.muted
        template(#content)
          div(style="max-width: 400px") Withdrawals require a minimum of 3 days to process. If the contract lacks sufficient funds at the time of your request, please allow 3 to 6 days for the completion of batch unstakes to replenish the balance. We're continuously working on enhancing this process for efficiency. In instances where additional funds are staked during your withdrawal period, these may be utilized to expedite your transaction.
    .fs-12.disable.text-break Normal Unstake
    .d-flex.gap-4.selected-percent {{ delayedReceive }}
</template>

<script>
export default {
  props: ['selected', 'delayedReceive', 'swapReceive'],
  methods: {
    onItemClick(mode) {
      if (this.selected != mode) this.$emit('change', mode)
    },
  },
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
  &:hover {
    border: 1px solid var(--border-2-color);
  }

  &.border-active {
    border: 1px solid var(--border-active-color);
    .disable {
      color: var(--text-default);
    }
    i.check-icon {
      position: absolute;
      color: var(--border-active-color);
      font-size: 18px;
      right: 7px;
    }
  }
}
</style>
