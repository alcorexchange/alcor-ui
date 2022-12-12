<template lang="pug">
#tv_chart_container.nft-price-chart
  client-only
    .h-100.mt-2(@mouseleave='setCurrentPrice')
      .price-container
        .price
          span {{ price }} WAX
          span.disable  (${{ $systemToUSD(price) }})
      VueApexCharts.swap-chart(
        :width='width',
        :height='height',
        type='area',
        :options='chartOptions',
        :series='series',
        ref='chart'
      )
</template>

<script>
import { mapGetters } from 'vuex'

const COLORS = {
  light: {
    Price: { up: '#58ab8b', down: '#F96C6C' },
    Liquidity: '#6138b9',
    Volume: '#3E3A3B',
  },

  dark: {
    Price: { up: '#30B27C', down: '#F96C6C' },
    Liquidity: '#723de4',
    Volume: '#1FC781',
  },
}

let timeout

export default {
  props: ['tab', 'charts'],

  data() {
    return {
      price: 0,

      width: '100%',
      height: '100%',

      data: [],

      series: [
        {
          name: 'Price',
          data: [],
        },
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
            opacityTo: 0.7,
          },
        },

        chart: {
          height: 350,

          zoom: {
            enabled: false,
          },

          toolbar: {
            show: false,
          },

          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
              enabled: true,
              delay: 150,
            },
            dynamicAnimation: {
              enabled: true,
              speed: 350,
            },
          },

          events: {
            mouseMove: (event, chartContext, config) => {
              if (timeout) {
                clearTimeout(timeout)
              }

              timeout = setTimeout(() => {
                if (!(config.dataPointIndex in this.data)) return

                const price = this.data[config.dataPointIndex].y
                if (
                  config.dataPointIndex == -1 ||
                  price == this.price ||
                  !price
                )
                  return
                this.price = price
              }, 10)
            },
          },
        },

        grid: {
          borderColor: 'var(--border-color)',
          xaxis: {
            lines: {
              show: true,
            },
          },

          yaxis: {
            lines: {
              show: true,
            },
          },
        },

        dataLabels: {
          enabled: false,
        },

        stroke: {
          curve: 'smooth',
          width: 2,
        },

        xaxis: {
          lines: { show: false },
          type: 'datetime',
          tooltip: {
            enabled: false,
          },
          axisBorder: { color: 'var(--border-color)' },
          axisTicks: {
            color: 'var(--border-color)',
            height: 6
          },
          labels: {
            datetimeUTC: false,
            style: {
              colors: 'var(--text-default)',
              fontSize: '10px',
              fontFamily: 'Roboto, Arial, sans-serif'
            },
          }
        },

        yaxis: {
          lines: { show: false },
          opposite: true,
          axisTicks: {
            show: true,
            color: 'var(--border-color)',
            width: 6
          },
          labels: {
            style: {
              colors: ['var(--text-default)'],
              fontSize: '10px',
              fontFamily: 'Roboto, Arial, sans-serif'
            }
          }
        },

        tooltip: {
          x: { show: false },
        },
      },
    }
  },

  computed: {
    ...mapGetters({
      pair: 'swap/current',
      isReverted: 'swap/isReverted',
    }),

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
    },
  },

  // TODO Короче тут нужно все попроавить причесать, что бы переключалка работала
  watch: {
    async pair(_new, old) {
      // TODO
      if (!old || _new.id != old.id) {
        this.updateSeries()
        if (this.tab == 'Price') this.setCurrentPrice()
      }
    },

    tab() {
      this.updateSeries()
    },

    async period() {
      this.updateSeries()
      if (this.tab == 'Price') this.setCurrentPrice()
    },

    isReverted() {
      this.updateSeries()
      if (this.tab == 'Price') this.setCurrentPrice()
    },

    '$colorMode.value'() {
      this.updateChartOptions()
    },
  },

  mounted() {
    setTimeout(() => this.updateSeries(), 1000)
  },

  methods: {
    setCurrentPrice() {
      this.price = this.data.length ? this.data[this.data.length - 1].y : 0
    },

    updateChartOptions(options) {
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
          foreColor: this.$colorMode.value == 'light' ? '#3E3A3B' : '#9EABA3',
        },
      })
    },

    updateSeries() {
      if (!this.$refs.chart) return

      const data = []

      if (this.tab == 'Volume') this.charts.pop()

      this.charts.map((point) => {
        data.push({
          x: point.time,
          y: this.$options.filters.commaFloat(point.median / Math.pow(10, point.token_precision)),
        })
      })
      console.log('updateSeries, data', data.length)

      this.data = data
      this.$refs.chart.updateOptions(
        {
          series: [{ name: this.tab, data }],
        },
        true
      )
      this.updateChartOptions()
    },
  },
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
    font-size: 1rem !important;
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
