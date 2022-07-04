<template lang="pug">
router-link(:to="{ name: 'trade-index-id', params: { id: promo.slug } }")
  .promo
    .chart(v-if="series[0].data")
      .header
        token-image(:src="$tokenLogo(promo.quote_token.symbol.name, promo.quote_token.contract)")
        .title {{ promo.symbol }}
      alcor-chart(
        :series="series"
        :options="options"
        height="152px"
      ).graphic
      .indicators
        span
          .label {{ promo.last_price | commaFloat }}
          .data(:class="{ isRed, isZero }") ({{ pricePercent }}%)
        span
          .label
            .gray 1D Volume
            span {{ promo.volume24.toFixed(2).replace('.', ',') }}
          .data(:class="{ isRed: isVolRed, isZero: isVolZero }") ({{ liquidityPercent }} %)
    .banner
      img(:src="bannerSrc")
      img(:src="bannerSrc").blur
</template>

<script>
import AlcorChart from '@/components/AlcorChart'
import TokenImage from '@/components/elements/TokenImage.vue'
const COLORS = {
  light: {
    up: '#58ab8b',
    down: '#F96C6C'
  },

  dark: {
    up: '#30B27C',
    down: '#F96C6C'
  }
}

export default {
  components: { AlcorChart, TokenImage },
  props: ['promo'],
  data: () => ({
    series: [{ name: 'Price' }],
    liquidity: [],
    interval: null,
    pricePercent: null,
    liquidityPercent: null,
    options: {
      colors: [],
      title: {
        text: 'Daily Chart',
        align: 'left',
        margin: 0,
        offsetY: 20,
        style: {
          color: 'var(--text-default)',
          fontSize: '10px',
          fontWeight: 400,
          fontFamily: 'Roboto, Arial, sans-serif'
        }
      },
      grid: {
        borderColor: 'var(--border-color)',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } }
      },
      xaxis: {
        lines: { show: false },
        type: 'datetime',
        tooltip: { enabled: false },
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
          datetimeFormatter: {
            hour: 'HH:mm'
          }
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
      }
    }
  }),
  computed: {
    bannerSrc() { return require(`@/assets/promo/${this.promo.quote_token.contract}.png`) },
    isRed() { return this.pricePercent <= 0 },
    isZero() { return this.pricePercent === 0 },
    isVolRed() { return this.liquidityPercent <= 0 },
    isVolZero() { return this.liquidityPercent === 0 }
  },
  watch: {
    liquidity(data) {
      this.liquidityPercent = this.percent(data)
    },
    series(data) {
      this.pricePercent = this.percent(data[0].data)
    }
  },
  mounted() {
    this.fetchCharts()
    this.interval = setInterval(this.fetchCharts, 1000)
  },
  destroyed() { clearInterval(this.interval) },
  methods: {
    async fetchCharts() {
      if (this.promo) {
        const charts = (await this.$axios.get(`/pools/${this.promo.poolId}/charts`, { params: { period: '24H' } })).data
        const newData = charts.map(point =>
          ({ x: point.time, y: this.$options.filters.commaFloat(point.price) })
        )
        this.liquidity = charts.map(point =>
          ({ x: point.time, y: point.liquidity1.toFixed(6) })
        )
        this.series = [{ ...this.series, data: newData }]
        this.options.colors = [COLORS[this.$colorMode.value][this.isRed ? 'down' : 'up']]
      }
    },
    percent(data) {
      if (!data || data.length < 2) return 0
      const length = data.length

      const price_after = data[length - 1].y
      const price_before = data[0].y

      const result = (((price_after - price_before) / price_before) * 100).toFixed(2)
      return result > 0 ? '+' + result : result
    }
  }
}
</script>

<style scoped>
.promo {
  display: flex;
  justify-content: center;
  gap: 16px;
  box-sizing: border-box;
}

@media only screen and (max-width: 1040px) {
  .promo {
    flex-direction: column-reverse;
  }

  .banner {
    margin-bottom: 16px;
  }

  .banner,
  .banner img {
    width: 100%;
    height: auto;
  }

}

.chart {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 16px 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 776px;
}

@media only screen and (max-width: 1040px) {
  .chart {
    width: 100%;
    padding: 4px 8px;
  }
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title {
  text-transform: uppercase;
}

.indicators {
  font-size: 12px;
  display: flex;
  justify-content: space-between;
}

.indicators span,
.indicators .label {
  display: flex;
  gap: .5em;
}

.gray {
  color: var(--text-grey-thirdly);
}

.data {
  color: var(--main-green);
}

.data.isRed {
  color: var(--main-red);
}

.banner img {
  height: 100%;
  border-radius: 4px;
}

.banner {
  position: relative;
}

.banner img.blur {
  position: absolute;
  z-index: -1;
  height: 96%;
  top: 6px;
  left: 0;
  filter: blur(.6rem);
  overflow: visible;
}

a {
  text-decoration: none;
  color: var(--text-default);
}
</style>
