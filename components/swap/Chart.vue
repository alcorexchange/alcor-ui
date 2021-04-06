<template lang="pug">
  client-only
    // TODO Fix that hight setting
    .h-100
      .position-relative
        .each-item-price-container(v-if="pair")
          .item
            TokenImage(:src="$tokenLogo(pair.pool1.quantity.symbol.code().to_string(), pair.pool1.contract)" height="15")
            span.text.muted.ml-1 {{renderFirstPair}}
          .item
            TokenImage(:src="$tokenLogo(pair.pool2.quantity.symbol.code().to_string(), pair.pool2.contract)" height="15")
            span.text.muted.ml-1 {{renderSecondPair}}
        //SSpacer
        .price-container.position-absolute
          .price {{ price }}
          .to(v-if="pair") {{ isReverted ? pair.pool2.quantity.symbol.code().to_string() : pair.pool1.quantity.symbol.code().to_string() }}
          // TODO Make change text color red and arrow down when percent is < 0
          .change(:class="{isRed, isZero}")
            i(:class="`el-icon-caret-${isRed? 'bottom': 'top'}`" v-if="!isZero")
            span.text {{ percent }}%
      .h-100(@mouseleave="setCurrentPrice").mt-2
        VueApexCharts(:width='width' :height="height" type="area" :options='chartOptions' :series='series' ref="chart")
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    VueApexCharts: () => import('vue-apexcharts'),
    TokenImage
  },

  props: ['tab'],

  data() {
    return {
      price: 0.0,

      width: '100%',
      height: '100%',

      data: [],

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
              const { y: price } = this.data[config.dataPointIndex]
              this.price = price
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
           parseFloat(this.pair.pool1.quantity) /
           parseFloat(this.pair.pool2.quantity)
         ).toFixed(8)}
         ${this.pair.pool2.quantity.symbol.code().to_string()}
       `
    },
    renderSecondPair() {
      return `1 ${this.pair.pool2.quantity.symbol.code().to_string()} =
         ${(
           parseFloat(this.pair.pool2.quantity) /
           parseFloat(this.pair.pool1.quantity)
         ).toFixed(8)}
         ${this.pair.pool1.quantity.symbol.code().to_string()}
       `
    }
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
    setCurrentPrice() {
      this.price = this.data.length ? this.data[this.data.length - 1].y : 0
    },

    updateChartOprions(options) {
      if (!this.$refs.chart) {
        console.log('LP CHART NOT FOUND..')
        return
      }

      this.$refs.chart.updateOptions({
        colors: [this.$colorMode.value == 'light' ? '#3E3A3B' : '#30B27C'],
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
        this.$axios
          .get(`/pools/${this.pair.id}/${API}`, {
            params: {
              reverse: this.isReverted
            }
          })
          .then(({ data }) => {
            this.data = data
            this.$refs.chart.updateOptions(
              { series: [{ name: this.tab, data }] },
              true,
              animate
            )

            if (this.tab == 'Price') this.setCurrentPrice()
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
