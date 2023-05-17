<template lang="pug">
.analytics-page-wrapper.mt-4
  AnalyticsHeader
  .mt-3
    NuxtChild
</template>

<script>
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader'
export default {
  name: 'AnalyticsPage',
  components: {
    AnalyticsHeader
  }
}
</script>

<style>

</style>
