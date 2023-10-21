<template lang="pug">
div
  AnalyticsBreadcrumb
  AnalyticsPoolHeader

  h5 chart

  client-only
    vue-apex-charts(type="bar" :height="400" :options="chartOptions" :series="liquiditySeries" ref="chart")

  //StackedColumns(:series="liquiditySeries" height="400px" style="min-height: 400px")

  VirtualTable.virtual-table(
    :table="tableData"
    v-loading="loading"
  )
    template(#row="{ item }")
      AnalyticsPositionRow.analytics-position-row(:position="item" @showPosition="showPosition")

  //- el-table.position-table.custom-responsive-table(
  //-   v-loading="loading"
  //-   :data='positions',
  //-   style='width: 100%',
  //-   @row-click="showPosition"
  //- )
  //-   template(#empty)
  //-     .d-flex.flex-column.align-items-center.gap-30.py-5
  //-       i.el-icon-moon-night.fs-40
  //-       .fs-14.lh-14 No liquidity positions yet
  //-   el-table-column(:label='$t("Assets in Position")' width="140" className="assets")
  //-     template(slot-scope='{row}')
  //-       AlcorButton(@click="openInNewTab(monitorAccount(row.owner))")
  //-         span {{ row.owner }}

  //-   el-table-column(:label='$t("Range")' width="220" class-name="min-max")
  //-     template(slot-scope='{row}')
  //-       .d-flex.flex-column
  //-         .d-flex.align-items-center.gap-4
  //-           .indicator(:class="{ 'in-range': row.inRange }")
  //-           .fs-10 {{ row.inRange ? 'In Range': 'Out of Range' }}
  //-         .d-flex.align-items-center.gap-6.flex-wrap
  //-           .d-flex.gap-4
  //-             .fs-12.disable MIN
  //-             .fs-12.contrast {{ row.priceLower }}
  //-           i.el-icon-sort.rot
  //-           .d-flex.gap-4
  //-             .fs-12.disable MAX
  //-             .fs-12.contrast {{ row.priceUpper }}

  //-   el-table-column(:label='$t("Assets in Pool")' width="180")
  //-     template(slot-scope='{row}')
  //-       .d-flex.flex-column
  //-         .mobile-label {{ $t("Assets in Pool") }}
  //-         .d-flex.align-items-center.gap-4
  //-           token-image(:src='$tokenLogo(row.pool.tokenA.symbol, row.pool.tokenA.contract)' height="12")

  //-           .fs-12.d-flex.gap-4
  //-             span {{ row.amountA }}
  //-         .d-flex.align-items-center.gap-4
  //-           token-image(:src='$tokenLogo(row.pool.tokenB.symbol, row.pool.tokenB.contract)' height="12")

  //-           .fs-12.d-flex.gap-4(:class="{ red: false }")
  //-             span {{ row.amountB }}

  //-   el-table-column(:label='$t("Unclaimed Fees")' width="168" class-name="unclaimed-fees" sortable sort-by='feesA')
  //-     template(slot-scope='{row}')
  //-       .mobile-label.unclaimed-fees-label {{ $t("Unclaimed Fees") }}

  //-       .d-flex.flex-column
  //-         .d-flex.align-items-center.gap-4
  //-           token-image(:src='$tokenLogo(row.pool.tokenA.symbol, row.pool.tokenA.contract)' height="12")

  //-           .fs-12.earn.d-flex.gap-4
  //-             span {{ row.feesA }}
  //-         .d-flex.align-items-center.gap-4
  //-           token-image(:src='$tokenLogo(row.pool.tokenB.symbol, row.pool.tokenB.contract)' height="12")

  //-           .fs-12.earn.d-flex.gap-4
  //-             span {{ row.feesB }}

  //-   el-table-column(:label='$t("Total Value")' width="100" v-if="!isMobile" sortable sort-by='totalValue')
  //-     template(slot-scope='{row}')
  //-       span $ {{ row.totalValue && row.totalValue.toFixed(2) }}

  //-   el-table-column(:label='$t("P&L")' width="100" v-if="!isMobile" sortable sort-by='pNl')
  //-     template(slot-scope='{row}')
  //-       span(:style="{color: $percentColor(row.pNl)}") $ {{ row.pNl && row.pNl.toFixed(2) }}

  //-   el-table-column(:label='$t("Action")' v-if="!isMobile" align="right")
  //-     template(slot-scope='{row}')
  //-       alcor-button(compact) {{ $t('Manage') }}

</template>

<script>
import { tickToPrice } from '@alcorexchange/alcor-swap-sdk'
import { isTicksAtLimit, constructPoolInstance } from '~/utils/amm'

import PairIcons from '~/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import PositionFees from '~/components/amm/PositionFees'
import AlcorButton from '~/components/AlcorButton'
import StackedColumns from '~/components/charts/StackedColumns'
import VirtualTable from '~/components/VirtualTable.vue'
import AnalyticsPositionRow from '~/components/analytics/pool/AnalyticsPositionRow.vue'
import AnalyticsBreadcrumb from '~/components/analytics/AnalyticsBreadcrumb'
import AnalyticsStats from '~/components/analytics/AnalyticsStats'
import AnalyticsChart from '~/components/analytics/AnalyticsChart'
import AnalyticsPoolHeader from '~/components/analytics/AnalyticsPoolHeader'

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
    AnalyticsChart,
    AnalyticsStats,
    AnalyticsBreadcrumb,
  },

  fetch({ params, error }) {
    // TODO 404
  },

  data() {
    return {
      loading: true,
      loadedPositions: [],

      liquiditySeries: [{ name: 'lol', data: [], type: 'area' }],

      chartOptions: {
        stroke: {
          curve: 'straight',
          // colors: ['transparent'],
          // width: 2,
        },
        chart: {
          //type: 'bar',
          // stacked: true,
          background: 'transparent',
          toolbar: {
            show: false,
          },
          // zoom: {
          //   enabled: true
          // }
        },
        // TODO
        // responsive: [
        //   {
        //     breakpoint: 480,
        //     options: {
        //       legend: {
        //         position: 'bottom',
        //         offsetX: -10,
        //         offsetY: 0
        //       }
        //     }
        //   }
        // ],
        plotOptions: {
          bar: {
            //columnWidth: 400 + '%',
            // dataLabels: {
            //   maxItems: 0,
            //   total: {
            //     enabled: false,
            //     formatter: (_) => '',
            //     style: {
            //       color: 'red'
            //     }
            //   }
            // }
          },
        },
        theme: {
          mode: 'dark',
          palette: 'palette2',
        },
        dataLabels: {
          enabled: false,
        },
        grid: {
          xaxis: {
            lines: {
              show: false,
            },
          },

          yaxis: {
            lines: {
              show: false,
            },
          },
        },
        xaxis: {
          //type: 'numeric',
          //decimalsInFloat: 5,
          // axisBorder: {
          //   show: true,
          //   color: 'var(--border-color)',
          //   height: 1,
          //   width: '100%',
          // },
          //axisTicks: {
          //  show: false,
          //  borderType: 'solid',
          //  color: 'var(--border-color)',
          //  height: 4
          //},
          ////type: 'datetime',
          //labels: {
          //  show: true,
          //  style: {
          //    colors: 'var(--text-disable)',
          //    fontSize: '12px',
          //    fontWeight: 400
          //  }
          //},
        },
        legend: {
          show: false,
        },
        //colors: ['#0A84FF'],
        fill: {
          opacity: 1,
          pattern: {
            style: 'verticalLines',
            width: 1,
            height: 1,
            strokeWidth: 10,
          },
        },
      }, // options chart
    }
  },

  computed: {
    id() {
      return this.$route.params.id
    },

    pool() {
      const _pool = this.$store.state.amm.pools.find((p) => p.id == this.id)
      if (!_pool) return

      return constructPoolInstance(_pool)
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
