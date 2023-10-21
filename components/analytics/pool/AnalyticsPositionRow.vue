<template lang="pug">
.analytics-position-row.cursor-pointer(@click="$emit('showPosition', position)")
  .address.fs-14
    span(@click.stop="monitorOwner") {{ position.owner }}
  .range.desktopOnly
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
      .d-flex.align-items-center.gap-4
        token-image(:src='$tokenLogo(position.pool.tokenA.symbol, position.pool.tokenA.contract)' height="12")

        .fs-12.d-flex.gap-4
          span {{ position.amountA }}
      .d-flex.align-items-center.gap-4
        token-image(:src='$tokenLogo(position.pool.tokenB.symbol, position.pool.tokenB.contract)' height="12")

        .fs-12.d-flex.gap-4(:class="{ red: false }")
          span {{ position.amountB }}
  .unclaimed-fees.desktopOnly
    .d-flex.flex-column
      .d-flex.align-items-center.gap-4
        token-image(:src='$tokenLogo(position.pool.tokenA.symbol, position.pool.tokenA.contract)' height="12")

        .fs-12.earn.d-flex.gap-4
          span {{ position.feesA }}
      .d-flex.align-items-center.gap-4
        token-image(:src='$tokenLogo(position.pool.tokenB.symbol, position.pool.tokenB.contract)' height="12")

        .fs-12.earn.d-flex.gap-4
          span {{ position.feesB }}

  .total-value.fs-14.desktopOnly
    span $ {{ position.totalValue && position.totalValue.toFixed(2) }}
  .p-n-L.fs-14.desktopOnly
    span(:style="{color: $percentColor(position.pNl)}") $ {{ position.pNl && position.pNl.toFixed(2) }}
  .actions.desktopOnly
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
  methods: {
    monitorOwner() {
      this.openInNewTab(this.monitorAccount(this.position.owner))
    },
  },
}
</script>

<style scoped lang="scss">
.analytics-position-row {
  height: 56%;
  cursor: pointer;
  & > * {
    padding: 10px;
  }
}

.mobile-only {
  display: none;
}

.address {
  color: var(--main-green);
  text-decoration: underline;
}
</style>
