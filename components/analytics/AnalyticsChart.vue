<template lang="pug">
AlcorContainer.analytics-chart
  .header.d-flex
    .d-flex
      .mode-items
        .mode(v-for="item in modes" :class="{active: selectedMode === item.value}" @click="selectedMode = item.value") {{ item.value }}
    .d-flex
      .mode-items
        .mode(v-for="item in resolutions" :class="{active: selectedResolution === item.value}" @click="selectedResolution = item.value") {{ item.title }}
  .chart-container
    client-only
      VueApexCharts(width='100%' height="100%" type="area" :options='chartOptions' :series='series' ref="chart" class="chart")
</template>

<script>
import AlcorContainer from '@/components/AlcorContainer'
import AlcorRadio from '@/components/AlcorRadio'
export default {
  name: 'AnalyticsChart',
  components: {
    AlcorContainer,
    AlcorRadio,
  },
  data() {
    return {
      chartData: [],
      selectedMode: 'TVL',
      selectedResolution: '1M',
      modes: [
        { value: 'TVL' },
        { value: 'Volume' },
        { value: 'Depth TVL' },
        { value: 'Fees' },
      ],
      resolutions: [
        { title: '1D', value: '1D' },
        { title: '7D', value: '1W' },
        { title: '1M', value: '1M' },
        { title: 'All', value: 'ALL' },
      ],
    }
  },
  computed: {
    series() {
      const currentY = (item) => {
        if (this.selectedMode === 'TVL') return item.totalValueLocked.toFixed(2)
        if (this.selectedMode === 'Volume')
          return (item.spotTradingVolume + item.swapTradingVolume).toFixed(2)
        if (this.selectedMode === 'Depth TVL')
          // TODO: calculate depth TVL
          return (item.spotTradingVolume + item.swapTradingVolume).toFixed(2)
        if (this.selectedMode === 'Fees')
          return (item.swapFees + item.spotFees).toFixed(2)
      }
      return [
        {
          name: this.selectedMode,
          data: this.chartData.map((item) => {
            return {
              x: new Date(item._id).valueOf(),
              y: currentY(item),
            }
          }),
        },
      ]
    },
    chartOptions() {
      return {
        colors: [this.selectedMode === 'Volume' ? '#723de4' : '#30B27C'],

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
          height: 350,

          zoom: {
            enabled: false,
          },

          toolbar: {
            show: false,
          },

          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
              enabled: true,
              delay: 150,
            },
            dynamicAnimation: {
              enabled: true,
              speed: 350,
            },
          },
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

        dataLabels: {
          enabled: false,
        },

        stroke: {
          curve: 'smooth',
          width: 2,
        },

        xaxis: {
          lines: { show: false },
          type: 'datetime',
          tooltip: {
            enabled: false,
          },
          labels: {
            datetimeUTC: false,
          },
        },

        yaxis: {
          lines: { show: false },
          opposite: true,
        },

        tooltip: {
          x: { show: false },
        },
      }
    },
  },

  watch: {
    selectedResolution() {
      this.getChart()
    },
  },

  mounted() {
    this.getChart()
  },
  methods: {
    async getChart() {
      this.isLoading = true
      try {
        const { data } = await this.$axios.get('/v2/analytics/charts', {
          params: {
            resolution: this.selectedResolution,
          },
        })
        console.log(data)
        this.chartData = data
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoading = false
      }
    },
  },
}
</script>

<style scoped lang="scss">
.analytics-chart {
  display: flex;
  flex-direction: column;
  // min-height: 100%;
  height: 100%;
}
.chart-container {
  flex: 1;
}
.chart::v-deep {
  .apexcharts-tooltip {
    color: black !important;
  }
}
.header {
  justify-content: space-between;
}
.mode-items {
  display: flex;
  flex-wrap: wrap;
  padding: 2px;
  border-radius: var(--radius);
  background: var(--background-color-base);
}
.mode {
  padding: 2px 6px;
  border-radius: var(--radius);
  color: var(--text-disable);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  &:hover {
    color: var(--text-default);
  }
  &.active {
    color: var(--text-default);
    background: var(--background-color-third);
  }
}
</style>
