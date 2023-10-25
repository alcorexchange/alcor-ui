<template lang="pug">
div(v-if="pool && stats").analytics-pool-detail-page
  AnalyticsPoolHeader(:pool="pool")

  .analytics-stats-and-chart.mb-3
    // TODO: make stats dynamic
    AnalyticsStats
    AnalyticsChartLayout.chart-layout(
      :modes="chartModes"
      :selectedMode.sync="selectedMode"
      :selectedResolution.sync="selectedResolution"
    )
      component(:is="renderChart" width='100%' height="100%" ref="chart" :series="renderSeries" class="chart" :color="selectedMode === 'Fees' ? '#723de4' : undefined")

  VirtualTable.virtual-table(
    :table="tableData"
    v-loading="loading"
  )
    template(#row="{ item }")
      AnalyticsPositionRow.analytics-position-row(:position="item" @showPosition="showPosition")
</template>

<script>
import { tickToPrice } from '@alcorexchange/alcor-swap-sdk'
import { isTicksAtLimit, constructPoolInstance } from '~/utils/amm'

import PairIcons from '~/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import PositionFees from '~/components/amm/PositionFees'
import AlcorButton from '~/components/AlcorButton'
import Line from '~/components/charts/Line'
import Bars from '~/components/charts/Bars.vue'
import StackedColumns from '~/components/charts/StackedColumns'
import VirtualTable from '~/components/VirtualTable.vue'
import AnalyticsPositionRow from '~/components/analytics/pool/AnalyticsPositionRow.vue'
import AnalyticsBreadcrumb from '~/components/analytics/AnalyticsBreadcrumb'
import AnalyticsStats from '~/components/analytics/AnalyticsStats'
import AnalyticsChartLayout from '~/components/analytics/AnalyticsChartLayout'
import AnalyticsChart from '~/components/analytics/AnalyticsChart'
import AnalyticsPoolHeader from '~/components/analytics/pool/AnalyticsPoolHeader'
import ReturnLink from '~/components/ReturnLink.vue'

export default {
  components: {
    PairIcons,
    TokenImage,
    PositionFees,
    AlcorButton,
    StackedColumns,
    VirtualTable,
    AnalyticsPositionRow,
    AnalyticsPoolHeader,
    AnalyticsChartLayout,
    AnalyticsChart,
    AnalyticsStats,
    AnalyticsBreadcrumb,
    LineChart: Line,
    Volume: StackedColumns,
    Bars,
    ReturnLink,
  },

  fetch({ params, error }) {
    // TODO 404
  },

  data() {
    return {
      loading: true,
      loadedPositions: [],
      selectedResolution: '1w',
      selectedMode: 'TVL',

      chart: [],

      liquiditySeries: [{ name: 'lol', data: [], type: 'area' }],
    }
  },

  computed: {
    renderSeries() {
      if (this.selectedMode === 'Ticks') return this.liquiditySeries

      const getY = (item) => {
        if (this.selectedMode === 'TVL')
          return (item.usdReserveA + item.usdReserveB).toFixed(0)
        if (this.selectedMode === 'Volume') return item.volumeUSD
        if (this.selectedMode === 'Fees') return 1
      }

      return [
        {
          name: this.selectedMode,
          data: this.chart.map((item) => ({
            x: item._id,
            y: getY(item),
          })),
        },
      ]
    },
    renderChart() {
      if (this.selectedMode === 'Volume') return 'Volume'
      if (this.selectedMode === 'Ticks') return 'Bars'
      return 'LineChart'
    },
    chartModes() {
      return [
        { value: 'TVL' },
        { value: 'Volume' },
        { value: 'Fees' },
        { value: 'Ticks' },
      ]
    },
    id() {
      return this.$route.params.id
    },

    pool() {
      const _pool = this.$store.state.amm.pools.find((p) => p.id == this.id)
      if (!_pool) return

      return constructPoolInstance(_pool)
    },

    stats() {
      return this.$store.state.amm.poolsStats.find((p) => p.id == this.id)
    },

    positions() {
      return this.loadedPositions
        .map((p) => {
          if (!this.pool) return {}

          const { pool } = this
          // prettier-ignore
          const priceUpper = isTicksAtLimit(pool.fee, p.tickLower, p.tickUpper).UPPER ? '∞' : tickToPrice(pool.tokenA, pool.tokenB, p.tickUpper).toSignificant(5)
          // prettier-ignore
          const priceLower = isTicksAtLimit(pool.fee, p.tickLower, p.tickUpper).LOWER ? '0' : tickToPrice(pool.tokenA, pool.tokenB, p.tickLower).toSignificant(5)

          const link = `/positions/${p.id}`

          return {
            ...p,
            pool,
            priceUpper,
            priceLower,
            link,
          }
        })
        .filter((p) => p.pool)
    },
    tableData() {
      const header = [
        {
          label: 'Account',
        },
        {
          label: 'Range',
          desktopOnly: true,
        },
        {
          label: 'Assets in Pool',
        },
        {
          label: 'Unclaimed Fees',
          sortable: true,
          value: 'feesA',
          desktopOnly: true,
        },
        {
          label: 'Total Value',
          sortable: true,
          value: 'totalValue',
          desktopOnly: true,
        },
        {
          label: 'P&L',
          sortable: true,
          value: 'pNl',
          desktopOnly: true,
        },
        {
          label: '',
          desktopOnly: true,
        },
      ]

      const data = this.positions || []
      const itemSize = 56
      const pageMode = true

      return { header, data, itemSize, pageMode }
    },
  },

  watch: {
    // because chart needs pool tokens so we should get it once pool ( tokens ) are available.
    pool: {
      handler(pool) {
        if (!pool) return
        this.getChart()
      },
      immediate: true,
    },
  },

  mounted() {
    this.fetchPositions()
    this.fetchLiquidityChart()
  },

  methods: {
    async fetchPositions() {
      const { data } = await this.$axios.get(
        `/v2/swap/pools/${this.id}/positions`
      )
      this.loading = false
      this.loadedPositions = data
    },

    async fetchLiquidityChart() {
      let { data } = await this.$axios.get(
        '/v2/swap/pools/' + this.id + '/liquidityChartSeries',
        { params: { inverted: false } }
      )

      data = data.filter((s) => Math.max(s.x, s.y) <= 1247497401346422)

      console.log('data', data)

      this.liquiditySeries = [
        {
          name: 'lol',
          type: 'area',
          data, // TEMP FIX
          //data: [{ x: 1, y: 4 }, { x: 2, y: 10 }]
        },
      ]

      console.log(this.liquiditySeries)
    },

    async getChart() {
      const tokenA = this.pool.tokenA.id
      const tokenB = this.pool.tokenB.id
      console.log({ tokenA, tokenB })
      if (!tokenA || !tokenB) return
      const period = undefined
      const params = {
        tokenA,
        tokenB,
        period,
      }

      try {
        const { data } = await this.$axios.get('/v2/swap/charts', {
          params,
        })

        this.chart = data
      } catch (e) {
        console.log('chart get error')
      }
    },

    showPosition(position) {
      this.$router.push(position.link)
    },
  },
}
</script>

<style lang="scss" scoped>
.rot {
  transform: rotate(90deg);
}
.tag {
  border: var(--border-1);
  background: var(--bg-alter-2);
  font-size: 10px;
  line-height: 12px;
  padding: 4px;
  border-radius: 4px;
}
.indicator {
  width: 6px;
  height: 6px;

  background: var(--disabled-indicator);
  border-radius: 50%;

  &.in-range {
    background: var(--access-indicator);
  }
}

.virtual-table {
  --grid-template: 10% 22% 18% 17% 10% 10% auto;
  &::v-deep {
    .header {
      display: grid;
      grid-template-columns: var(--grid-template);
      color: #909399;
      font-weight: 500;
      font-size: 14px;
      padding: 0;
      .header__column {
        padding: 10px;
        justify-content: flex-start;
      }
    }
  }
}
.analytics-position-row {
  display: grid;
  grid-template-columns: var(--grid-template);
}

@media only screen and (max-width: 1100px) {
  .virtual-table {
    --grid-template: 1fr 180px;
  }
  .analytics-position-row::v-deep {
    .desktopOnly {
      font-size: 12px !important;
      display: none !important;
    }
  }
}
</style>

<style scoped lang="scss">
.chart-layout {
  min-height: 400px;
}
.position-table {
  border-radius: 12px;
  .el-table__header {
    th {
      font-weight: 400 !important;
      font-size: 12px !important;
      color: var(--text-disable);
      .cell {
        padding: 0px 16px;
      }
    }
  }
  .el-table__row {
    cursor: pointer;
  }
}
.earn {
  color: var(--main-green);
  &.red {
    color: var(--main-red);
  }
}
@media only screen and (max-width: 1100px) {
  .custom-responsive-table {
    .assets {
      grid-column: 1 / 3;
      .assets-inner {
        padding: 8px 0 !important;
      }
    }
    .min-max {
      grid-column: 1 / 3;
    }
    .unclaimed-fees {
      margin-left: auto;
      .cell {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .position-fees {
        align-items: flex-end;
      }
    }
  }
}
</style>
