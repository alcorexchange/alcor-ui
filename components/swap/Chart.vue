<template lang="pug">
  client-only
    .h-100
      VueApexCharts(:width='width' :height="height" type="area" :options='chartOptions' :series='series' ref="chart")
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  components: {
    VueApexCharts: () => import('vue-apexcharts')
  },

  props: ['tab'],

  data () {
    return {
      width: '100%',
      height: '100%',

      series: [{
        name: 'Price',
        data: []
      }],

      chartOptions: {
        colors: ['#3E3A3B', 'red', 'green'],

        chart: {
          //type: 'area',
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
          }
        },

        markers: {
          size: 0
        },

        fill: {
          //colors: ['#3E3A3B', '#3E3A3B', '#fff'],

          //type: 'gradient',

          //gradient: {
          //  shadeIntensity: 1,
          //  opacityFrom: 0.8,
          //  opacityTo: 0.4,
          //  stops: [20, 80, 100]
          //}
        },

        grid: {
          //borderColor: '#111',
          //strokeDashArray: 7,
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
          type: 'datetime'
        },

        yaxis: {
          lines: { show: false },
          opposite: true
        },

        legend: {
          horizontalAlign: 'left'
        }
      }
    }
  },

  computed: {
    ...mapGetters({
      pair: 'swap/current',
      isReverted: 'swap/isReverted'
    })
  },

  watch: {
    pair() {
      this.fetchCharts()
    },

    tab() {
      this.fetchCharts()
    },

    isReverted() {
      this.fetchCharts()
    }
  },

  mounted() {
    this.fetchCharts()
  },

  methods: {
    fetchCharts() {
      const API = {
        Price: 'line_chart',
        Liquidity: 'liquidity_chart',
        Volume: 'volume_chart'
      }[this.tab]

      if (this.pair) {
        this.$store.getters['api/backEnd'].get(`/api/pools/${this.pair.id}/${API}`, {
          params: {
            reverse: this.isReverted
          }
        }).then(({ data }) => {
          // FIXME No animation on updating
          this.$refs.chart.updateOptions({ series: [{ name: this.tab, data }] }, true)
        })
      }
    }
  }
}
</script>
