<template lang="pug">
.analytics-page
  AnalyticsHeader
  .analytics-stats-and-chart
    AnalyticsStats(:items="globalStatsItems" :loading="isLoadingStats")
    AnalyticsChart.analytics-chart

  // TODO
  //- AnalyticsSectionHeader(title="Top Tokens")
  //-   template(#action)
  //-     AlcorButton Explore
  //- AnalyticsTokensTable(:tableData="tokens" @pageChange="getTokens")

  AnalyticsPoolsTable()
  AnalyticsSectionHeader(title="Top Spot Pairs")
    template(#action)
      AlcorButton Explore
  AnalyticsSpotPairsTable(:tableData="paginatedMarkets" :length="markets.length" @pageChange="getSpots")
</template>

<script>
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader'
import AnalyticsStats from '@/components/analytics/AnalyticsStats'
import AnalyticsChart from '@/components/analytics/AnalyticsChart'
import AnalyticsSectionHeader from '@/components/analytics/AnalyticsSectionHeader'
import AnalyticsTokensTable from '@/components/analytics/AnalyticsTokensTable'
import AnalyticsPoolsTable from '@/components/analytics/AnalyticsPoolsTable'
import AnalyticsSpotPairsTable from '@/components/analytics/AnalyticsSpotPairsTable'
import AlcorButton from '@/components/AlcorButton'
import { mapState } from 'vuex'

export default {
  name: 'AnalyticsPage',
  components: {
    AnalyticsHeader,
    AnalyticsStats,
    AnalyticsChart,
    AnalyticsSectionHeader,
    AlcorButton,
    AnalyticsTokensTable,
    AnalyticsPoolsTable,
    AnalyticsSpotPairsTable,
  },
  data: () => ({
    spotsPage: 1,
    stats: {},
    isLoadingStats: true,
  }),
  computed: {
    ...mapState(['markets']),
    paginatedMarkets() {
      const PER_PAGE = 10
      const lowestItem = (this.spotsPage - 1) * PER_PAGE
      const highestItem = this.spotsPage * PER_PAGE
      return this.markets.filter((_, i) => lowestItem <= i && i < highestItem)
    },
    globalStatsItems() {
      return [
        {
          title: 'Total value locked',
          value: this.stats.totalValueLocked,
          formatter: 'usd',
        },
        {
          title: 'Swap Trading Volume (30d)',
          value: this.stats.swapTradingVolume,
          formatter: 'usd',
        },
        {
          title: 'Spot Trading Volume (30d)',
          value: this.stats.spotTradingVolume,
          formatter: 'usd',
        },
        {
          title: 'Swap Fees (30d)',
          value: this.stats.swapFees,
          formatter: 'usd',
        },
        {
          title: 'Spot Fees (30d)',
          value: this.stats.spotFees,
          formatter: 'usd',
        },
        {
          title: 'Spot Transactions',
          value: this.stats.spotTransactions,
        },
        {
          title: 'Swap Transactions',
          value: this.stats.swapTransactions,
        },
        {
          title: 'Daily active users (30d avg.)',
          value: this.stats.dailyActiveUsers,
        },
        {
          title: 'Total Liquidity Pools',
          value: this.stats.totalLiquidityPools,
        },
        {
          title: 'Total Spot Pairs',
          value: this.stats.totalSpotPairs,
        },
      ]
    },
  },

  mounted() {
    this.getGlobalStats()
  },

  methods: {
    async getGlobalStats() {
      this.isLoadingStats = true
      try {
        const { data } = await this.$axios.get('/v2/analytics/global', {
          params: {
            resolution: '1M',
          },
        })
        this.stats = data[0]
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoadingStats = false
      }
    },
    getTokens(page = 1) {
      // get tokens from API
      console.log(page)
    },
    getSpots(page = 1) {
      // get spots from API
      this.spotsPage = page
    },
  },
}
</script>

<style scoped lang="scss"></style>
