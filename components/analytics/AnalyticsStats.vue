<template lang="pug">
AlcorContainer.analytics-stats.fs-14
  .item(v-for="item in items")
    .key {{ item.title }}
    VueSkeletonLoader(variant="p" width="40px" height="1rem" rounded animation="wave" v-if="loading")
    .value(v-else) {{ format(item) }}
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
      if (item.formatter === 'usd')
        return `$${this.$options.filters.commaFloat(item.value, 0)}`

      return this.$options.filters.commaFloat(item.value, 0)
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
