<template lang="pug">
el-table.position-table.custom-responsive-table(
  :data='positions',
  style='width: 100%',
  @row-click="$emit('positionClick', $event)"
)
  template(#empty)
    .d-flex.flex-column.align-items-center.gap-30.py-5
      i.el-icon-moon-night.fs-40
      .fs-14.lh-14 {{ $t('Your active liquidity positions will appear here.') }}
  el-table-column(:label='$t("Assets in Position")' width="240" className="assets")
    template(slot-scope='{row}')
      .assets-inner.d-flex.align-items-center.gap-12.px-3.py-2
        pair-icons(:token1="row.pool.tokenA" :token2="row.pool.tokenB" size="20")
        .fs-14 {{ row.pool.tokenA.symbol }} / {{ row.pool.tokenB.symbol }}
        .tag {{ row.pool.fee / 10000 }}%

  el-table-column(:label='$t("Range")' width="220" class-name="min-max")
    template(slot-scope='{row}')
      .d-flex.flex-column
        .d-flex.align-items-center.gap-4
          .indicator(:class="{ 'in-range': row.inRange }")
          .fs-10 {{ row.inRange ? 'In Range': 'Out of Range' }}
        .d-flex.align-items-center.gap-6.flex-wrap
          .d-flex.gap-4
            .fs-12.disable MIN
            .fs-12.contrast {{ row.priceLower }}
          i.el-icon-sort.rot
          .d-flex.gap-4
            .fs-12.disable MAX
            .fs-12.contrast {{ row.priceUpper }}

  el-table-column(:label='$t("Assets in Pool")' width="180")
    template(slot-scope='{row}')
      .d-flex.flex-column
        .mobile-label {{ $t("Assets in Pool") }}
        .d-flex.align-items-center.gap-4
          token-image(:src='$tokenLogo(row.pool.tokenA.symbol, row.pool.tokenA.contract)' height="12")

          .fs-12.earn.d-flex.gap-4
            span {{ row.amountA }}
        .d-flex.align-items-center.gap-4
          token-image(:src='$tokenLogo(row.pool.tokenB.symbol, row.pool.tokenB.contract)' height="12")

          .fs-12.earn.d-flex.gap-4(:class="{ red: false }")
            span {{ row.amountB }}

  el-table-column(:label='$t("Unclaimed Fees")' width="168" class-name="unclaimed-fees")
    template(slot-scope='{row}')
      .mobile-label.unclaimed-fees-label {{ $t("Unclaimed Fees") }}

      .d-flex.flex-column
        .d-flex.align-items-center.gap-4
          token-image(:src='$tokenLogo(row.pool.tokenA.symbol, row.pool.tokenA.contract)' height="12")

          .fs-12.earn.d-flex.gap-4
            span {{ row.feesA }}
        .d-flex.align-items-center.gap-4
          token-image(:src='$tokenLogo(row.pool.tokenB.symbol, row.pool.tokenB.contract)' height="12")

          .fs-12.earn.d-flex.gap-4
            span {{ row.feesB }}

  el-table-column(:label='$t("Total Value")' width="100" v-if="!isMobile")
    template(slot-scope='{row}')
      span $ {{ row.totalValue && row.totalValue.toFixed(2) }}

  el-table-column(:label='$t("P&L")' width="100" v-if="!isMobile")
    template(slot-scope='{row}')
      span(:style="{color: $percentColor(row.pNl)}") $ {{ row.pNl && row.pNl.toFixed(2) }}

  el-table-column(:label='$t("Action")' v-if="!isMobile" align="right")
    template(slot-scope='{row}')
      alcor-button(compact) {{ $t('Manage') }}

</template>

<script>
import { tickToPrice } from '@alcorexchange/alcor-swap-sdk'
import { isTicksAtLimit, constructPoolInstance } from '~/utils/amm'

import PairIcons from '~/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import PositionFees from '~/components/amm/PositionFees'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { PairIcons, TokenImage, PositionFees, AlcorButton },

  computed: {
    positions() {
      return this.$store.state.amm.positions.map(p => {
        const _pool = this.$store.state.amm.pools.find(pool => pool.id == p.pool)

        if (!_pool) return {}
        const pool = constructPoolInstance(_pool)

        if (!pool) return {}

        const priceUpper = isTicksAtLimit(pool.fee, p.tickLower, p.tickUpper).UPPER ? '∞' : tickToPrice(pool.tokenA, pool.tokenB, p.tickUpper).toSignificant(5)
        const priceLower = isTicksAtLimit(pool.fee, p.tickLower, p.tickUpper).LOWER ? '0' : tickToPrice(pool.tokenA, pool.tokenB, p.tickLower).toSignificant(5)

        const link = `/positions/${pool.id}-${p.id}-${pool.fee}`

        return {
          ...p,
          pool,
          priceUpper,
          priceLower,
          link
        }
      }).filter(p => p.pool)
    }
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
</style>

<style lang="scss">
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
@media only screen and (max-width: 1100px) {
  .custom-responsive-table{
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
      .position-fees{
        align-items: flex-end
      }
    }
  }
}
</style>
