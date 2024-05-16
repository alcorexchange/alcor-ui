<template lang="pug">
.stacked-column-chart-component
  vue-apex-charts(type="bar" :height="height || 400" :options="chartOptions" :series="series" v-if="series[0].data.length" ref="chart")

</template>

<script>
export default {
  props: ['series', 'height'],
  // data: () => ({
  //   chartOptions: {
  //     chart: {
  //       type: 'bar',
  //       stacked: true,
  //       background: 'transparent',
  //       toolbar: {
  //         show: false,
  //       },
  //       zoom: {
  //         enabled: true,
  //       },
  //     },
  //     responsive: [
  //       {
  //         breakpoint: 480,
  //         options: {
  //           legend: {
  //             position: 'bottom',
  //             offsetX: -10,
  //             offsetY: 0,
  //           },
  //         },
  //       },
  //     ],
  //     plotOptions: {
  //       bar: {
  //         columnWidth: '75%',
  //         dataLabels: {
  //           maxItems: 0,
  //           total: {
  //             enabled: false,
  //             formatter: (_) => '',
  //             style: {
  //               color: 'red',
  //             },
  //           },
  //         },
  //       },
  //     },
  //     theme: {
  //       mode: 'dark',
  //       palette: 'palette2',
  //     },
  //     dataLabels: {
  //       enabled: false,
  //     },
  //     grid: {
  //       xaxis: {
  //         lines: {
  //           show: false,
  //         },
  //       },

  //       yaxis: {
  //         lines: {
  //           show: false,
  //         },
  //       },
  //     },
  //     yaxis: {
  //       opposite: true,
  //       axisBorder: {
  //         show: false,
  //       },
  //       axisTicks: {
  //         show: false,
  //       },
  //       labels: {
  //         show: true,
  //         offsetX: -10,
  //         formatter: (v) => {
  //           return '$' + v.toFixed(2)
  //         },
  //         style: {
  //           colors: 'var(--text-disable)',
  //           fontSize: '12px',
  //           fontWeight: 400,
  //         },
  //       },
  //     },
  //     xaxis: {
  //       axisBorder: {
  //         show: true,
  //         color: 'var(--border-color)',
  //         height: 1,
  //         width: '100%',
  //       },
  //       axisTicks: {
  //         show: false,
  //         borderType: 'solid',
  //         color: 'var(--border-color)',
  //         height: 4,
  //       },
  //       type: 'datetime',
  //       labels: {
  //         show: true,
  //         style: {
  //           colors: 'var(--text-disable)',
  //           fontSize: '12px',
  //           fontWeight: 400,
  //         },
  //       },
  //     },
  //     legend: {
  //       show: false,
  //     },
  //     colors: ['#0A84FF'],
  //     fill: {
  //       opacity: 1,
  //       pattern: {
  //         style: 'verticalLines',
  //         width: 1,
  //         height: 1,
  //         strokeWidth: 10,
  //       },
  //     },
  //   },
  // }),

  computed: {
    chartOptions() {
      return {
        chart: {
          type: 'bar',
          stacked: true,
          background: 'transparent',
          toolbar: {
            show: false,
          },
          zoom: {
            enabled: true,
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
        plotOptions: {
          bar: {
            columnWidth: '75%',
            dataLabels: {
              maxItems: 0,
              total: {
                enabled: false,
                formatter: (_) => '',
                style: {
                  color: 'red',
                },
              },
            },
          },
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
        yaxis: {
          opposite: true,
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          labels: {
            show: true,
            offsetX: -10,
            formatter: (v) => {
              return '$' + this.$options.filters.commaFloat(v, 2)
            },
            style: {
              colors: 'var(--text-disable)',
              fontSize: '12px',
              fontWeight: 400,
            },
          },
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
            height: 4,
          },
          type: 'datetime',
          labels: {
            show: true,
            style: {
              colors: 'var(--text-disable)',
              fontSize: '12px',
              fontWeight: 400,
            },
          },
        },
        legend: {
          show: false,
        },
        colors: ['#0A84FF'],
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

  watch: {
    series() {},
  },

  mounted() {},
}
</script>

<style lang="scss" scoped>
.stacked-column-chart-component {
  height: 100%;
  width: 100%;
}
</style>
