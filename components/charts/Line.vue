<template lang="pug">
.stacked-column-chart-component
  vue-apex-charts(type="area" :height="height || 400" :options="chartOptions" :series="series" v-if="series[0].data.length" ref="chart")

</template>

<script>
export default {
  props: ['series', 'color', 'width', 'height'],

  watch: {
    series() {
      if (!this.$refs?.chart?.chart) return

      this.$refs.chart.updateSeries(this.series, true)
    },
  },

  computed: {
    chartOptions() {
      return {
        markers: {
          strokeColors: '#111113',
        },
        theme: {
          mode: 'dark',
        },
        colors: [this.color || '#30B27C'],
        stroke: {
          curve: 'smooth',
          width: 2,
        },
        fill: {
          gradient: {
            shade: 'dark',
            type: 'horizontal',
            shadeIntensity: 0.5,
            gradientToColors: undefined,
            inverseColors: true,
            opacityFrom: 0.15,
            opacityTo: 0.7,
          },
        },
        chart: {
          id: 'Line',
          background: 'transparent',
          toolbar: {
            show: false,
          },
          zoom: {
            enabled: false,
          },
        },
        responsive: [
          {
            breakpoint: 480,
            options: {
              legend: {
                position: 'bottom',
                offsetX: -10,
                offsetY: 0,
              },
            },
          },
        ],
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
        tooltip: {
          x: { show: false },
        },
        yaxis: {
          opposite: true,
          labels: {
            show: true,
            formatter: (v) => {
              // TODO: use dynamic number.
              return v.toFixed(6)
            },
            style: {
              colors: 'var(--text-disable)',
              fontSize: '12px',
            },
          },
        },
        xaxis: {
          lines: { show: false },
          tooltip: {
            enabled: false,
          },
          type: 'datetime',
          labels: {
            show: true,
            style: {
              colors: 'var(--text-disable)',
              fontSize: '12px',
            },
          },
        },
        legend: {
          show: false,
        },
      }
    },
  },
}
</script>

<style lang="scss">
.stacked-column-chart-component {
  height: 100%;
  width: 100%;
}
</style>
