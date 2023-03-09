<template lang="pug">
alcor-container.manage-liquidity-component
  PageHeader(title="Manage Liquidity")
  .main.gap-16.pt-3
    .left
      PoolInfo
        template(#action)
          IncreaseLiquidity
      .separator.mt-3
      UnclaimedFees
      .separator.mt-3
      RemoveLiquidityPercentage
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
          .fs-12.text-center.disable Your position will be 100% composed of WAX at this price
        InputStepCounter(:readOnly="true" :value="0.123")
          template(#top)
            .fs-12.text-center Min Price
          .fs-12.text-center wax per eos
          .fs-12.text-center.disable Your position will be 100% composed of WAX at this price

      InfoContainer.info.mt-3(:access="true")
        | To update the price range, you need to close this position and open a new one,
        | you can read about automating the price range here Learn about liquidity price range

</template>

<script>
import AlcorContainer from '~/components/AlcorContainer'
import AlcorButton from '~/components/AlcorButton.vue'
import ReturnLink from '~/components/ReturnLink'
import PairIcons from '~/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import PageHeader from '~/components/amm/PageHeader'
import InputStepCounter from '~/components/amm/InputStepCounter'
import PoolInfo from '~/components/amm/manage-liquidity/PoolInfo'
import UnclaimedFees from '~/components/amm/manage-liquidity/UnclaimedFees'
import RemoveLiquidityPercentage from '~/components/amm/manage-liquidity/RemoveLiquidityPercentage'
import InfoContainer from '~/components/UI/InfoContainer'
import IncreaseLiquidity from '~/components/modals/amm/IncreaseLiquidity'

export default {
  components: {
    AlcorContainer,
    AlcorButton,
    ReturnLink,
    PairIcons,
    TokenImage,
    InfoContainer,
    PageHeader,
    InputStepCounter,
    PoolInfo,
    UnclaimedFees,
    RemoveLiquidityPercentage,
    IncreaseLiquidity
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

  .increase-button{
    color: var(--border-active-color);
    font-weight: 500;
    padding: 4px 8px;
  }
  .token-image{
    width: 16px; height: 16px;
  }
  .separator{
    width: 100%;
    border-bottom: 1px solid var(--border-color);
  }
  .info{
    background-color: var(--selector-bg) !important;
  }
}

</style>
