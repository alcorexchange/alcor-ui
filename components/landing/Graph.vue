<template lang="pug">
  client-only
    .h-100.landing-graph
      VueApexCharts(:width='width' :height="height" type="area" :options='chartOptions' :series='series' ref="chart")
</template>

<script>

import TokenImage from '~/components/elements/TokenImage'

// const COLORS = {
//   light: {
//     Price: { up: '#58ab8b', down: '#F96C6C' },
//     Liquidity: '#6138b9',
//     Volume: '#3E3A3B'
//   },

//   dark: {
//     Price: { up: '#30B27C', down: '#F96C6C' },
//     Liquidity: '#6138b9',
//     Volume: '#1FC781'
//   }
// }

export default {
  components: {
    TokenImage
  },

  props: ['tab', 'period'],

  data() {
    return {
      price: 0,

      width: '100%',
      //height: '100%',
      height: '250px',

      data: [],

      series: [
        { name: 'Community', data: [[1, 0], [2, 0], [3, 50], [4, 80], [5, 95], [6, 100]] },
        { name: 'Team', data: [[1, 5], [2, 12], [3, 18], [4, 20], [5, 21], [6, 21]] },
        { name: 'Investors', data: [[1, 1], [2, 4], [3, 7], [4, 8], [5, 8.5], [6, 9]] },
        { name: 'Advisors', data: [[1, 1], [2, 0.5], [3, 0.8], [4, 1], [5, 1.2], [6, 1.2]] }
      ],

      chartOptions: {
        colors: ['#46afe9', '#158649', '#18b15f', '#85ef4f'],
        //this.$colorMode.value == 'light' ? '#3E3A3B' : '#30B27C'

        fill: {
          gradient: {
            shade: 'dark',
            //type: 'horizontal',
            shadeIntensity: 0,
            gradientToColors: undefined,
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 1
          }
        },

        chart: {
          height: 350,
          foreColor: this.$colorMode.value == 'light' ? '#3E3A3B' : '#9EABA3',

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

          events: {
            //mouseMove: (event, chartContext, config) => {
            //  const price = this.data[config.dataPointIndex].y
            //  if (config.dataPointIndex == -1 || price == this.price || !price)
            //    return
            //  this.price = price
            //}
          }
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
          curve: 'straight',
          width: 2
        },

        xaxis: {
          lines: { show: false },
          labels: { show: false },
          crosshairs: { show: false },
          axisBorder: { show: false },
          axisTicks: { show: false },

          type: 'datetime',
          tooltip: {
            enabled: false
          }
        },

        yaxis: {
          lines: { show: false },
          opposite: true
        },

        tooltip: {
          x: { show: false },
          y: { show: false }
        }
      }
    }
  }
}
</script>

<style lang="scss">
.landing-graph {
  .apexcharts-tooltip {
    border: none !important;
    border-radius: 4px;
    box-shadow: none !important;

    //height: 120px;
    background: red !important;
    background-color: var(--background-color-base) !important;
    color: var(--color-text-primary) !important;
    z-index: 111;
  }
}
</style>
