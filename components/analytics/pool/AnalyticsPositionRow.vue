<template lang="pug">
.analytics-position-row(@click="$emit('showPosition', position)")
  .address.fs-14 {{ position.owner }}
  .range
    .d-flex.flex-column
      .d-flex.align-items-center.gap-4
        .indicator(:class="{ 'in-range': position.inRange }")
        .fs-10 {{ position.inRange ? 'In Range': 'Out of Range' }}
      .d-flex.align-items-center.gap-6.flex-wrap
        .d-flex.gap-4
          .fs-12.disable MIN
          .fs-12.contrast {{ position.priceLower }}
        i.el-icon-sort.rot
        .d-flex.gap-4
          .fs-12.disable MAX
          .fs-12.contrast {{ position.priceUpper }}
  .assets
    .d-flex.flex-column
      .mobile-only {{ $t("Assets in Pool") }}
      .d-flex.align-items-center.gap-4
        token-image(:src='$tokenLogo(position.pool.tokenA.symbol, position.pool.tokenA.contract)' height="12")

        .fs-12.d-flex.gap-4
          span {{ position.amountA }}
      .d-flex.align-items-center.gap-4
        token-image(:src='$tokenLogo(position.pool.tokenB.symbol, position.pool.tokenB.contract)' height="12")

        .fs-12.d-flex.gap-4(:class="{ red: false }")
          span {{ position.amountB }}
  .unclaimed-fees
    .mobile-only.unclaimed-fees-label {{ $t("Unclaimed Fees") }}

    .d-flex.flex-column
      .d-flex.align-items-center.gap-4
        token-image(:src='$tokenLogo(position.pool.tokenA.symbol, position.pool.tokenA.contract)' height="12")

        .fs-12.earn.d-flex.gap-4
          span {{ position.feesA }}
      .d-flex.align-items-center.gap-4
        token-image(:src='$tokenLogo(position.pool.tokenB.symbol, position.pool.tokenB.contract)' height="12")

        .fs-12.earn.d-flex.gap-4
          span {{ position.feesB }}

  .total-value.fs-14
    span $ {{ position.totalValue && position.totalValue.toFixed(2) }}
  .p-n-L.fs-14
    span(:style="{color: $percentColor(position.pNl)}") $ {{ position.pNl && position.pNl.toFixed(2) }}
  .actions
    AlcorButton(compact) {{ $t('Manage') }}
</template>

<script>
import AlcorButton from '~/components/AlcorButton'
import TokenImage from '~/components/elements/TokenImage'
export default {
  name: 'AnalyticsPositionRow',
  components: {
    AlcorButton,
    TokenImage,
  },
  props: ['position'],
  computed: {},
}
</script>

<style scoped lang="scss">
.analytics-position-row {
  & > * {
    padding: 10px;
  }
}

.mobile-only {
  display: none;
}
// .address,
// .range,
// .assets,
// .unclaimed-fees,
// .total-value,
// .p-n-L,
// .actions {
//   padding: 10px;
// }
</style>
