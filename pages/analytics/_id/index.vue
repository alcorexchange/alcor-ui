<template lang="pug">
.analytics-page
  AnalyticsBreadcrumb(
    :token="{symbol: 'WAX', contract: 'wax.alcor'}"
  )
  AnalyticsTokenHeader
  .analytics-stats-and-chart
    AnalyticsStats
    AnalyticsChart
  AnalyticsSectionHeader(title="Pools")
    template(#action)
      AlcorButton Explore
  AnalyticsPoolsTable(:tableData="Array.from({length: 8})")
  AnalyticsSectionHeader(title="Spot Pairs")
    template(#action)
      AlcorButton Explore
  AnalyticsSpotPairsTable(:tableData="Array.from({length: 8})")
</template>

<script>
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader'
import AnalyticsBreadcrumb from '@/components/analytics/AnalyticsBreadcrumb'
import AnalyticsSectionHeader from '@/components/analytics/AnalyticsSectionHeader'
import AnalyticsStats from '@/components/analytics/AnalyticsStats'
import AnalyticsChart from '@/components/analytics/AnalyticsChart'
import AnalyticsPoolsTable from '@/components/analytics/AnalyticsPoolsTable'
import AnalyticsSpotPairsTable from '@/components/analytics/AnalyticsSpotPairsTable'
import AnalyticsTokenHeader from '@/components/analytics/AnalyticsTokenHeader'
import AlcorButton from '@/components/AlcorButton'

export default {
  components: {
    AnalyticsHeader,
    AnalyticsBreadcrumb,
    AnalyticsSectionHeader,
    AnalyticsStats,
    AnalyticsChart,
    AnalyticsPoolsTable,
    AnalyticsSpotPairsTable,
    AnalyticsTokenHeader,
    AlcorButton
  }
}
</script>
