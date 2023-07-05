<template lang="pug">
AlcorContainer.analytics-stats.fs-14
  .item(v-for="item in items")
    .key {{ item.title }}
    VueSkeletonLoader(variant="p" width="40px" height="1rem" rounded animation="wave" v-if="isLoading")
    .value(v-else) {{ item.formatter ? item.formatter(stats[item.key]) : defaultFormatter(stats[item.key]) }}
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
  data: () => ({
    stats: {},
    isLoading: true,
  }),
  computed: {
    items() {
      return [
        {
          title: 'Total value locked',
          key: 'totalValueLocked',
        },
        {
          title: 'Swap Trading Volume (30d)',
          key: 'swapTradingVolume',
        },
        {
          title: 'Spot Trading Volume (30d)',
          key: 'spotTradingVolume',
        },
        {
          title: 'Spot Transactions',
          key: 'spotTransactions',
          formatter: (val) => this.$options.filters.commaFloat(val, 0),
        },
        {
          title: 'Swap Transactions',
          key: 'swapTransactions',
          formatter: (val) => this.$options.filters.commaFloat(val, 0),
        },
        {
          title: 'Swap Fees (30d)',
          key: 'swapFees',
        },
        {
          title: 'Spot Fees (30d)',
          key: 'spotFees',
        },
        {
          title: 'Daily active users (30d a.)',
          key: 'dailyActiveUsers',
          formatter: (val) => this.$options.filters.commaFloat(val, 0),
        },
        {
          title: 'Total Liquidity Pools',
          key: 'totalLiquidityPools',
          formatter: (val) => this.$options.filters.commaFloat(val, 0),
        },
        {
          title: 'Total Spot Pairs',
          key: 'totalSpotPairs',
          formatter: (val) => this.$options.filters.commaFloat(val, 0),
        },
      ]
    },
  },
  mounted() {
    this.getAll()
  },
  methods: {
    async getAll() {
      this.isLoading = true
      try {
        const { data } = await this.$axios.get('/v2/analytics/global', {
          params: {
            resolution: '1M',
          },
        })
        this.stats = data[0]
        console.log(data[0])
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoading = false
      }
    },
    defaultFormatter(number = 0) {
      return `$${this.$options.filters.commaFloat(number, 1)}`
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
