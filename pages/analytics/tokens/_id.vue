<template lang="pug">
.analytics-page(v-if="token")
  ReturnLink Back

  AnalyticsTokenHeader(:token="token" :fundamental="fundamental")

  AlcorContainer.p-3(v-if="fundamental")
    .title.muted.mb-1 Description
    .content {{ fundamental.description }}

  .analytics-stats-and-chart
    AnalyticsStats(:items="columnStats")
    AnalyticsChartLayout(:modes="chartModes" :selectedMode.sync="selectedMode")
      //- LineChart(
      //-   :series="series"
      //-   height="400px"
      //-   style="min-height: 400px")

</template>

<script>
import JSBI from 'jsbi'
import { Price, Q128 } from '@alcorexchange/alcor-swap-sdk'
import AnalyticsTokenHeader from '@/components/analytics/AnalyticsTokenHeader'
import AnalyticsStats from '@/components/analytics/AnalyticsStats'
import AnalyticsChartLayout from '~/components/analytics/AnalyticsChartLayout.vue'
import ReturnLink from '~/components/ReturnLink.vue'
import AlcorContainer from '~/components/AlcorContainer.vue'
import LineChart from '~/components/charts/Line.vue'

export default {
  components: {
    AnalyticsTokenHeader,
    AnalyticsStats,
    AnalyticsChartLayout,
    ReturnLink,
    AlcorContainer,
    LineChart
  },

  data() {
    return {
      stats: {},
      selectedMode: null,
      charts: [],
    }
  },

  computed: {
    token() {
      return this.$getToken(this.$route.params.id)
    },

    fundamental() {
      if (!this.$fundamentals[this.$store.state.network.name]) return null

      return this.$fundamentals[this.$store.state.network.name][
        this.token.symbol + '@' + this.token.contract
      ]
    },

    pools() {
      return this.$store.state.amm.poolsStats.filter(p => p.tokenA.id == this.token.id || p.tokenB.id == this.token.id)
    },

    markets() {
      return this.$store.state.markets.filter(m => m.slug.includes(this.token.id))
    },

    columnStats() {
      const volume24 = this.pools.reduce((total, a) => {
        return total + a.tokenA.id == this.token.id ? a.volumeA24 : a.volumeB24
      }, 0)

      const volumeWeek = this.pools.reduce((total, a) => {
        return total + a.tokenA.id == this.token.id ? a.volumeAWeek : a.volumeBWeek
      }, 0)

      return [
        {
          title: 'Circulating Supply',
          value: this.stats.supply,
        },
        {
          title: 'Max Supply',
          value: this.stats.max_supply,
        },
        {
          title: 'Market Cap',
          value: this.$tokenToUSD(parseFloat(this.stats.supply) ?? 0, this.token.symbol, this.token.contract),
          formatter: 'usd'
        },
        {
          title: 'Swap Volume 24H',
          value: volume24 + ' ' + this.token.symbol,
        },
        {
          title: 'Swap Volume Week',
          value: volumeWeek + ' ' + this.token.symbol,
        },
        {
          title: 'Swap pairs',
          value: this.pools.length,
        },
        {
          title: 'Spot pairs',
          value: this.markets.length,
        },
      ]
    },

    networkToken() {
      return this.$store.state.network.baseToken
    },
    networkTokenId() {
      return (this.networkToken.symbol + '-' + this.networkToken.contract).toLowerCase()
    },
    networkUSDTId() {
      return this.$store.state.network.USD_TOKEN
    },

    baseTokenId() {
      return this.selectedMode == 'USDT' ? this.networkUSDTId : this.networkTokenId
    },

    chartModes() {
      return [
        { value: this.networkToken.symbol }, { value: 'USDT' }
      ]
    },

    series() {
      let data = []

      // data = this.charts.map((c) => {
      //   const price = new Price(
      //     sortedA,
      //     sortedB,
      //     Q128,
      //     JSBI.multiply(JSBI.BigInt(c.price), JSBI.BigInt(c.price))
      //   )

      //   return {
      //     x: c._id,
      //     y: parseFloat(price.toSignificant()),
      //   }
      // })

      return [
        {
          name: 'Price',
          data,
        },
      ]
    },
  },

  watch: {
    token() {
      this.fetchStats()
      this.fetchCharts()
    },
    baseTokenId() {
      this.fetchCharts()
    }
  },

  mounted() {
    this.fetchStats()
    this.selectedMode = this.networkToken.symbol
  },

  methods: {
    async fetchStats() {
      if (!this.token) return

      const { rows } = await this.$rpc.get_table_rows({
        code: this.token.contract,
        table: 'stat',
        limit: 1,
        scope: this.token.symbol
      })

      this.stats = rows[0]
    },

    async fetchCharts() {
      //const usdPool = jk
      const tokenA = this.token?.id
      const tokenB = this.baseTokenId
      if (!tokenA || !tokenB) return

      try {
        const { data } = await this.$axios.get('/v2/swap/charts', {
          params: {
            // period: this.activeTime,
            tokenA,
            tokenB,
          },
        })

        this.charts = data
      } catch (e) {
        console.log('Getting Chart E', e)
      }
    },
  }
}
</script>
