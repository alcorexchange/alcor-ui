<template lang="pug">
.unclaimed-fees
  .d-flex.justify-content-between.mt-2
    .fs-18.disable {{ $t('Unclaimed Fees') }}
    AlcorButton.claim-fees-button.f-14(access) {{ $t('Claim Fees') }}

  .d-flex.justify-content-between.mt-1
    .d-flex.align-items-center.gap-8
      span {{ position.amountA.currency.symbol }} Fees Earned
    .d-flex.align-items-center.gap-8
      .fs-18 {{ feesA }}
      .fs-14.color-action ($29)

  .d-flex.justify-content-between.mt-1
    .d-flex.align-items-center.gap-8
      span {{ position.amountB.currency.symbol }} Fees Earned
    .d-flex.align-items-center.gap-8
      .fs-18 {{ feesB }}
      .fs-14.color-action ($60.56)

</template>

<script>
import RangeIndicator from '~/components/amm/RangeIndicator'
import AlcorButton from '~/components/AlcorButton.vue'
export default {
  components: {
    RangeIndicator,
    AlcorButton
  },
  props: ['position', 'feesA', 'feesB']
}
</script>

<style lang="scss">
.claim-fees-button{
  padding: 2px 8px;
  font-weight: 500;
  border: none !important;
  color: var(--text-theme) !important;
  &:hover{
    background: var(--main-green) !important;
  }
}
</style>

