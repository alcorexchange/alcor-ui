<template lang="pug">
.stacked-column-chart-component
  vue-apex-charts(type="bar" :height="height || 400" :options="chartOptions" :series="series" v-if="series[0].data.length" ref="chart")

</template>

<script>
export default {
  props: ['series', 'height'],
  watch: {
    series() {}
  },

  mounted() {},

  data: () => ({
    chartOptions: {
      chart: {
        type: 'bar',
        stacked: true,
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
      plotOptions: {
        bar: {
          columnWidth: '75%',
          dataLabels: {
            maxItems: 0,
            total: {
              enabled: false,
              formatter: (_) => '',
              style: {
                color: 'red'
              }
            }
          }
        }
      },
      theme: {
        mode: 'dark',
        palette: 'palette2'
      },
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
      yaxis: {
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
        axisBorder: {
          show: true,
          color: 'var(--border-color)',
          height: 1,
          width: '100%',
        },
        axisTicks: {
          show: false,
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
        categories: [
          '01/01/2011 GMT',
          '01/02/2011 GMT',
          '01/03/2011 GMT',
          '01/04/2011 GMT',
          '01/05/2011 GMT',
          '01/06/2011 GMT',
          '01/07/2011 GMT',
          '01/08/2011 GMT',
          '01/09/2011 GMT',
          '01/10/2011 GMT',
          '01/11/2011 GMT',
          '01/12/2011 GMT',
          '01/13/2011 GMT',
          '01/14/2011 GMT',
          '01/15/2011 GMT',
          '01/16/2011 GMT',
          '01/17/2011 GMT',
          '01/18/2011 GMT',
          '01/19/2011 GMT',
          '01/20/2011 GMT',
          '01/21/2011 GMT',
          '01/22/2011 GMT',
          '01/23/2011 GMT',
          '01/24/2011 GMT',
          '01/25/2011 GMT',
          '01/26/2011 GMT',
          '01/27/2011 GMT',
          '01/28/2011 GMT',
          '01/29/2011 GMT',
          '01/30/2011 GMT'
        ]
      },
      legend: {
        show: false
      },
      colors: ['#0A84FF'],
      fill: {
        opacity: 1,
        pattern: {
          style: 'verticalLines',
          width: 1,
          height: 1,
          strokeWidth: 10
        }
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.stacked-column-chart-component {
  height: 100%;
  width: 100%;
}
</style>
