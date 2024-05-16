<template lang="pug">
.bars-chart-component
  vue-apex-charts(type="bar" :height="height" :options="chartOptions" :series="series" ref="chart")

</template>

<script>
export default {
  props: ['series', 'color', 'width', 'height', 'events'],

  watch: {
    series() {
      if (!this.$refs?.chart?.chart) return

      this.$refs.chart.updateSeries(this.series, true)
    },
  },

  computed: {
    chartOptions() {
      return {
        stroke: {
          curve: 'straight',
        },
        chart: {
          background: 'transparent',
          toolbar: {
            show: false,
          },
        },
        plotOptions: {
          bar: {},
        },
        theme: {
          mode: 'dark',
          palette: 'palette2',
        },
        dataLabels: {
          enabled: false,
        },
        grid: {
          xaxis: {
            lines: {
              show: false,
            },
          },

          yaxis: {
            lines: {
              show: false,
            },
          },
        },
        xaxis: {},
        legend: {
          show: false,
        },
        fill: {
          opacity: 1,
          pattern: {
            style: 'verticalLines',
            width: 1,
            height: 1,
            strokeWidth: 10,
          },
        },
      }
    },
  },
}
</script>

<style lang="scss">
.bars-chart-component {
  height: 100%;
  width: 100%;
}
</style>
