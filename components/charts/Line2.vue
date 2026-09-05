<template lang="pug">
.chart-wrapper
  .line-chart(ref="chart" class='chart')
  ChartTooltip.chart-tooltip(:series="localSeries" :chart="chart" v-if="chart") 123 test data
</template>

<script>
import { createChart } from 'lightweight-charts'
import ChartTooltip from './ChartTooltip.vue'

export default {
  name: 'LineChart',
  components: {
    ChartTooltip,
  },
  props: ['series', 'color', 'height'],
  data: () => ({
    chart: undefined,
    localSeries: undefined,
  }),
  watch: {
    series(newSeries) {
      this.updateSeries(newSeries)
    },
    color(c) {
      const color = c || '#30B27C'
      this.localSeries?.applyOptions({
        lineColor: color,
        topColor: color,
        bottomColor: color + '00',
      })
    },
  },

  mounted() {
    this.chart = createChart(this.$refs.chart, {
      autoSize: true,
      layout: {
        background: {
          color: 'transparent',
        },
        textColor: 'gray',
      },
      grid: {
        horzLines: { visible: false },
        vertLines: { visible: false },
      },
      crosshair: {
        horzLine: { visible: false },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderColor: 'gray',
      },
    })

    const color = this.color || '#30B27C'
    this.localSeries = this.chart.addAreaSeries({
      lineColor: color,
      topColor: color,
      bottomColor: color + '00',
      lineWidth: 2,
      // TODO: manage decimals
      priceFormat: {
        // type: 'price',
        type: 'custom',
        formatter: (v) => v.toFixed(6),
        minMove: 0.000001,
      },
    })
    this.localSeries.setData(this.series)
    this.chart.timeScale().fitContent()
  },

  destroyed() {
    if (this.chart) this.chart.remove()
  },

  methods: {
    updateSeries(newSeries) {
      if (!newSeries) return
      this.localSeries.setData(newSeries)
      this.chart.timeScale().fitContent()
    },
    // resizeHandler() {
    //   console.log('resize call')
    //   if (!this.chart || !this.$refs.chart) return
    //   const dimensions = this.$refs.chart.getBoundingClientRect()
    //   this.chart.resize(dimensions.width, dimensions.height)
    // },
  },
}
</script>

<style scoped lang="scss">
.chart-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  .chart {
    height: 100%;
    flex: 1;
  }
}
</style>
