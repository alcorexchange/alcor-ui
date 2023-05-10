<template lang="pug">
AlcorContainer.analytics-stats
  .item(v-for="x in 10")
    .key Total value locked
    .value $900K
    .percent +6.66%
</template>

<script>
import AlcorContainer from '@/components/AlcorContainer'
export default {
  name: 'AnalyticsStats',
  components: {
    AlcorContainer
  }
}
</script>

<style scoped lang="scss">
.analytics-stats {
  display: grid;
  .item {
    display: flex;
    padding: 8px;
    border-radius: 8px;
    &:nth-child(odd) {
      background: var(--background-color-base);
    }
  }
  .key {
    flex: 1;
  }
  .percent {
    display: flex;
    justify-content: flex-end;
    width: 80px;
  }
}
</style>
