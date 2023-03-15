<template lang="pug">
.stacked-column-chart-component
  vue-apex-charts(type="area" height="400" :options="chartOptions" :series="series")

</template>

<script>
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { AlcorButton },
  data: () => ({
    series: [
      {
        name: 'EOS',
        data: [2, 4, 11, 5, 7, 12, 3, 21, 42, 32, 11]
      },
      {
        name: 'WAX',
        data: [7, 14, 21, 15, 8, 2, 4, 25, 22, 12, 21]
      },
      {
        name: 'Proton',
        data: [17, 12, 11, 12, 18, 2, 4, 22, 24, 15, 20]
      },
      {
        name: 'Telos',
        data: [27, 44, 21, 11, 2, 4, 2, 25, 32, 1, 11]
      }
    ],
    chartOptions: {
      colors: ['#D9D9D9', '#F89022', '#7543E3', '#228BE9'],
      theme: {
        mode: 'dark'
      },
      stroke: {
        curve: 'straight',
        width: 1
      },
      fill: {
        colors: ['#D9D9D9', '#F89022', '#7543E3', '#228BE9'],
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
          show: true
        }
      },
      yaxis: {
        crosshairs: {
          show: false
        },
        tooltip: {
          enabled: true
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
          '01/11/2011 GMT'
        ]
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
  width: 760px;
  .apexcharts-svg {
    height: 420px;
  }
}
</style>
