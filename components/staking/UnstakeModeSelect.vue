<template lang="pug">
.d-flex.gap-10.flex-wrap.justify-content-center.mt-2
  .item.d-flex.flex-column.align-items-start.p-2.br-8.border-hover(
    :class="{ 'border-active': selected == 'delayed' }"
    @click="onItemClick('delayed')"
  )
    i.check-icon.el-icon-circle-check(v-if="selected == 'delayed'")
    .fs-18.d-flex.gap-4.align-items-center.pb-1
      span Delayed
      ElTooltip()
        i.el-icon-info.muted
        template(#content)
          div(style="max-width: 400px") Withdrawals are typically processed within ONE day. If the contract lacks sufficient funds at the time of your request, please allow 3 to 6 days for the completion of batch unstakes to replenish the balance.
    div.mt-auto
    .fs-12.disable.text-break Normal Unstake
    .d-flex.gap-4 {{ delayedReceive | commaFloat(8) }} {{ network.baseToken.symbol }}

  .item.d-flex.flex-column.align-items-start.p-2.br-8.border-hover(
    :class="{ 'border-active': selected == 'instant' }"
    @click="onItemClick('instant')"
  )
    i.check-icon.el-icon-circle-check(v-if="selected == 'instant'")
    .fs-18.d-flex.gap-4.align-items-center.pb-1
      span Instant Swap
      Settings
        i.el-icon-s-operation.pointer.muted.settings-icon
    div.mt-auto
      .price-impact-warning.fs-12(v-if="showPriceImpactWarning") {{ priceImpact }}% Price Impact
      i.el-icon-refresh.rotate-reverse.h-fit(v-if="loading")
      .d-flex.gap-4(v-else) {{ (swapReceive || 0.00) | commaFloat(8) }} {{ network.baseToken.symbol }}
</template>

<script>
import Settings from '~/components/amm/Settings'
export default {
  components: {
    Settings,
  },
  props: ['selected', 'delayedReceive', 'swapReceive', 'loading', 'priceImpact', 'network'],
  computed: {
    showPriceImpactWarning() {
      const value = parseFloat(this.priceImpact)
      if (!value) return false
      return value >= 5
    },
  },
  methods: {
    onItemClick(mode) {
      if (this.selected != mode) this.$emit('change', mode)
    },
  },
}
</script>

<style lang="scss" scoped>
.item {
  flex: 1;
  width: 120px;
  cursor: pointer;
  border: 1px solid var(--border-color);
  position: relative;
  transition: border 0.3s;
  &:hover {
    border: 1px solid var(--border-2-color);
  }

  .settings-icon:hover {
    opacity: 1;
  }
  &.border-active {
    border: 1px solid var(--border-active-color);

    i.check-icon {
      position: absolute;
      color: var(--border-active-color);
      font-size: 18px;
      right: 7px;
    }
  }
  .price-impact-warning {
    color: var(--main-red);
  }
}
</style>
