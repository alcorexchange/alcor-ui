<template lang="pug">
#manage-liquidity-id-page.d-flex.flex-column.gap-24
  .d-flex.justify-content-between.align-items-center
    .d-flex.flex-column.gap-16
      return-link
      .d-flex.gap-32.align-items-center
        .d-flex.flex.gap-4.align-items-center
          pair-icons(
            :token1="pool.input"
            :token2="pool.output"
          )
          .fs-24.contrast {{ pool.input.symbol }} / {{ pool.output.symbol }}
        .d-flex.gap-16
          .tag {{ pool.percent }}% Fee
          .tag {{ fee.selectedPercent }}% Selected
    .d-flex.gap-16.h-48
      alcor-button
        i.el-icon-circle-plus-outline
        span Increase Liquidity
      alcor-button(danger)
        i.el-icon-remove-outline
        span Remove Liquidity
  .d-flex.gap-32.justify-content-between.w-100
    span graphic
    .d-flex.flex-column.gap-16
      alcor-container.d-flex.flex-column.gap-20.w-550
        .fs-14.disable Selected Pair
        .d-flex.justify-content-between.align-items-center
          .d-flex.gap-8.align-items-center
            token-image(:src="$tokenLogo(pool.input.symbol, pool.input.contract)" height="25")
            .fs-24.contrast {{ pool.input.symbol }}
          .d-flex.gap-8.align-items-center
            .fs-24.disable {{ pool.inputAmount }}
            .tag 59.8%
        .d-flex.justify-content-between.align-items-center
          .d-flex.gap-8.align-items-center
            token-image(:src="$tokenLogo(pool.output.symbol, pool.output.contract)" height="25")
            .fs-24.contrast {{ pool.output.symbol }}
          .d-flex.gap-8.align-items-center
            .fs-24.disable {{ pool.outputAmount }}
            .tag 40.2%

      alcor-container.d-flex.flex-column.gap-16.w-550
        .d-flex.justify-content-between.align-items-center
          .d-flex.flex-column.gap-8
            .fs-14.disable Unclaimed Fees
            .fs-40 ${{ $systemToUSD(pool.inputEarning + pool.outputEarning) }}
          alcor-button.h-48(access big)
            i.el-icon-money
            span Collect Fees
        .d-flex.justify-content-between.align-items-center
          .d-flex.gap-8.align-items-center
            token-image(:src="$tokenLogo(pool.input.symbol, pool.input.contract)" height="25")
            .fs-24.contrast {{ pool.input.symbol }}
          .d-flex.gap-8.align-items-center
            .fs-24.disable {{ pool.inputEarning }}
            .fs-14.red(:class="{ green: pool.inputEarning > 0 }") (${{ $systemToUSD(pool.inputEarning) }})

        .d-flex.justify-content-between.align-items-center
          .d-flex.gap-8.align-items-center
            token-image(:src="$tokenLogo(pool.output.symbol, pool.output.contract)" height="25")
            .fs-24.contrast {{ pool.output.symbol }}
          .d-flex.gap-8.align-items-center
            .fs-24.disable {{ pool.outputEarning }}
            .fs-14.red(:class="{ green: pool.outputEarning > 0 }") (${{ $systemToUSD(pool.outputEarning) }})
  alcor-container.d-flex.flex-column.gap-16.w-100
    .d-flex.justify-content-between
      .d-flex.gap-32.align-items-center
        .fs-14.disable Price Range
        .d-flex.gap-8.align-items-center
          .indicator(:class="{ 'in-range': pool.inRange }")
          .fs-18 {{ pool.inRange ? 'In Range': 'Out of Range' }}
    .d-flex.gap-20.justify-content-between.align-items-center
      .grey-border.d-flex.flex-column.gap-20.p-2.br-4.w-50
        .fs-12.text-center Min Price
        .fs-24.text-center.contrast {{ pool.min }}
        .fs-12.text-center {{ pool.input.symbol }} per {{ pool.output.symbol }}

      i.el-icon-sort.r-90

      .grey-border.d-flex.flex-column.gap-20.p-2.br-4.w-50
        .fs-12.text-center Max Price
        .fs-24.text-center.contrast {{ pool.max }}
        .fs-12.text-center {{ pool.input.symbol }} per {{ pool.output.symbol }}

    .grey-border.d-flex.flex-column.gap-20.p-2.br-4.w-100
      .fs-12.text-center Current Price
      .fs-24.text-center 15.8956
      .fs-12.text-center {{ pool.input.symbol }} per {{ pool.output.symbol }}
</template>

<script>
import { pools, fees } from '../swap2/pools'
import ReturnLink from '~/components/ReturnLink'
import PairIcons from '~/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'
import AlcorContainer from '~/components/AlcorContainer'

export default {
  components: {
    ReturnLink,
    PairIcons,
    TokenImage,
    AlcorButton,
    AlcorContainer
  },
  data: () => ({ pools, fees }),
  computed: {
    pool() {
      return this.pools.find(({ id }) => id == this.$route.params.id)
    },
    fee() {
      return this.fees.find(({ value }) => value == this.pool.percent)
    }
  }
}
</script>

<style lang="scss">
#manage-liquidity-id-page {
  .h-48 {
    height: 48px;
  }
  .w-550 {
    width: 550px;
  }
  .r-90 {
    transform: rotate(90deg);
  }
  .indicator {
    width: 14px;
    height: 14px;

    background: var(--disabled-indicator);
    border-radius: 2px;

    &.in-range {
      background: var(--access-indicator);
    }
  }
  .tag {
    border: var(--border-1);
    background: var(--bg-alter-2);
    font-size: 10px;
    line-height: 12px;
    padding: 4px;
    border-radius: 4px;
    height: fit-content;
  }
}
</style>
