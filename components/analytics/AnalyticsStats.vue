<template lang="pug">
AlcorContainer.analytics-stats.fs-14
  .item(v-for="item in items")
    .key {{ item.title }}
    .value {{ defaultFormatter(stats[item.key]) }}
    //- .percent +6.66%
</template>

<script>
import AlcorContainer from '@/components/AlcorContainer'
export default {
  name: 'AnalyticsStats',
  components: {
    AlcorContainer,
  },
  data: () => ({
    stats: {},
    isLoading: false,
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
        },
        {
          title: 'Swap Transactions',
          key: 'swapTransactions',
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
        },
        {
          title: 'Total Liquidity Pools',
          key: 'totalLiquidityPools',
        },
        {
          title: 'Total Spot Pairs',
          key: 'totalSpotPairs',
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
    defaultFormatter: (number) => {
      if (number >= 1000000) {
        return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
      }
      if (number >= 1000) {
        return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
      }
      return number
    },
  },
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
