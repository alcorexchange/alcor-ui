<template lang="pug">
VirtualTable(:table="virtualTableData").virtual-positions-list
  template(#empty)
    .d-flex.flex-column.align-items-center.gap-30.py-5.muted
      i.el-icon-moon-night.fs-40
      .fs-14.lh-14 {{ $t('Your active liquidity positions will appear here.') }}
  template(#total-header)
    span.total-value-header
      span {{ $t("Total") }}
      span.total-posiions-value  ( ${{ totalPositionsValue | commaFloat(2) }} )
  template(#row="{ item }")
    .virtual-position-row.pointer(@click="$emit('positionClick', item)")
      .assets
        .assets-inner.d-flex.align-items-center.gap-12.px-2.py-2
          PairIcons(:token1="item.pool.tokenA" :token2="item.pool.tokenB" :size="isMobile ? '16': '20'")
          .fs-14(:class="{ 'fs-12': isMobile }") {{ item.pool.tokenA.symbol }} / {{ item.pool.tokenB.symbol }}
          .tag {{ item.pool.fee / 10000 }}%
      .range.d-flex.flex-column(v-if="!isMobile")
        .d-flex.align-items-center.gap-4
          .indicator(:class="{ 'in-range': item.inRange }")
          .fs-10 {{ item.inRange ? 'In Range': 'Out of Range' }}
        .d-flex.align-items-center.gap-6.flex-wrap
          .d-flex.gap-4
            .fs-12.disable MIN
            .fs-12.contrast {{ item.priceLower }}
          i.el-icon-sort.rot
          .d-flex.gap-4
            .fs-12.disable MAX
            .fs-12.contrast {{ item.priceUpper }}
      .pool.d-flex.flex-column(v-if="!isMobile")
        .d-flex.align-items-center.gap-4
          token-image(:src='$tokenLogo(item.pool.tokenA.symbol, item.pool.tokenA.contract)' height="12")
          .fs-12.d-flex.gap-4
            span {{ item.amountA | commaFloat }}

        .d-flex.align-items-center.gap-4
          token-image(:src='$tokenLogo(item.pool.tokenB.symbol, item.pool.tokenB.contract)' height="12")

          .fs-12.d-flex.gap-4(:class="{ red: false }")
            span {{ item.amountB | commaFloat }}
      .total.fs-14
        span $ {{ item.totalValue | commaFloat(2) }}
      .unclaimed.fs-14(v-if="!isMobile")
        span(:style="{color: $percentColor(1)}") $ {{ item.totalFeesUSD | commaFloat(3) }}
      .action(v-if="!isMobile")
        AlcorButton(compact) {{ $t('Manage') }}
</template>

<script>
import { tickToPrice } from '@alcorexchange/alcor-swap-sdk'
import { isTicksAtLimit, constructPoolInstance } from '~/utils/amm'

import PairIcons from '~/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import PositionFees from '~/components/amm/PositionFees'
import AlcorButton from '~/components/AlcorButton'

import VirtualTable from '~/components/VirtualTable'

export default {
  components: { PairIcons, TokenImage, PositionFees, AlcorButton, VirtualTable },

  props: ['search'],

  computed: {
    virtualTableData() {
      const header = [
        {
          label: this.$t('Assets in Position'),
          width: '240px',
          mobileWidth: '100%',
        },
        {
          label: this.$t('Range'),
          width: '250px',
          desktopOnly: true,
        },
        {
          label: this.$t('Assets in Pool'),
          width: '200px',
          desktopOnly: true,
        },
        {
          label: this.$t('Total Value'),
          width: '180px',
          sortable: true,
          value: 'totalValue',
          slot: 'total',
          mobileWidth: '180px',
        },
        {
          label: 'Unclaimed Fees',
          value: 'totalFeesUSD',
          sortable: true,
          width: '150px',
          desktopOnly: true,
        },
        {
          label: this.$t('Action'),
          desktopOnly: true,
        },
      ]

      return { pageMode: true, itemSize: 58, header, data: this.positions }
    },
    positions() {
      return this.$store.state.amm.positions
        .map((p) => {
          const _pool = this.$store.state.amm.pools.find((pool) => pool.id == p.pool)

          if (!_pool) return {}
          const pool = constructPoolInstance(_pool)

          if (!pool) return {}

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
        .filter((p) => {
          // prettier-ignore
          return `${p.feesA.split(' ')[1]}${p.feesB.split(' ')[1]}`.toLowerCase().includes(this.search?.toLowerCase() || '')
        })
        .toSorted((a, b) => b.totalValue - a.totalValue)
    },
    totalPositionsValue() {
      return this.positions.reduce((value, position) => value + position.totalValue, 0)
    },
  },
}
</script>

<style lang="scss" scoped>
.virtual-position-row {
  display: flex;
  padding: 10px;
  align-items: center;
  .assets {
    width: 240px;

    @media only screen and (max-width: 1176px) {
      width: 100%;
    }
  }
  .range {
    width: 250px;
  }
  .pool {
    width: 200px;
  }
  .total {
    width: 180px;
    @media only screen and (max-width: 1176px) {
      width: 180px;
    }
  }
  .unclaimed {
    width: 150px;
  }
}

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
.total-posiions-value {
  color: var(--text-default);
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
.virtual-positions-list {
  .header {
    padding: 15px 10px;
    text-align: left !important;
  }
  .header__column {
    font-weight: 400;
    font-size: 12px;
    justify-content: flex-start;
    color: var(--text-disable);
  }
}
.earn {
  color: var(--main-green);
  &.red {
    color: var(--main-red);
  }
}
</style>
