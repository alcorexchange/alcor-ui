<template lang="pug">
.analytics-page
  AnalyticsTokenHeader
  .analytics-stats-and-chart
    AnalyticsStats
    AnalyticsChartLayout
      div price chart here
</template>

<script>
import AnalyticsTokenHeader from '@/components/analytics/AnalyticsTokenHeader'
import AnalyticsStats from '@/components/analytics/AnalyticsStats'
import AnalyticsChartLayout from '~/components/analytics/AnalyticsChartLayout.vue'

export default {
  components: {
    AnalyticsTokenHeader,
    AnalyticsStats,
    AnalyticsChartLayout,
  },
}
</script>
