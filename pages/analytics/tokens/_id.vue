<template lang="pug">
.analytics-page
  AnalyticsTokenHeader
  .analytics-stats-and-chart
    AnalyticsStats
    AnalyticsChart
</template>

<script>
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader'
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
    AnalyticsSectionHeader,
    AnalyticsStats,
    AnalyticsChart,
    AnalyticsPoolsTable,
    AnalyticsSpotPairsTable,
    AnalyticsTokenHeader,
    AlcorButton,
  },
}
</script>
