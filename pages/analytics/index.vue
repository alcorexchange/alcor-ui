<template lang="pug">
.analytics-page
  AnalyticsHeader
  .stats-and-chart
    AnalyticsStats
    AnalyticsChart.analytics-chart
  AnalyticsSectionHeader(title="Top Tokens")
    template(#action)
      AlcorButton Explore
  AnalyticsTopTokensTable(:tableData="['', '']")
  AnalyticsSectionHeader(title="Top Pools")
    template(#action)
      AlcorButton Explore
  AnalyticsTopPoolsTable(:tableData="['', '']")
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
import AnalyticsTopTokensTable from '@/components/analytics/AnalyticsTopTokensTable'
import AnalyticsTopPoolsTable from '@/components/analytics/AnalyticsTopPoolsTable'
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
    AnalyticsTopTokensTable,
    AnalyticsTopPoolsTable,
    AnalyticsSpotPairsTable
  }
}
</script>

<style scoped lang="scss">
.analytics-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 40px;
}
.stats-and-chart {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 10px;
  align-items: start;
}
</style>
