<template lang="pug">
AlcorContainer.analytics-stats.fs-14
  .item(v-for="item in items")
    .key {{ item.title }}
    VueSkeletonLoader(variant="p" width="40px" height="1rem" rounded animation="wave" v-if="loading")
    .value(v-else :style="{color: renderColor(item)}") {{ format(item) }}
</template>

<script>
import AlcorContainer from '@/components/AlcorContainer'
import VueSkeletonLoader from 'skeleton-loader-vue'
export default {
  name: 'AnalyticsStats',
  components: {
    AlcorContainer,
    VueSkeletonLoader,
  },
  props: ['loading', 'items'],
  data: () => ({
    stats: {},
  }),
  computed: {},
  methods: {
    format(item) {
      if (item.formatter === 'usd') return `$${this.$options.filters.commaFloat(parseFloat(item.value), 2)}`
      if (item.formatter === 'percentage') return `${item.value}%`

      return item.value
    },
    renderColor(item) {
      if (!item.color) return 'var(--text-default)'
      if (item.value > 0) return 'var(--main-action-green)'
      if (item.value < 0) return 'var(--main-action-red)'
      return 'var(--text-default)'
    },
  },
}
</script>

<style scoped lang="scss">
.analytics-stats {
  display: grid;
  .item {
    display: flex;
    align-items: center;
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
