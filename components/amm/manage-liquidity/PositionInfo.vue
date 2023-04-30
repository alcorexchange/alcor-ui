<template lang="pug">
.pool-info
  .pool-info-header
    .pool-info-header-main.d-flex.gap-8.align-items-center
      PairIcons.pair-icons(v-if="!isMobile" :token1="position.pool[tokensInverted ? 'tokenB' : 'tokenA']" :token2="position.pool[tokensInverted ? 'tokenA' : 'tokenB']")
      .pairs(v-if="tokensInverted") {{ position.pool.tokenB.symbol }} / {{ position.pool.tokenA.symbol }}
      .pairs(v-else) {{ position.pool.tokenA.symbol }} / {{ position.pool.tokenB.symbol }}
      .tag {{ poolFee }}%
      RangeIndicator.range-indicator(:inRange="position.inRange")
    .action-slot
      slot(name="action")

    .pool-amount-title.fs-18.disable.mt-2 {{ $t('Pool Amount') }}

  .pool-amount(:class="{'reversed': tokensInverted}")
    .d-flex.align-items-center.gap-6
      TokenImage.token-image(:src="$tokenLogo(position.pool.tokenA.symbol, position.pool.tokenA.contract)" height="25")
      span.f-18.symbol {{ position.amountA.currency.symbol }}
      span.contract {{ position.pool.tokenA.contract }}
    .amount-percent-container
      .amount-percent.fs-10 {{ composedPercent(tokensInverted ? 'e' : 'w') }}%
    .d-flex.align-items-center.gap-8
      .fs-18 {{ position.amountA.toFixed() }}
      .fs-14.color-action (${{ $tokenToUSD(position.amountA.toFixed(), position.pool.tokenA.symbol, position.pool.tokenA.contract) }})

    .d-flex.align-items-center.gap-6.token-b
      TokenImage.token-image(:src="$tokenLogo(position.pool.tokenB.symbol, position.pool.tokenB.contract)" height="25")
      span.f-18.symbol {{ position.amountB.currency.symbol }}
      span.contract {{ position.pool.tokenB.contract }}
    .amount-percent-container.token-b
      .amount-percent.fs-10 {{ composedPercent(tokensInverted ? 'w' : 'e') }}%
    .d-flex.align-items-center.gap-8.token-b
      .fs-18 {{ position.amountB.toFixed() }}
      .fs-14.color-action (${{$tokenToUSD(position.amountB.toFixed(), position.pool.tokenB.symbol, position.pool.tokenB.contract)}})

  template(v-if="!noPL")
    .d-flex.justify-content-between.mt-1
      .fs-16 P&L
      .fs-16 ${{ pNl }}
    .d-flex.justify-content-between.mt-1
      .fs-16 Pool Share
      .fs-16 {{ poolShare }}%
    .d-flex.justify-content-between.mt-1
      .fs-16 24H Estimated Fees
      .fs-16 ${{ estimatedFees }}
    //.d-flex.justify-content-between.mt-1
      .fs-16 Estimated APY
      .fs-16 ${{ APY }}

    // TODO We do not need probably
    //.d-flex.justify-content-between.mt-1
      .fs-16 Net Profit/Loss
      .fs-16 $2,300.5895

</template>

<script>
import { Fraction } from '~/assets/libs/swap-sdk'

import RangeIndicator from '~/components/amm/RangeIndicator'
import TokenImage from '~/components/elements/TokenImage'
import PairIcons from '~/components/PairIcons'
export default {
  components: {
    RangeIndicator,
    TokenImage,
    PairIcons
  },

  props: ['noPL', 'position', 'tokensInverted', 'composedPercent'],

  computed: {
    poolFee() {
      return this.position.pool.fee / 10000
    },

    poolShare() {
      return (parseFloat(new Fraction(this.position.liquidity, this.position.pool.liquidity).toFixed(6)) * 100).toFixed(2)
    },

    estimatedFees() {
      const { position } = this
      const { pool } = position

      const poolStats = this.$store.state.amm.poolsStats.find(p => p.id == position.pool.id)
      if (!poolStats) return '0.0000'

      const volume24 = poolStats.volumeUSD24 || 0
      const poolFee = pool.fee / 10000

      return (volume24 * (poolFee / 100) * (this.poolShare / 100)).toFixed(4)
    },

    pNl() {
      const { position } = this
      const positionStats = this.$store.state.amm.positionsStats.find(p => p.id == position.id)
      if (!positionStats || !positionStats.pNl) return '0.0000'

      return positionStats.pNl.toFixed(4)
    },

    APY() {
      return (parseFloat(this.estimatedFees) * 365).toFixed(4)
    }
  }
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
  .pool-info-header{
    display: grid;
    align-items: center;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-areas:
      "main main slot"
      "amount amount amount";
    &-main {
      grid-area: main;
    }
    .action-slot {
      display: flex;justify-content: flex-end;
      grid-area: slot;
    }
    .pool-amount-title {
      grid-area: amount;
    }
  }
  .pool-amount {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    column-gap: 6px;
    row-gap: 2px;
    &.reversed {
      .token-b {
        grid-row-start: 1;
      }
    }
  }
  .pairs{
    font-size: 1.2rem;
    font-weight: bold;
  }
  // .symbol-and-contract {
  //   display: flex;
  //   flex-direction: column;
  //   // gap: 4px;
  // }
  .contract {
    font-size: 0.8rem;
    color: var(--text-disable);
  }
  .tag{
    font-size: 0.8rem;
    background: var(--btn-default);
    padding: 2px 4px;
    border-radius: 4px;
  }
  .amount-percent-container {
    display: flex;
  }
  .amount-percent {
    border: 1px solid var(--border-color);
    padding: 2px 6px;
    border-radius: 4px;
    line-height: 1;
  }
  // .symbol{
  //   min-width: 40px;
  // }
}
@media only screen and (max-width: 640px) {
  .pool-info {
    .tag {
      font-size: 0.74rem;
    }
    .pool-info-header{
      grid-template-columns: 1fr 1fr;
      grid-template-areas:
        "main main"
        "amount slot";
      .action-slot {
        margin-top: 0.5rem;
      }
    }
  }
}
</style>

