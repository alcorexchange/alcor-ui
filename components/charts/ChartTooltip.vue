<template lang="pug">
.chart-tooltip(v-show="visible" :style="{left: `${left}px`, top: `${top}px`}")
  span {{ price }}
</template>

<script>
export default {
  name: 'ChartTooltip',
  props: ['chart', 'series'],
  data: () => ({
    visible: false,
    price: 0,
    left: 0,
    top: 0,

    MARGIN: 12,
  }),
  mounted() {
    if (!this.chart) return
    this.chart.subscribeCrosshairMove((param) => {
      const chartElement = this.chart.chartElement()
      const tooltipWidth = this.$el.clientWidth
      const tooltipHeight = this.$el.clientHeight

      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartElement.containerWidth ||
        param.point.y < 0 ||
        param.point.y > chartElement.clientHeight
      ) {
        this.visible = false
      } else {
        this.visible = true
        const data = param.seriesData.get(this.series)
        const price = data.value !== undefined ? data.value : data.close
        this.price = Math.round(100 * price) / 100

        const y = param.point.y
        let left = param.point.x + this.MARGIN
        if (left > chartElement.clientWidth - tooltipWidth) {
          left = param.point.x - this.MARGIN - tooltipWidth
        }

        let top = y + this.MARGIN
        if (top > chartElement.clientHeight - tooltipHeight) {
          top = y - tooltipHeight - this.MARGIN
        }

        this.left = left
        this.top = top
      }
    })
  },
}
</script>

<style scoped lang="scss">
.chart-tooltip {
  position: absolute;
  z-index: 1000;
  pointer-events: none;
  border: 1px solid var(--border-color);
  background: var(--bg-alter-1);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  min-width: 100px;
}
</style>
