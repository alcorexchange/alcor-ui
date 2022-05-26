<template lang="pug">
  VueApexCharts(
    :height="height || '100%'"
    :width="width || '100%'"
    :type="type || 'area'"
    :options="{...base, ...options}"
    :series="series"
  ).swap-chart
</template>

<script>
export default {
  props: ['series', 'type', 'options', 'width', 'height'],
  data() {
    return {
      base: {
        colors: [this.$colorMode.value == 'light' ? '#3E3A3B' : '#30B27C'],

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
          curve: 'smooth',
          width: 2
        },

        xaxis: {
          lines: { show: false },
          type: 'datetime',
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
    }
  }
}
</script>
