<template lang="pug">
.analytics-page
  .analytics-stats-and-chart
    AnalyticsStats
    AnalyticsChart.analytics-chart
  AnalyticsSectionHeader(title="Top Tokens")
    template(#action)
      AlcorButton Explore
  AnalyticsTokensTable(:tableData="['', '']")
  AnalyticsSectionHeader(title="Top Pools")
    template(#action)
      AlcorButton Explore
  AnalyticsPoolsTable(:tableData="['', '']")
  AnalyticsSectionHeader(title="Top Spot Pairs")
    template(#action)
      AlcorButton Explore
  AnalyticsSpotPairsTable(:tableData="['', '']")
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
  }
}
</script>

<style scoped lang="scss">
</style>
