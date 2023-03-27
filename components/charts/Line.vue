<template lang="pug">
.stacked-column-chart-component
  vue-apex-charts(type="area" height="400" :options="chartOptions" :series="series" ref="chart")

</template>

<script>
export default {
  props: ['series'],

  watch: {
    series() {
      setTimeout(() => {
        this.$refs.chart.updateOptions({ series: this.series }, true)
      }, 100)
    }
  },

  mounted() {
  },

  data: () => ({
    chartOptions: {
      markers: {
        size: 0,
        colors: ['#32D74B'],
        strokeColors: '#111113'
      },
      colors: ['#E91E63', '#FF9800'],
      theme: {
        mode: 'dark'
      },
      stroke: {
        curve: 'straight',
        width: 1,
        colors: ['#32D74B']
      },
      fill: {
        colors: ['#32D74B', ''],
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'vertical',
          inverseColors: true,
          shadeIntensity: 0.9,
          opacityFrom: 0.0,
          opacityTo: 0.2
        }
      },
      chart: {
        type: 'line',
        background: 'transparent',
        toolbar: {
          show: false
        },
        zoom: {
          enabled: true
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              position: 'bottom',
              offsetX: -10,
              offsetY: 0
            }
          }
        }
      ],
      dataLabels: {
        enabled: false
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
      tooltip: {
        y: {
          formatter: (v) => '$' + v
        },
        marker: {
          show: false
        },
        custom: () => ''
      },
      yaxis: {
        crosshairs: {
          show: true,
          stroke: {
            color: 'var(--border-color)',
            width: 2,
            dashArray: 3
          }
        },
        tooltip: {
          enabled: true,
          custom: () => ''
        },
        opposite: true,
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        labels: {
          show: true,
          offsetX: -10,
          formatter: (v) => {
            return '$' + v.toFixed(2)
          },
          style: {
            colors: 'var(--text-disable)',
            fontSize: '12px',
            fontWeight: 400
          }
        }
      },
      xaxis: {
        crosshairs: {
          show: true,
          width: 1.2,
          stroke: {
            color: 'var(--border-color)',
            width: 1,
            dashArray: 0
          },
          fill: {
            type: 'solid',
            color: 'var(--border-color)'
          }
        },
        axisBorder: {
          show: true,
          color: 'var(--border-color)',
          height: 1,
          width: '100%',
          offsetY: 10
        },
        axisTicks: {
          show: true,
          borderType: 'solid',
          color: 'var(--border-color)',
          height: 4
        },
        type: 'datetime',
        labels: {
          show: true,
          style: {
            colors: 'var(--text-disable)',
            fontSize: '12px',
            fontWeight: 400
          }
        },
      },
      legend: {
        show: false
      }
    }
  })
}
</script>

<style lang="scss">
.stacked-column-chart-component {
  width: 100%;
  min-height: 420px;
  .apexcharts-svg {
    height: 420px;
  }
}
</style>
