<template lang="pug">
.analytics-page-wrapper.mt-4
  .mt-3
    NuxtChild
</template>

<script>
export default {
  name: 'AnalyticsPage',
  components: {},

  head() {
    return {
      title: 'Alcor | Analytics',

      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'TVl, Volumes, Profitability and many other analytics.'
        }
      ]
    }
  }
}
</script>

<style></style>
