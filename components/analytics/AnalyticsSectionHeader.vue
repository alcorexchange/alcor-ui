<template lang="pug">
.analytics-section-header
  .title {{ title }}
  .actions
    slot(name="action")
</template>

<script>
export default {
  name: 'AnalyticsSectionHeader',
  props: ['title']
}
</script>

<style scoped lang="scss">
.analytics-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .title {
    font-size: 1.18rem;
    font-weight: 500;
  }
  .actions::v-deep {
    .alcor-button {
      padding: 4px 8px
    }
  }
}
</style>
