<template lang="pug">
.analytics-page
  AnalyticsHeader

  iframe(loading=lazy src='https://grafana.waxtools.net/d-solo/ae1f479a-9dd0-40f2-b35b-59b7fb91deac/swap-stats?orgId=2&refresh=5m&from=1698345895597&to=1700937895597&panelId=30',
    height='500', frameborder='0')

  iframe(loading=lazy src="https://grafana.waxtools.net/d-solo/ae1f479a-9dd0-40f2-b35b-59b7fb91deac/swap-stats?orgId=2&refresh=5m&from=1698346480678&to=1700938480678&panelId=16" height='500', frameborder='0' allowfullscreen)
</template>

<script>
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader'

export default {
  components: { AnalyticsHeader }
}
</script>
