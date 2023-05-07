<template lang="pug">
AlcorContainer.analytics-chart
  .d-flex
    .mode-items
      .mode(v-for="item in modes" :class="{active: selectedMode === item.value}" @click="selectedMode = item.value") {{ item.value }}
  .chart-container
    VueApexCharts(width='100%' height="100%" type="area" :options='chartOptions' :series='series' ref="chart")
</template>

<script>
import AlcorContainer from '@/components/AlcorContainer'
import AlcorRadio from '@/components/AlcorRadio'
export default {
  name: 'AnalyticsChart',
  components: {
    AlcorContainer,
    AlcorRadio
  },
  data: () => ({
    selectedMode: 'TVL',
    modes: [
      { value: 'TVL' },
      { value: 'Volume' },
      { value: 'Depth TVL' },
      { value: 'Fees' },
    ],
    series: [
      {
        name: 'Price',
        data: Array.from({ length: 20 }, (_, index) => ({
          y: (Math.random() * 100).toFixed(2),
          x: index + 10
        }))
      }
    ],
    chartOptions: {
      colors: ['#30B27C'],

      fill: {
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: undefined,
          inverseColors: true,
          opacityFrom: 0.15,
          opacityTo: 0.7
        }
      },

      chart: {
        height: 350,

        zoom: {
          enabled: false
        },

        toolbar: {
          show: false
        },

        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        },

      },

      grid: {
        xaxis: {
          lines: {
            show: false
          }
        },

        yaxis: {
          lines: {
            show: false
          }
        }
      },

      dataLabels: {
        enabled: false
      },

      stroke: {
        curve: 'smooth',
        width: 2
      },

      xaxis: {
        lines: { show: false },
        // type: 'datetime',
        tooltip: {
          enabled: false
        },
        labels: {
          datetimeUTC: false
        }
      },

      yaxis: {
        lines: { show: false },
        opposite: true
      },

      tooltip: {
        x: { show: false }
      }
    }
  })
}
</script>

<style scoped lang="scss">
.analytics-chart {
  display: flex;flex-direction: column;
  min-height: 380px;
}
.chart-container {
  flex: 1;
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
