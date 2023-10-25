<template lang="pug">
.analytics-page(v-if="token")
  ReturnLink Back

  AnalyticsTokenHeader(:token="token" :fundamental="fundamental")

  AlcorContainer.p-3(v-if="fundamental")
    .title.muted.mb-1 Description
    .content {{ fundamental.description }}

  .analytics-stats-and-chart
    AnalyticsStats
    AnalyticsChartLayout
      div price chart here

  AlcorContainer.p-3
    .title.muted.mb-1 Description {{ token }}
    .content {{ stats }}

</template>

<script>
import AnalyticsTokenHeader from '@/components/analytics/AnalyticsTokenHeader'
import AnalyticsStats from '@/components/analytics/AnalyticsStats'
import AnalyticsChartLayout from '~/components/analytics/AnalyticsChartLayout.vue'
import ReturnLink from '~/components/ReturnLink.vue'
import AlcorContainer from '~/components/AlcorContainer.vue'

export default {
  components: {
    AnalyticsTokenHeader,
    AnalyticsStats,
    AnalyticsChartLayout,
    ReturnLink,
    AlcorContainer,
  },

  watch: {
    token() {
      this.fetchStats()
    }
  },

  computed: {
    token() {
      return this.$getToken(this.$route.params.id)
    },

    fundamental() {
      if (!this.$fundamentals[this.$store.state.network.name]) return null

      return this.$fundamentals[this.$store.state.network.name][
        this.token.symbol + '@' + this.token.contract
      ]
    }
  },

  data() {
    return {
      stats: {}
    }
  },

  mounted() {
    this.fetchStats()
  },

  methods: {
    async fetchStats() {
      if (!this.token) return

      const { rows } = await this.$rpc.get_table_rows({
        code: this.token.contract,
        table: 'stat',
        limit: 1,
        scope: this.token.symbol
      })

      this.stats = rows[0]
    }
  }
}
</script>
