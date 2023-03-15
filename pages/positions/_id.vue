<template lang="pug">
alcor-container.manage-liquidity-component(v-if="position && position.pool")
  PageHeader(title="Manage Liquidity")
  .main.gap-16.pt-3
    .left
      PositionInfo(:position="position" :tokensInverted="tokensInverted")
        template(#action)
          IncreaseLiquidity(
            :position="position"
            :tokensInverted="tokensInverted"
            :priceLower="priceLower"
            :priceUpper="priceUpper"
            @toggleTokens="toggleTokens"
          )

      .separator.mt-2
      UnclaimedFees(:position="position")
      .separator.mt-2
      RemoveLiquidityPercentage(:position="position")
    .right
      // TODO Proper zooming
      LiquidityChartRangeInput(
        :tokenA="tokensInverted ? pool.tokenB : pool.tokenA"
        :tokenB="tokensInverted ? pool.tokenA : pool.tokenB"
        :feeAmount="pool.fee"
        :priceLower="priceLower"
        :priceUpper="priceUpper"
        :price="(tokensInverted ? pool.tokenBPrice : pool.tokenAPrice).toSignificant(5)"
        :ticksAtLimit="ticksAtLimit"
        chartTitle="Price Range"
        :interactive="false")

        template(#afterZoomIcons)
          //- TODO: add one and two based on invert price
          AlcorSwitch(
            v-if='pool.tokenA && pool.tokenB',
            @toggle="toggleTokens",
            :one='pool.tokenA.symbol',
            :two='pool.tokenB.symbol',
            :active='tokensInverted ? "two" : "one"'
          )

      ManageLiquidityMinMaxPrices(
        :tokensInverted="tokensInverted"
        :position="position"
        :priceLower="tokensInverted ? priceUpper : priceLower"
        :priceUpper="tokensInverted ? priceLower : priceUpper"
      ).mt-3

      InfoContainer.info.mt-3(:access="true")
        | To update the price range, you need to close this position and open a new one,
        | you can read about automating the price range here&nbsp;
        nuxt-link(to="/") Learn about liquidity price range

</template>

<script>
import AlcorContainer from '~/components/AlcorContainer'
import PageHeader from '~/components/amm/PageHeader'
import PositionInfo from '~/components/amm/manage-liquidity/PositionInfo'
import UnclaimedFees from '~/components/amm/manage-liquidity/UnclaimedFees'
import RemoveLiquidityPercentage from '~/components/amm/manage-liquidity/RemoveLiquidityPercentage'
import InfoContainer from '~/components/UI/InfoContainer'
import IncreaseLiquidity from '~/components/modals/amm/IncreaseLiquidity'
import LiquidityChartRangeInput from '~/components/amm/range'
import ManageLiquidityMinMaxPrices from '~/components/amm/ManageLiquidityMinMaxPrices'
import AlcorSwitch from '~/components/AlcorSwitch'

import { getPoolBounds, getTickToPrice } from '~/utils/amm'

export default {
  components: {
    AlcorContainer,
    InfoContainer,
    PageHeader,
    PositionInfo,
    UnclaimedFees,
    RemoveLiquidityPercentage,
    IncreaseLiquidity,
    LiquidityChartRangeInput,
    AlcorSwitch,
    ManageLiquidityMinMaxPrices
  },

  data: () => ({
    tokensInverted: false
  }),

  computed: {
    poolId() {
      const [poolId] = this.$route.params.id.split('-')
      return poolId
    },
    position() {
      const [pool_id, position_id, fee] = this.$route.params.id.split('-')
      return this.$store.getters['amm/positions']?.find(p => p.pool.id == pool_id && p.id == position_id && p.pool.fee == fee)
    },

    pool() {
      return this.position?.pool
    },

    priceLower() {
      return getTickToPrice(this.pool?.tokenA, this.pool?.tokenB, this.position.tickLower)
    },

    priceUpper() {
      return getTickToPrice(this.pool?.tokenA, this.pool.tokenB, this.position.tickUpper)
    },

    // TODO Move to chart or make blobal
    tickSpaceLimits() {
      return getPoolBounds(this.feeAmount)
    },

    ticksAtLimit() {
      const { tickSpaceLimits, position: { tickLower, tickUpper, pool: { feeAmount } } } = this

      return {
        LOWER: feeAmount && tickLower === tickSpaceLimits.LOWER,
        UPPER: feeAmount && tickUpper === tickSpaceLimits.UPPER
      }
    },
  },

  async mounted() {
    // TODO RegexTest url params
    await this.$store.dispatch('amm/fetchPositions')
  },

  methods: {
    toggleTokens() {
      // this.$store.dispatch('amm/toggleTokens', { poolId: this.poolId })
      this.tokensInverted = !this.tokensInverted
    }
  },

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
<style scoped lang="scss">
@media only screen and (max-width: 860px){
  .main{
    flex-direction: column;
    gap: 40px;
  }
  .manage-liquidity-component{
    margin-top: 20px;
  }
}
</style>
