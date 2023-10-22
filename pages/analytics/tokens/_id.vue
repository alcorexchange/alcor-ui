<template lang="pug">
.analytics-page
  ReturnLink Back
  AnalyticsTokenHeader
  .analytics-stats-and-chart
    AnalyticsStats
    AnalyticsChartLayout
      div price chart here
  AlcorContainer.p-3
    .title.muted.mb-1 Description
    .content Native USDT on EOS, Bridged to WAX Chain by Alcor team, using secure IBC technology. IBC are based on merkle root proof cryptography,
</template>

<script>
import AnalyticsTokenHeader from '@/components/analytics/AnalyticsTokenHeader'
import AnalyticsStats from '@/components/analytics/AnalyticsStats'
import AnalyticsChartLayout from '~/components/analytics/AnalyticsChartLayout.vue'
import ReturnLink from '~/components/ReturnLink.vue'
import AlcorContainer from '~/components/AlcorContainer.vue'

export default {
  components: {
    AnalyticsTokenHeader,
    AnalyticsStats,
    AnalyticsChartLayout,
    ReturnLink,
    AlcorContainer,
  },
}
</script>
