<template lang="pug">
el-table.market-table(
  :data='positions',
  style='width: 100%',
)
  el-table-column(:label='$t("Assets in Position")' width="180")
    template(slot-scope='{row}')
      .d-flex.align-items-center.gap-10.p-2
        pair-icons(:token1="row.pool.tokenA" :token2="row.pool.tokenB" size="20")
        .fs-14 {{ row.pool.tokenA.symbol }} / {{ row.pool.tokenB.symbol }}
        .tag {{ row.pool.fee / 10000 }}%

  el-table-column(:label='$t("Range")' width="220")
    template(slot-scope='{row}')
      .d-flex.flex-column
        .d-flex.align-items-center.gap-4
          .indicator(:class="{ 'in-range': !outOfRange(row) }")
          .fs-10 {{ !outOfRange(row) ? 'In Range': 'Out of Range' }}
        .d-flex.align-items-center.gap-6.flex-wrap
          .d-flex.gap-4
            .fs-12.disable MIN
            .fs-12.contrast {{ priceLower(row) }}
          i.el-icon-sort.rot
          .d-flex.gap-4
            .fs-12.disable MAX
            .fs-12.contrast {{ priceUpper(row) }}

  el-table-column(:label='$t("Assets in Pool")')
    template(slot-scope='{row}')
      .d-flex.flex-column.gap-4
        .d-flex.align-items-center.gap-4
          token-image(:src='$tokenLogo(row.pool.tokenA.symbol, row.pool.tokenB.contract)' height="12")

          .fs-12.earn.d-flex.gap-4(:class="{ red: true }")
            span 0.00
            span {{ row.pool.tokenA.symbol }}
        .d-flex.align-items-center.gap-4
          token-image(:src='$tokenLogo(row.pool.tokenB.symbol, row.pool.tokenB.contract)' height="12")

          .fs-12.earn.d-flex.gap-4(:class="{ red: false }")
            span 0.00
            span {{ row.pool.tokenB.symbol }}

  el-table-column(:label='$t("Unclaimed Fees")')
    template(slot-scope='{row}')
      position-fees(:position="row")

  el-table-column(:label='$t("Total Value")')
    template(slot-scope='{row}')
      span $1200

  el-table-column(:label='$t("P&L")')
    template(slot-scope='{row}')
      span.red $-1200

  el-table-column(:label='$t("Action")')
    template(slot-scope='{row}')
      alcor-button Manage

</template>

<script>
import { mapGetters } from 'vuex'
import PairIcons from '~/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import PositionFees from '~/components/amm/PositionFees'
import AlcorButton from '~/components/AlcorButton'
import { isTicksAtLimit } from '~/utils/amm'

function getPositionPrice(position) {
  if (!position) {
    return {}
  }

  const { tokenA, tokenB } = position.pool

  // TODO
  // if tokenA is a dollar-stable asset, set it as the quote token
  //const stables = [DAI, USDC_MAINNET, USDT]
  //if (stables.some((stable) => stable.equals(tokenA))) {
  //  return {
  //    priceLower: position.tokenAPriceUpper.invert(),
  //    priceUpper: position.tokenAPriceLower.invert(),
  //    quote: tokenA,
  //    base: tokenB,
  //  }
  //}

  // TODO
  // if tokenB is an WAX-/EOS-stable asset, set it as the base token
  //const bases = [...Object.values(WRAPPED_NATIVE_CURRENCY), EOS]
  //if (bases.some((base) => base && base.equals(tokenB))) {
  //  return {
  //    priceLower: position.tokenAPriceUpper.invert(),
  //    priceUpper: position.tokenAPriceLower.invert(),
  //    quote: tokenA,
  //    base: tokenB,
  //  }
  //}

  // if both prices are below 1, invert
  if (position.tokenAPriceUpper.lessThan(1)) {
    return {
      priceLower: position.tokenAPriceUpper.invert(),
      priceUpper: position.tokenAPriceLower.invert(),
      quote: tokenA,
      base: tokenB
    }
  }

  // otherwise, just return the default
  return {
    priceLower: position.tokenAPriceLower,
    priceUpper: position.tokenAPriceUpper,
    quote: tokenB,
    base: tokenA
  }
}

export default {
  components: { PairIcons, TokenImage, PositionFees, AlcorButton },
  data: () => ({ mappedPositions: null }),

  methods: {
    outOfRange({ pool, tickLower, tickUpper }) {
      return pool ? pool.tickCurrent < tickLower || pool.tickCurrent >= tickUpper : false
    },
    priceLower(position) {
      const { tickLower, tickUpper, pool: { fee: feeAmount } } = position
      const isOnLimit = isTicksAtLimit(feeAmount, tickLower, tickUpper)

      if (isOnLimit.LOWER) {
        return '0'
      }

      return getPositionPrice(position).priceLower.toFixed()
    },

    priceUpper(position) {
      const { tickLower, tickUpper, pool: { fee: feeAmount } } = position
      const isOnLimit = isTicksAtLimit(feeAmount, tickLower, tickUpper)

      if (isOnLimit.UPPER) {
        return '∞'
      }

      return getPositionPrice(position).priceUpper.toFixed()
    }
  },
  computed: {
    ...mapGetters('amm', ['positions']),
  }
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
  width: 4px;
  height: 4px;

  background: var(--disabled-indicator);
  border-radius: 50%;

  &.in-range {
    background: var(--access-indicator);
  }
}

</style>
