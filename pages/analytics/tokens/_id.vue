<template lang="pug">
.analytics-page(v-if="token")
  ReturnLink Back

  AnalyticsTokenHeader(:token="token" :fundamental="fundamental")

  AlcorContainer.p-3(v-if="fundamental")
    .title.muted.mb-1 Description
    .content {{ fundamental.description }}

  .analytics-stats-and-chart
    AnalyticsStats(:items="columnStats")
    AnalyticsChartLayout(:modes="quoteTokens" :selectedMode.sync="quoteToken" :selectedResolution.sync="selectedResolution")
      LineChart(
        :series="series"
        height="400px"
        style="min-height: 400px")

  div
    AnalyticsTabs(:items="tabs" v-model="activeTab").mb-1

    AnalyticsPoolsTable(v-if="activeTab === 'pools'" :pools="pools" title="")

    AnalyticsSpotPairsTable(v-if="activeTab === 'spot'" :pairs="markets")

    HoldersList(v-if="activeTab === 'holders'" :items="holders" :total="stats.supply")

</template>

<script>
import { mapState } from 'vuex'

import axios from 'axios'
import JSBI from 'jsbi'
import { Token, Price, Q128 } from '@alcorexchange/alcor-swap-sdk'
import AnalyticsTokenHeader from '@/components/analytics/AnalyticsTokenHeader'
import AnalyticsStats from '@/components/analytics/AnalyticsStats'
import AnalyticsChartLayout from '~/components/analytics/AnalyticsChartLayout.vue'
import ReturnLink from '~/components/ReturnLink.vue'
import AlcorContainer from '~/components/AlcorContainer.vue'
import LineChart from '~/components/charts/Line.vue'
import AnalyticsPoolsTable from '~/components/analytics/AnalyticsPoolsTable'
import AnalyticsSectionHeader from '~/components/analytics/AnalyticsSectionHeader'
import AnalyticsSpotPairsTable from '~/components/analytics/AnalyticsSpotPairsTable'
import AnalyticsTabs from '~/components/analytics/AnalyticsTabs'
import HoldersList from '~/components/analytics/AnalyticsHoldersList.vue'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: {
    AnalyticsTokenHeader,
    AnalyticsStats,
    AnalyticsChartLayout,
    ReturnLink,
    AlcorContainer,
    LineChart,
    AlcorButton,
    AnalyticsPoolsTable,
    AnalyticsSpotPairsTable,
    AnalyticsSectionHeader,
    AnalyticsTabs,
    HoldersList,
  },

  data() {
    return {
      stats: {},
      quoteToken: null,
      selectedResolution: 'All',
      charts: [],
      holders: [],
    }
  },

  computed: {
    ...mapState(['network']),

    tokenA() {
      return this.token.id
    },

    tokenB() {
      const { baseToken } = this.$store.state.network

      if (this.tokenA == baseToken.id) return this.usd_token.id

      return this.quoteToken == this.usd_token.symbol
        ? this.usd_token.id
        : `${baseToken.symbol}-${baseToken.contract}`.toLowerCase()
    },

    token() {
      return this.$getToken(this.$route.params.id)
    },

    fundamental() {
      if (!this.$fundamentals[this.$store.state.network.name]) return null
      const [symbol, contract] = this.$route.params.id.split('-')

      return this.$fundamentals[this.$store.state.network.name][symbol.toUpperCase() + '@' + contract]
    },

    pools() {
      return this.$store.state.amm.poolsStats.filter(
        (p) => p.tokenA.id == this.token.id || p.tokenB.id == this.token.id
      )
    },

    markets() {
      return this.$store.state.markets.filter((m) => m.slug.includes(this.token.id))
    },

    columnStats() {
      const volume24 = this.pools.reduce((total, a) => {
        return total + (a.tokenA.id == this.token.id ? a.volumeA24 : a.volumeB24)
      }, 0)

      const volumeWeek = this.pools.reduce((total, a) => {
        return total + (a.tokenA.id == this.token.id ? a.volumeAWeek : a.volumeBWeek)
      }, 0)

      return [
        {
          title: 'Swap Volume USD 24H',
          value: '$' + this.$tokenToUSD(parseFloat(volume24) ?? 0, this.token.symbol, this.token.contract),
        },
        {
          title: 'Swap Volume 24H',
          value: this.$options.filters.commaFloat(volume24, this.token.decimals) + ' ' + this.token.symbol,
        },
        {
          title: 'Swap Volume Week',
          value: this.$options.filters.commaFloat(volumeWeek, this.token.decimals) + ' ' + this.token.symbol,
        },
        {
          title: 'Swap pairs',
          value: this.pools.length,
        },
        {
          title: 'Spot pairs',
          value: this.markets.length,
        },
        {
          title: 'Circulating Supply',
          value: this.$options.filters.commaFloat(this.stats.supply),
        },
        {
          title: 'Max Supply',
          value: this.$options.filters.commaFloat(this.stats.max_supply),
        },
        {
          title: 'Market Cap',
          value: '$' + this.$tokenToUSD(parseFloat(this.stats.supply) ?? 0, this.token.symbol, this.token.contract),
        },
      ]
    },

    usd_token() {
      return this.$getToken(this.$store.state.network.USD_TOKEN)
    },

    quoteTokens() {
      const { baseToken } = this.$store.state.network

      const quotes = []

      if (`${baseToken.symbol}-${baseToken.contract}`.toLowerCase() != this.token.id) {
        quotes.push({ value: this.$store.state.network.baseToken.symbol })
      }

      // if (this.token.id != this.usd_token.id) {
      //   quotes.push({ value: this.usd_token.symbol })
      // }

      return quotes
    },

    series() {
      let data = []

      const _tokenA = this.$getToken(this.tokenA)
      const _tokenB = this.$getToken(this.tokenB)

      const tokenA = new Token(_tokenA.contract, _tokenA.decimals, _tokenA.symbol)
      const tokenB = new Token(_tokenB.contract, _tokenB.decimals, _tokenB.symbol)
      data = this.charts.map((c) => {
        const price = new Price(
          tokenA.sortsBefore(tokenB) ? tokenA : tokenB,
          tokenB.sortsBefore(tokenA) ? tokenA : tokenB,
          Q128,
          JSBI.multiply(JSBI.BigInt(c.price), JSBI.BigInt(c.price))
        )

        return {
          x: c._id,
          y: parseFloat(price.toSignificant()),
        }
      })

      return [
        {
          name: 'Price',
          data,
        },
      ]
    },
    tabs() {
      return [
        { label: 'Pools', value: 'pools' },
        { label: 'Spot', value: 'spot' },
        { label: 'Holders', value: 'holders' },
      ]
    },
    activeTab: {
      set(v) {
        this.$router.replace({
          query: { tab: v },
        })
      },
      get() {
        return this.$route.query.tab || 'pools'
      },
    },
  },

  watch: {
    token(n, old) {
      if (n && n.id === old?.id) return
      this.fetchStats()
      this.fetchHolders()
      this.fetchCharts()
    },

    quoteToken() {
      this.fetchCharts()
    },

    selectedResolution() {
      this.fetchCharts()
    },
  },

  mounted() {
    this.fetchHolders()
    this.fetchStats()
    this.quoteToken = this.$store.state.network.baseToken.symbol
  },

  methods: {
    async fetchHolders() {
      if (!this.token) return
      try {
        const url = `${this.$store.state.network.lightapi}/api/topholders/${this.$store.state.network.name}/${this.token.contract}/${this.token.symbol}/100`
        const { data } = await axios.get(url)
        this.holders = data
      } catch (error) {
        console.log('error loading token holders', error)
      }
    },

    async fetchStats() {
      if (!this.token) return

      const { rows } = await this.$rpc.get_table_rows({
        code: this.token.contract,
        table: 'stat',
        limit: 1,
        scope: this.token.symbol,
      })

      this.stats = rows[0]
    },

    async fetchCharts() {
      if (!this.token) return

      const { tokenA, tokenB } = this

      try {
        const { data } = await this.$axios.get('/v2/swap/charts', {
          params: {
            period: this.selectedResolution,
            tokenA,
            tokenB,
          },
        })

        this.charts = data
      } catch (e) {
        console.log('Getting Chart E', e)
      }
    },
  },

  head() {
    const [symbol, contract] = this.$route.params.id.split('-')

    const name = this.fundamental ? this.fundamental.name : symbol.toUpperCase()

    return {
      title: `${symbol.toUpperCase()} | Info | Spot & AMM Pairs | Alcor Exchange (${this.network.desc})`,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: `Explore ${name} token information: Supply, Spot pairs, Volume. Trade/Swap on ${this.network.desc} Alcor Exchange`,
        },
        {
          hid: 'og:image',
          name: 'og:image',
          content: this.$tokenLogo(symbol, contract),
        },
      ],
    }
  },
}
</script>
