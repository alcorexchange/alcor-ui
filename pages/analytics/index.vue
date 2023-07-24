<template lang="pug">
.analytics-page
  .analytics-stats-and-chart
    AnalyticsStats
    AnalyticsChart.analytics-chart

  // TODO
  //- AnalyticsSectionHeader(title="Top Tokens")
  //-   template(#action)
  //-     AlcorButton Explore
  //- AnalyticsTokensTable(:tableData="tokens" @pageChange="getTokens")

  AnalyticsSectionHeader(title="Top Pools")
    template(#action)
      AlcorButton Explore
  AnalyticsPoolsTable(:tableData="pools" @pageChange="getPools")
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
    AnalyticsSpotPairsTable
  },
  data: () => ({
    tokens: Array.from({ length: 10 }),
    pools: Array.from({ length: 10 }),
    spotsPage: 1,
  }),
  computed: {
    ...mapState(['markets']),
    paginatedMarkets() {
      const PER_PAGE = 10
      const lowestItem = (this.spotsPage - 1) * PER_PAGE
      const highestItem = this.spotsPage * PER_PAGE
      return this.markets.filter((_, i) => lowestItem <= i && i < highestItem)
    }
  },
  methods: {
    getTokens(page = 1) {
      // get tokens from API
      console.log(page)
    },
    getPools(page = 1) {
      // get pools from API
      console.log(page)
    },
    getSpots(page = 1) {
      // get spots from API
      this.spotsPage = page
    }
  },
}
</script>

<style scoped lang="scss">
</style>
