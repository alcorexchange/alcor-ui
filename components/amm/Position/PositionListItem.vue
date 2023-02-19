<template lang="pug">
#pool-row-component.d-flex.align-items-center.p-3
  .icons
    pair-icons(:token1="position.pool.tokenA" :token2="position.pool.tokenB")

  .d-flex.align-items-center.gap-10.name
    .fs-14 {{ position.pool.tokenA.symbol }} / {{ position.pool.tokenB.symbol }}
    .tag {{ position.pool.fee / 10000 }}%
  .range.d-flex.flex-column
    .d-flex.align-items-center.gap-4
      .indicator(:class="{ 'in-range': !outOfRange }")
      .fs-10 {{ !outOfRange ? 'In Range': 'Out of Range' }}
    .d-flex.align-items-center.gap-6
      .fs-14.disable MIN
      .fs-14.contrast {{ priceLower }}
      i.el-icon-sort.rot
      .fs-14.disable MAX
      .fs-14.contrast {{ priceUpper }}
  .earning.d-flex.flex-column.gap-4
    .d-flex.align-items-center.gap-4
      token-image.token(:src='$tokenLogo(position.pool.tokenA.symbol, position.pool.tokenB.contract)')
      //.fs-12.earn.d-flex.gap-4(:class="{ red: pool.inputEarning < 0 }")
        span {{ pool.inputEarning > 0 ? '+': '' }}{{ pool.inputEarning | commaFloat }}
        span {{ pool.input.symbol }}

      .fs-12.earn.d-flex.gap-4(:class="{ red: true }")
        span 0.00
        span {{ position.pool.tokenA.symbol }}
    .d-flex.align-items-center.gap-4
      token-image.token(:src='$tokenLogo(position.pool.tokenB.symbol, position.pool.tokenB.contract)')
      //.fs-12.earn.d-flex.gap-4(:class="{ red: pool.outputEarning < 0 }")
        span {{ pool.outputEarning > 0 ? '+': '' }}{{ pool.outputEarning | commaFloat }}
        span {{ pool.output.symbol }}

      .fs-12.earn.d-flex.gap-4(:class="{ red: false }")
        span 0.00
        span {{ position.pool.tokenB.symbol }}

  .actions.d-flex.gap-16
    router-link(:to="{ name: `manage-liquidity-id___${$i18n.locale}`, params: { id: position.id } }")
      .action-link.manage Manage
    .action-link.claim Claim

</template>



<script>
import PairIcons from '~/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import { isTicksAtLimit } from '~/utils/amm'
import { FeeAmount } from '~/assets/libs/swap-sdk'

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
  // TODO Format Price
  components: { PairIcons, TokenImage },
  props: ['position'],

  computed: {
    outOfRange() {
      const { pool, tickLower, tickUpper } = this.position
      return pool ? pool.tickCurrent < tickLower || pool.tickCurrent >= tickUpper : false
    },

    priceLower() {
      const { tickLower, tickUpper, pool: { fee: feeAmount } } = this.position
      const isOnLimit = isTicksAtLimit(feeAmount, tickLower, tickUpper)

      if (isOnLimit.LOWER) {
        return '0'
      }

      return getPositionPrice(this.position).priceLower.toFixed()
    },

    priceUpper() {
      const { tickLower, tickUpper, pool: { fee: feeAmount } } = this.position
      const isOnLimit = isTicksAtLimit(feeAmount, tickLower, tickUpper)

      if (isOnLimit.UPPER) {
        return '∞'
      }

      return getPositionPrice(this.position).priceUpper.toFixed()
    }
  }
}
</script>

<style lang="scss">
#pool-row-component {
  .rot {
    transform: rotate(90deg);
  }
  .icons {
    width: 50px;
  }
  .name {
    width: 150px;
  }
  .range {
    width: 200px;
  }
  .earning {
    width: 150px;
  }
  .actions {
    width: 150px;
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
    width: 8px;
    height: 8px;

    background: var(--disabled-indicator);
    border-radius: 2px;

    &.in-range {
      background: var(--access-indicator);
    }
  }
  .token {
    width: 12px;
    height: 12px;
  }
  .earn {
    color: var(--main-green);
    &.red {
      color: var(--main-red);
    }
  }
  .action-link {
    text-decoration: underline;
    cursor: pointer;
    &.manage {
      color: #80A1C5;
    }
    &.claim {
      color: #66C167;
    }
  }

}
</style>
