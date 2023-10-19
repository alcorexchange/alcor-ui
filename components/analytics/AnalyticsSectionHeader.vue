<template lang="pug">
.analytics-section-header
  .title
    h2  {{ title }}
    slot(name="afterTitle")
  .actions
    slot(name="action")
</template>

<script>
export default {
  name: 'AnalyticsSectionHeader',
  props: ['title'],
}
</script>

<style scoped lang="scss">
.analytics-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .title {
    display: flex;
    align-items: center;
    gap: 12px;
    h2 {
      font-size: 1.18rem;
      font-weight: 500;
      margin: 0;
    }
  }
  .actions::v-deep {
    .alcor-button {
      padding: 4px 8px;
    }
  }
}
</style>
