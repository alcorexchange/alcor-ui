<template lang="pug">
.pair-analytics-page
  AnalyticsHeader
  AnalyticsBreadcrumb(
    :token="{symbol: 'WAX', contract: 'wax.alcor'}"
    pair="WAX/BLK"
  )
  AnalyticsPairHeader
  .analytics-stats-and-chart
    AnalyticsStats
    AnalyticsChart
</template>

<script>
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader'
import AnalyticsStats from '@/components/analytics/AnalyticsStats'
import AnalyticsChart from '@/components/analytics/AnalyticsChart'
import AnalyticsSectionHeader from '@/components/analytics/AnalyticsSectionHeader'
import AnalyticsBreadcrumb from '@/components/analytics/AnalyticsBreadcrumb'
import AnalyticsPairHeader from '@/components/analytics/AnalyticsPairHeader'
import AlcorButton from '@/components/AlcorButton'

export default {
  components: {
    AnalyticsHeader,
    AnalyticsStats,
    AnalyticsChart,
    AnalyticsSectionHeader,
    AlcorButton,
    AnalyticsBreadcrumb,
    AnalyticsPairHeader
  }
}
</script>
