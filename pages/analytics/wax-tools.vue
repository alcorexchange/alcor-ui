<template lang="pug">
.analytics-page
  AnalyticsHeader

  .flex
    div
      | Provided by
      a(href="https://grafana.waxtools.net/" target="_blank")  WAX Tools

  .flex
    iframe(loading=lazy
      src='https://grafana.waxtools.net/d-solo/ae1f479a-9dd0-40f2-b35b-59b7fb91deac/swap-stats?orgId=2&refresh=5m&panelId=47"' height='500', frameborder='0' width="50%")

    iframe(loading=lazy
      src='https://grafana.waxtools.net/d-solo/ae1f479a-9dd0-40f2-b35b-59b7fb91deac/swap-stats?orgId=2&refresh=5m&panelId=49' height='500', frameborder='0' width="50%")

  iframe(loading=lazy
    src='https://grafana.waxtools.net/d-solo/ae1f479a-9dd0-40f2-b35b-59b7fb91deac/swap-stats?orgId=2&refresh=5m&from=1698345895597&panelId=30'
    height='500', frameborder='0')

  iframe(loading=lazy src="https://grafana.waxtools.net/d-solo/ae1f479a-9dd0-40f2-b35b-59b7fb91deac/swap-stats?orgId=2&refresh=5m&from=1698346480678&panelId=16" height='500', frameborder='0')
</template>

<script>
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader'

export default {
  //layout: 'landing', TODO Full schreen

  components: { AnalyticsHeader }
}
</script>
