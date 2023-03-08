<template lang="pug">
alcor-container.manage-liquidity-component
  PageHeader(title="Manage Liquidity")
  .main.gap-16.pt-3
    .left
      .d-flex.justify-content-between
        .d-flex.gap-8.align-items-center
          PairIcons.pair-icons(v-if="!isMobile" token1="row.input" token2="row.output")
          .pairs WAX / BLK 
          .tag 0.3%
          RangeIndicator(:inRange="true")

        AlcorButton.increase-button {{ $t('Increase liquidity') }}

      .fs-18.disable.mt-3 {{ $t('Pool Amount') }}

      .d-flex.justify-content-between.mt-2
        .d-flex.align-items-center.gap-8
          TokenImage.token-image(src="token-conract" height="25")
          span.f-18 WAX
          .amount-percent.fs-10 50%
        .d-flex.align-items-center.gap-8
          .fs-18 886
          .fs-14.color-action ($60.56)

      .d-flex.justify-content-between.mt-2
        .d-flex.align-items-center.gap-8
          TokenImage.token-image(src="token-conract" height="25")
          span.f-18 BLK
          .amount-percent.fs-10 50%
        .d-flex.align-items-center.gap-8
          .fs-18 29,256
          .fs-14.color-action ($60.56)
      .d-flex.justify-content-between.mt-2
        .fs-16 P&L
        .fs-16 $2,300.5895
      .d-flex.justify-content-between.mt-2
        .fs-16 Total Profit 
        .fs-16 $2,300.5895
      .d-flex.justify-content-between.mt-2
        .fs-16 Total Loss
        .fs-16 $2,300.5895
      .d-flex.justify-content-between.mt-2
        .fs-16 Net Profit/Loss
        .fs-16 $2,300.5895

      .separator.mt-3

      .d-flex.justify-content-between.mt-3
        .fs-18.disable {{ $t('Unclaimed Fees') }}
        AlcorButton.claim-fees-button.f-14(access) {{ $t('Claim Fees') }}

      .d-flex.justify-content-between.mt-2
        .d-flex.align-items-center.gap-8
          span WAX Fees Earned
        .d-flex.align-items-center.gap-8
          .fs-18 40.9987
          .fs-14.color-action ($29)

      .d-flex.justify-content-between.mt-2
        .d-flex.align-items-center.gap-8
          span USDC Fees Earned
        .d-flex.align-items-center.gap-8
          .fs-18 2,300.5895
          .fs-14.color-action ($60.56)

      .separator.mt-3

      alcor-container(:alternative="true").mt-3
        .percentage.fs-24 100%
        el-slider(
          :step='1',
          :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
          :show-tooltip="false"
        ).slider-buy.w-100.mb-2

        .d-flex.justify-content-between.mt-4
          .d-flex.align-items-center.gap-8
            token-image.token-image(src="token-conract" height="25")
            span WAX
          .d-flex.align-items-center.gap-8
            .fs-18 886
            .fs-14.color-action ($60.56)

        .d-flex.justify-content-between.mt-2
          .d-flex.align-items-center.gap-8
            token-image.token-image(src="token-conract" height="25")
            span WAX
          .d-flex.align-items-center.gap-8
            .fs-18 886
            .fs-14.color-action ($60.56)

      AlcorButton.claim-fees-button.submit.w-100.mt-3(access) {{ $t('Remove Liquidity and Claim Fees') }}

    .right
      .d-flex.justify-content-between
        .fs-18.disable Price Range

      .d-flex.justify-content-center.gap-4
        .fs-18.disable Current Price:
        .fs-18 16.4785 BLK per WAX

      .w-100.mt-3 *Range Chart*

      .d-flex.gap-8
        InputStepCounter(:readOnly="true" :value="0.123")
          template(#top)
            .fs-12.text-center Min Price
          .fs-12.text-center wax per eos
          .fs-12.text-center.disable Your position will be 100%  composed of WAX at this price
        InputStepCounter(:readOnly="true" :value="0.123")
          template(#top)
            .fs-12.text-center Min Price
          .fs-12.text-center wax per eos
          .fs-12.text-center.disable Your position will be 100%  composed of WAX at this price

      InfoContainer.info.mt-3(:access="true")
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
import PageHeader from '~/components/amm/PageHeader'
import InputStepCounter from '~/components/amm/InputStepCounter'
import InfoContainer from '~/components/UI/InfoContainer'

export default {
  components: {
    AlcorContainer,
    AlcorButton,
    ReturnLink,
    PairIcons,
    TokenImage,
    RangeIndicator,
    InfoContainer,
    PageHeader,
    InputStepCounter,
  }
}
</script>

<style lang="scss">
.manage-liquidity-component {
  padding: 12px !important;
  width: 100%;
  max-width: 920px;
  margin: 50px auto;
  .main{
    display: flex;
    .left, .right{
      flex: 1;
    }
  }

  .pair-icons{
    .icon{
      width: 20px;
      height: 20px;
    }
    .icon-1{
      position: relative;
      bottom: 0; right: 0;
    }
    .icon-2{
      width: 16px; height: 16px;
      top: 40%;
      left: 40%
    }
  }
  .pairs{
    font-size: 1.2rem;
    font-weight: bold;
  }
  .tag{
    font-size: 0.8rem;
    background: var(--btn-default);
    padding: 2px 4px;
    border-radius: 4px;
  }
  .increase-button{
    color: var(--border-active-color);
    font-weight: 500;
    padding: 4px 8px;
  }
  .token-image{
    width: 16px; height: 16px;
  }
  .amount-percent {
    border: 1px solid var(--border-color);
    padding: 2px 6px;
    border-radius: 4px;
    line-height: 1;
  }
  .separator{
    width: 100%;
    border-bottom: 1px solid var(--border-color);
  }
  .claim-fees-button{
    padding: 4px 8px;
    font-weight: 500;
    border: none !important;
    color: var(--text-theme) !important;
    &:hover{
      background: var(--main-green) !important;
    }
    &.submit{
      padding: 14px;
      border-radius: 6px;
    }
  }
  .percentage{
    font-weight: bold;
  }
  .slider-buy{
    padding: 0 18px;
  }
  .info{
    color: var(--border-active-color);
    background-color: var(--background-color-third);
  }
}
 
</style>
