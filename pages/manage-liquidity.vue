<template lang="pug">
alcor-container.manage-liquidity-component
  .d-flex.justify-content-between.align-items-center
    return-link.fs-20
    span.align-self-center {{ $t('Manage Liquidity') }}
    span

  .hr.mt-3
    
  .d-flex.justify-content-between.mt-3.gap-16
    .w-50
      .d-flex.justify-content-between
        .d-flex.gap-8.align-items-center
          pair-icons(v-if="!isMobile" token1="row.input" token2="row.output")
          .fs-20.contrast WAX / BLK 
          el-tag 0.3%
          range-indicator(:inRange="true")

        alcor-button.submit(compact) {{ $t('Increase liquidity') }}

      .fs-18.disable.mt-3 {{ $t('Pool Amount') }}

      .d-flex.justify-content-between.mt-3
        .d-flex.align-items-center.gap-8
          token-image(src="token-conract" height="25")
          span WAX
          .amount-percent.fs-10 50%
        .d-flex.align-items-center.gap-8
          .fs-18 886
          .fs-14.color-action ($60.56)

      .d-flex.justify-content-between.mt-3
        .d-flex.align-items-center.gap-8
          token-image(src="token-conract" height="25")
          span BLK
          .amount-percent.fs-10 50%
        .d-flex.align-items-center.gap-8
          .fs-18 29,256
          .fs-14.color-action ($60.56)

      .d-flex.justify-content-between.mt-3
        .fs-16 P&L
        .fs-16 $2,300.5895

      .d-flex.justify-content-between.mt-3
        .fs-16 Total Profit 
        .fs-16 $2,300.5895

      .d-flex.justify-content-between.mt-3
        .fs-16 Total Loss
        .fs-16 $2,300.5895

      .d-flex.justify-content-between.mt-3
        .fs-16 Net Profit/Loss
        .fs-16 $2,300.5895

      .hr.mt-3

      .d-flex.justify-content-between.mt-3
        .fs-18.disable {{ $t('Unclaimed Fees') }}
        alcor-button(access compact) {{ $t('Claim Fees') }}

      .d-flex.justify-content-between.mt-3
        .d-flex.align-items-center.gap-8
          span WAX Fees Earned
        .d-flex.align-items-center.gap-8
          .fs-18 40.9987
          .fs-14.color-action ($29)

      .d-flex.justify-content-between.mt-3
        .d-flex.align-items-center.gap-8
          span USDC Fees Earned
        .d-flex.align-items-center.gap-8
          .fs-18 2,300.5895
          .fs-14.color-action ($60.56)

      .hr.mt-3

      alcor-container(:alternative="true").mt-3
        .fs-24 100%
        el-slider(
          :step='1',
          :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
          :show-tooltip="false"
        ).slider-buy.w-100.px-2

        .d-flex.justify-content-between.mt-4
          .d-flex.align-items-center.gap-8
            token-image(src="token-conract" height="25")
            span WAX
          .d-flex.align-items-center.gap-8
            .fs-18 886
            .fs-14.color-action ($60.56)

        .d-flex.justify-content-between.mt-3
          .d-flex.align-items-center.gap-8
            token-image(src="token-conract" height="25")
            span WAX
          .d-flex.align-items-center.gap-8
            .fs-18 886
            .fs-14.color-action ($60.56)

      alcor-button.w-100.mt-3(access) {{ $t('Claim Fees') }}

    .w-50

      .d-flex.justify-content-between
        .fs-18.disable Price Range

      .d-flex.justify-content-center.gap-4
        .fs-18.disable Current Price:
        .fs-18 16.4785 BLK per WAX

      .w-100.mt-3 *Range Chart*

      .d-flex.gap-8
        alcor-container(:alternative="true").d-flex.flex-column.gap-4
          .fs-12.text-center Min Price
          .fs-24.text-center.contrast 0.123
          .fs-12.text-center wax per eos
          .fs-12.text-center.disable Your position will be 100%  composed of WAX at this price

        alcor-container(:alternative="true").d-flex.flex-column.gap-4
          .fs-12.text-center Min Price
          .fs-24.text-center.contrast 0.123
          .fs-12.text-center wax per eos
          .fs-12.text-center.disable Your position will be 100%  composed of WAX at this price

      info-container.mt-3(:access="true")
          | To update the price range, you need to close this position and open a new one,
          | you can read about automating the price range here Learn about liquidity price range


</template>

<script>
import AlcorContainer from '~/components/AlcorContainer'
import AlcorButton from '~/components/AlcorButton.vue'
import ReturnLink from '~/components/ReturnLink'
import PairIcons from '~/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import RangeIndicator from '~/components/amm/RangeIndicator'
import InfoContainer from '~/components/UI/InfoContainer'

export default {
  components: {
    AlcorContainer,
    AlcorButton,
    ReturnLink,
    PairIcons,
    TokenImage,
    RangeIndicator,
    InfoContainer
  }
}
</script>

<style lang="scss">
.manage-liquidity-component {
  width: 920px;
  margin: 50px auto;

  .amount-percent {
    border: 1px solid var(--border-color);
    padding: 4px;
    border-radius: 4px;
  }
}
 
</style>
