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
          .label {{ promo.last_price }}
          .data(:class="{ isRed, isZero }") ({{ pricePercent }}%)
        span
          .label
            .gray 7D Volume
            span {{ promo.volume24.toFixed(2) }}
          .data ({{ liquidityPercent }} %)
    .banner
      img(:src="bannerSrc")
</template>

<script>
import AlcorChart from '@/components/AlcorChart'
import TokenImage from '@/components/elements/TokenImage.vue'

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
      title: {
        text: '2D Daily Chart',
        align: 'left',
        margin: 0,
        offsetY: 20,
        style: {
          color: '#fff',
          fontSize: '10px',
          fontWeight: 400,
          fontFamily: 'Roboto, Arial, sans-serif'
        }
      },
      grid: {
        borderColor: '#333333',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } }
      },
      xaxis: {
        lines: { show: false },
        type: 'datetime',
        tooltip: { enabled: false },
        axisBorder: { color: '#333333' },
        axisTicks: {
          color: '#333333',
          height: 6
        },
        labels: {
          datetimeUTC: false,
          style: {
            colors: '#fff',
            fontSize: '10px',
            fontFamily: 'Roboto, Arial, sans-serif'
          }
        }
      },
      yaxis: {
        lines: { show: false },
        opposite: true,
        axisTicks: {
          show: true,
          color: '#333333',
          width: 6
        },
        labels: {
          style: {
            colors: ['#fff'],
            fontSize: '10px',
            fontFamily: 'Roboto, Arial, sans-serif'
          }
        }
      }
    }
  }),
  computed: {
    bannerSrc() { return require(`@/assets/promo/${this.promo.quote_token.contract}.png`) },
    isRed() { return this.percent(this.series.data) <= 0 },
    isZero() { return this.percent(this.series.data) === 0 }
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
        const charts = (await this.$axios.get(`/pools/${this.promo.poolId}/charts`, { params: { period: '7D' } })).data
        const newData = charts.map(point =>
          ({ x: point.time, y: +point.price.toFixed(6) })
        )
        this.liquidity = charts.map(point =>
          ({ x: point.time, y: point.liquidity1.toFixed(6) })
        )
        this.series = [{ ...this.series, data: newData }]
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

.chart {
  border: 1px solid #333;
  border-radius: 4px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 774px;
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
  height: 263px;
  border-radius: 4px;
}

a {
  text-decoration: none;
  color: #fff;
}
</style>
