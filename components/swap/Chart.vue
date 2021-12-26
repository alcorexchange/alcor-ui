<template lang="pug">
  client-only
    .h-100(@mouseleave="setCurrentPrice").mt-2
      .each-item-price-container(v-if="pair")
        .item
          TokenImage(:src="$tokenLogo(pair.pool1.quantity.symbol.code().to_string(), pair.pool1.contract)" height="15")
          span.text.muted.ml-1 {{renderFirstPair}}
        .item
          TokenImage(:src="$tokenLogo(pair.pool2.quantity.symbol.code().to_string(), pair.pool2.contract)" height="15")
          span.text.muted.ml-1 {{renderSecondPair}}
      .price-container
        .price {{ price }}
        .to(v-if="pair && ['Liquidity', 'Volume'].includes(tab)") {{ isReverted ? pair.pool2.quantity.symbol.code().to_string() : pair.pool1.quantity.symbol.code().to_string() }}
        .to(v-else-if="pair") {{ isReverted ? pair.pool2.quantity.symbol.code().to_string() : pair.pool1.quantity.symbol.code().to_string() }}
        .change(:class="{isRed, isZero}")
          i(:class="`el-icon-caret-${isRed? 'bottom': 'top'}`" v-if="!isZero")
          span.text {{ percent }}%
      VueApexCharts(:width='width' :height="height" type="area" :options='chartOptions' :series='series' ref="chart").swap-chart
</template>

<script>
import { mapGetters } from 'vuex'

import TokenImage from '~/components/elements/TokenImage'

const COLORS = {
  light: {
    Price: { up: '#58ab8b', down: '#F96C6C' },
    Liquidity: '#6138b9',
    Volume: '#3E3A3B'
  },

  dark: {
    Price: { up: '#30B27C', down: '#F96C6C' },
    Liquidity: '#723de4',
    Volume: '#1FC781'
  }
}

let timeout

export default {
  components: {
    TokenImage
  },

  props: ['tab', 'period'],

  data() {
    return {
      price: 0,

      width: '100%',
      height: '100%',

      data: [],
      charts: [],

      series: [
        {
          name: 'Price',
          data: []
        }
      ],

      chartOptions: {
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

          events: {
            mouseMove: (event, chartContext, config) => {
              if (timeout) {
                clearTimeout(timeout)
              }

              timeout = setTimeout(() => {
                if (!(config.dataPointIndex in this.data)) return

                const price = this.data[config.dataPointIndex].y
                if (config.dataPointIndex == -1 || price == this.price || !price)
                  return
                this.price = price
              }, 10)
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
    }),

    percent() {
      const length = this.data.length
      if (length < 2) return 0

      const price_after = this.data[length - 1].y
      const price_before = this.data[0].y

      return (((price_after - price_before) / price_before) * 100).toFixed(2)
    },

    isRed() {
      return this.percent <= 0
    },
    isZero() {
      return this.percent === 0
    },
    renderFirstPair() {
      return `1 ${this.pair.pool1.quantity.symbol.code().to_string()} =
         ${(
           parseFloat(this.pair.pool2.quantity) /
           parseFloat(this.pair.pool1.quantity)
         ).toFixed(8)}
         ${this.pair.pool2.quantity.symbol.code().to_string()}
       `
    },
    renderSecondPair() {
      return `1 ${this.pair.pool2.quantity.symbol.code().to_string()} =
         ${(
           parseFloat(this.pair.pool1.quantity) /
           parseFloat(this.pair.pool2.quantity)
         ).toFixed(8)}
         ${this.pair.pool1.quantity.symbol.code().to_string()}
       `
    }
  },

  // TODO Короче тут нужно все попроавить причесать, что бы переключалка работала
  watch: {
    async pair(_new, old) {
      // TODO
      if (!old || _new.id != old.id) {
        await this.fetchCharts()
        this.updateSeries()
        if (this.tab == 'Price') this.setCurrentPrice()
      }

      //if (this.timeout) {
      //  clearTimeout(this.timeout)
      //}
      //this.timeout = setTimeout(() => this.fetchCharts(), 1000)
    },

    tab() {
      this.updateSeries()
    },

    async period() {
      await this.fetchCharts(true)
      this.updateSeries()
      if (this.tab == 'Price') this.setCurrentPrice()
    },

    isReverted() {
      this.updateSeries()
      if (this.tab == 'Price') this.setCurrentPrice()
    },

    '$colorMode.value'() {
      this.updateChartOprions()
    }
  },

  mounted() {
    this.fetchCharts()
    setTimeout(() => this.updateSeries(), 1000)
  },

  methods: {
    setCurrentPrice() {
      this.price = this.data.length ? this.data[this.data.length - 1].y : 0
    },

    updateChartOprions(options) {
      if (!this.$refs.chart) {
        console.log('LP CHART NOT FOUND..')
        return
      }

      const colors = []

      if (this.tab == 'Price') {
        colors.push(
          COLORS[this.$colorMode.value][this.tab][this.isRed ? 'down' : 'up']
        )
      } else {
        colors.push(COLORS[this.$colorMode.value][this.tab])
      }

      this.$refs.chart.updateOptions({
        colors,
        chart: {
          foreColor: this.$colorMode.value == 'light' ? '#3E3A3B' : '#9EABA3'
        }
      })
    },

    updateSeries() {
      if (!this.$refs.chart) return

      const data = []

      if (this.tab == 'Volume') this.charts.pop()

      this.charts.map(point => {
        if (this.tab == 'Price') {
          data.push({ x: point.time, y: this.isReverted ? point.price.toFixed(6) : point.price_r.toFixed(6) })
        } else if (this.tab == 'Liquidity') {
          data.push({ x: point.time, y: this.isReverted ? point.liquidity2.toFixed(6) : point.liquidity1.toFixed(6) })
        } else if (this.tab == 'Volume') {
          data.push({ x: point.time, y: this.isReverted ? point.volume2.toFixed(6) : point.volume1.toFixed(6) })
        }
      })
      console.log('updateSeries, data', data.length)

      this.data = data
      this.$refs.chart.updateOptions(
        {
          series: [{ name: this.tab, data }]
        },
        true
      )
      this.updateChartOprions()
    },

    async fetchCharts(animate = false) {
      if (this.pair) {
        this.charts = (await this.$axios.get(`/pools/${this.pair.id}/charts`, { params: { period: this.period } })).data
      }
    }
  }
}
</script>

<style lang="scss">
.swap-chart {
  .apexcharts-tooltip {
    border: none !important;
    border-radius: 4px;
    box-shadow: none !important;

    height: 30px;
    background: red !important;
    background-color: var(--background-color-base) !important;
    color: var(--color-text-primary) !important;
  }
}

.each-item-price-container {
  display: flex;
  flex-wrap: wrap;
  .item {
    padding: 2px;
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    border-radius: var(--radius);
    border: var(--border-1);
    margin-right: 4px;
    margin-bottom: 4px;
    .icon {
      width: 15px;
      height: 15px;
      border-radius: 50%;
      margin-right: 4px;
    }
  }
}
.price-container {
  display: flex;
  align-items: center;
  margin-bottom: -30px;

  .price {
    font-size: 1.8rem;
    font-weight: bold;
    margin-right: 4px;
  }

  .change {
    display: flex;
    align-items: center;
    color: var(--main-green);
    padding: 0 4px;
    &.isRed {
      color: var(--main-red);
    }
    &.isZero {
      color: var(--text-default);
    }
  }
}
</style>
