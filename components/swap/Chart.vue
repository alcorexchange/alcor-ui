<template lang="pug">
  client-only
    .h-100
      VueApexCharts(:width='width' :height="height" type="area" :options='chartOptions' :series='series' ref="chart")
</template>

<script>
import { mapState, mapGetters } from 'vuex'

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
        colors: [this.$colorMode.value == 'light' ? '#3E3A3B' : '#9EABA3'],

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
      this.fetchCharts(true)
    },

    isReverted() {
      this.fetchCharts()
    },

    '$colorMode.value'() {
      this.updateChartOprions()
    }
  },

  mounted() {
    this.fetchCharts()
    setTimeout(() => this.updateChartOprions(), 1000)
  },

  methods: {
    updateChartOprions(options) {
      if (!this.$refs.chart) {
        console.log('LP CHART NOT FOUND..')
        return
      }

      this.$refs.chart.updateOptions({
        colors: [this.$colorMode.value == 'light' ? '#3E3A3B' : '#9EABA3'],
        chart: {
          foreColor: this.$colorMode.value == 'light' ? '#3E3A3B' : '#9EABA3'
        }
      })
    },

    fetchCharts(animate = false) {
      const API = {
        Price: 'line_chart',
        Liquidity: 'liquidity_chart',
        Volume: 'volume_chart'
      }[this.tab]

      if (this.pair) {
        this.$axios.get(`/pools/${this.pair.id}/${API}`, {
          params: {
            reverse: this.isReverted
          }
        }).then(({ data }) => {
          // FIXME No animation on updating
          this.$refs.chart.updateOptions({ series: [{ name: this.tab, data }] }, true, animate)
        })
      }
    }
  }
}
</script>

<style lang="scss">
.apexcharts-tooltip {
  border: none !important;
  border-radius: 4px;
  box-shadow: none !important;

  height: 30px;
  background: red !important;
  background-color: var(--background-color-base) !important;
  color: var(--color-text-primary) !important;
}
</style>
