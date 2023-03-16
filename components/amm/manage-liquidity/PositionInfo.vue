<template lang="pug">
.pool-info
  .d-flex.justify-content-between
    .d-flex.gap-8.align-items-center
      PairIcons.pair-icons(v-if="!isMobile" :token1="position.pool.tokenA" :token2="position.pool.tokenB")
      .pairs(v-if="tokensInverted") {{ position.pool.tokenB.symbol }} / {{ position.pool.tokenA.symbol }}
      .pairs(v-else) {{ position.pool.tokenA.symbol }} / {{ position.pool.tokenB.symbol }}
      .tag {{ position.pool.fee / 10000 }}%
      RangeIndicator(:inRange="position.inRange")

    slot(name="action")

  .fs-18.disable.mt-2 {{ $t('Pool Amount') }}

  .d-flex.justify-content-between.mt-1
    .d-flex.align-items-center.gap-8
      TokenImage.token-image(:src="$tokenLogo(position.pool.tokenA.symbol, position.pool.tokenA.contract)" height="25")
      span.f-18 {{ position.amountA.currency.symbol }}
      .amount-percent.fs-10 50%
    .d-flex.align-items-center.gap-8
      .fs-18 {{ position.amountA.toFixed() }}
      .fs-14.color-action ($60.56)

  .d-flex.justify-content-between.mt-1
    .d-flex.align-items-center.gap-8
      TokenImage.token-image(:src="$tokenLogo(position.pool.tokenB.symbol, position.pool.tokenB.contract)" height="25")
      span.f-18 {{ position.amountB.currency.symbol }}
      .amount-percent.fs-10 50%
    .d-flex.align-items-center.gap-8
      .fs-18 {{ position.amountB.toFixed() }}
      .fs-14.color-action ($60.56)

  template(v-if="!noPL")
    .d-flex.justify-content-between.mt-1
      .fs-16 P&L
      .fs-16 $0.00
    .d-flex.justify-content-between.mt-1
      .fs-16 IL (Impermanent loss)
      .fs-16 $0.00
    .d-flex.justify-content-between.mt-1
      .fs-16 24H Estimated Fees
      .fs-16 $5.0000

    // TODO We do not need probably
    //.d-flex.justify-content-between.mt-1
      .fs-16 Net Profit/Loss
      .fs-16 $2,300.5895

</template>

<script>
import RangeIndicator from '~/components/amm/RangeIndicator'
import TokenImage from '~/components/elements/TokenImage'
import PairIcons from '~/components/PairIcons'
export default {
  components: {
    RangeIndicator,
    TokenImage,
    PairIcons
  },
  props: ['noPL', 'position', 'tokensInverted']
}
</script>

<style lang="scss">
.pool-info{
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
  .amount-percent {
    border: 1px solid var(--border-color);
    padding: 2px 6px;
    border-radius: 4px;
    line-height: 1;
  }
}
</style>

