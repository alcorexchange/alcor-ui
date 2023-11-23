<template lang="pug">
div(v-if="pool && stats").analytics-pool-detail-page
  AnalyticsPoolHeader(:pool="pool")

  .analytics-stats-and-chart.mb-3
    AnalyticsStats(:items="columnStats")
    AnalyticsChartLayout.chart-layout(
      :modes="chartModes"
      :selectedMode.sync="selectedMode"
      :selectedResolution.sync="selectedResolution"
    )
      component(:is="renderChart" width='100%' height="100%" ref="chart" :series="renderSeries" class="chart" :color="selectedMode === 'Fees' ? '#723de4' : undefined" :tooltipFormatter="tooltipFormatter")

  VirtualTable.virtual-table(
    :table="tableData"
    v-loading="loading"
  )
    template(#row="{ item }")
      AnalyticsPositionRow.analytics-position-row(:position="item" @showPosition="showPosition")
</template>

<script>
import JSBI from 'jsbi'
import { Token, tickToPrice, Price, Q128 } from '@alcorexchange/alcor-swap-sdk'
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
      selectedResolution: 'All',
      selectedMode: 'TVL',

      chart: [],

      liquiditySeries: [{ name: 'lol', data: [], type: 'area' }],
    }
  },

  computed: {
    columnStats() {
      return [
        {
          title: 'Volume 24H',
          value: this.stats.volumeUSD24,
          formatter: 'usd',
        },

        {
          title: 'Volume Week',
          value: this.stats.volumeUSDWeek,
          formatter: 'usd',
        },

        {
          title: 'Volume Month',
          value: this.stats.volumeUSDMonth,
          formatter: 'usd',
        },

        {
          title: 'Total Value Locked',
          value: this.stats.tvlUSD,
          formatter: 'usd',
        },

        {
          title: 'Change 24H',
          value: this.stats.change24 > 0 ? '+' + this.stats.change24 : this.stats.change24,
          formatter: 'percentage',
          color: true,
        },
        {
          title: 'Change Week',
          value: this.stats.changeWeek > 0 ? '+' + this.stats.changeWeek : this.stats.changeWeek,
          formatter: 'percentage',
          color: true,
        },
        {
          title: 'Total positions',
          value: this.loadedPositions.length,
        },
      ]
    },

    renderSeries() {
      if (this.selectedMode === 'Ticks') return this.liquiditySeries

      const getY = (item) => {
        if (this.selectedMode === 'TVL') return (item.usdReserveA + item.usdReserveB).toFixed(0)
        if (this.selectedMode === 'Volume') return item.volumeUSD
        if (this.selectedMode === 'Price') {
          const tokenA = this.pool.tokenA
          const tokenB = this.pool.tokenB
          const price = new Price(
            tokenA.sortsBefore(tokenB) ? tokenA : tokenB,
            tokenB.sortsBefore(tokenA) ? tokenA : tokenB,
            Q128,
            JSBI.multiply(JSBI.BigInt(item.price), JSBI.BigInt(item.price))
          )

          return parseFloat(price.toSignificant())
        }
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
      if (this.selectedMode === 'Price') return 'LineChart'
      return 'LineChart'
    },

    chartModes() {
      //return [{ value: 'TVL' }, { value: 'Volume' }, { value: 'Ticks' }]
      return [{ value: 'TVL' }, { value: 'Volume' }, { value: 'Price' }]
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
      handler(pool, oldPool) {
        // only fetch once chart on pool having value
        if (!pool || oldPool) return
        this.getChart()
      },
      immediate: true,
    },
    selectedResolution() {
      this.getChart()
    },
  },

  mounted() {
    this.fetchPositions()
    this.fetchLiquidityChart()
  },

  methods: {
    tooltipFormatter(value) {
      if (this.selectedMode === 'TVL') {
        return `$${value}`
      }
      return value
    },
    async fetchPositions() {
      const { data } = await this.$axios.get(`/v2/swap/pools/${this.id}/positions`)
      this.loading = false
      this.loadedPositions = data
    },

    async fetchLiquidityChart() {
      let { data } = await this.$axios.get('/v2/swap/pools/' + this.id + '/liquidityChartSeries', {
        params: { inverted: false },
      })

      data = data.filter((s) => Math.max(s.x, s.y) <= 1247497401346422)

      console.log('data', data)

      this.liquiditySeries = [
        {
          name: 'liquidity',
          type: 'area',
          data,
        },
      ]

      console.log(this.liquiditySeries)
    },

    async getChart() {
      const tokenA = this.pool.tokenA.id
      const tokenB = this.pool.tokenB.id
      if (!tokenA || !tokenB) return
      const period = this.selectedResolution
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
