<template lang="pug">
alcor-container.manage-liquidity-component(v-if="position && position.pool")
  PageHeader(title="Manage Liquidity")
  .main.gap-16.pt-3
    .left
      PositionInfo
        template(#action)
          IncreaseLiquidity
      .separator.mt-3
      UnclaimedFees
      .separator.mt-3
      RemoveLiquidityPercentage
      AlcorButton.claim-fees-button.submit.w-100.mt-3(access) {{ $t('Remove Liquidity and Claim Fees') }}
    .right
      LiquidityChartRangeInput(
        :tokenA="pool.tokenA"
        :tokenB="pool.tokenB"
        :feeAmount="pool.fee"
        :priceLower="priceLower"
        :priceUpper="priceUpper"
        :price="position.pool.tokenAPrice.toSignificant(5)"
        :ticksAtLimit="ticksAtLimit"
        chartTitle="Price Range"
        :interactive="false")

        template(#afterZoomIcons)
          //- TODO: add one and two based on invert price
          AlcorSwitch(
            v-if='pool.tokenA && pool.tokenB',
            @toggle='() => {}',
            :one='pool.tokenA.symbol',
            :two='pool.tokenB.symbol',
            :active='"one"'
          )

      .d-flex.gap-8.mt-3
        InputStepCounter(:readOnly="true" :value="priceLower.toSignificant(5)")
          template(#top)
            .fs-12.text-center Min Price
          .fs-12.text-center wax per eos
          .fs-12.text-center.disable Your position will be 100% composed of WAX at this price
        InputStepCounter(:readOnly="true" :value="priceUpper.toSignificant(5)")
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
import PositionInfo from '~/components/amm/manage-liquidity/PositionInfo'
import UnclaimedFees from '~/components/amm/manage-liquidity/UnclaimedFees'
import RemoveLiquidityPercentage from '~/components/amm/manage-liquidity/RemoveLiquidityPercentage'
import InfoContainer from '~/components/UI/InfoContainer'
import IncreaseLiquidity from '~/components/modals/amm/IncreaseLiquidity'
import LiquidityChartRangeInput from '~/components/amm/range'
import AlcorSwitch from '~/components/AlcorSwitch'

import { getPoolBounds, getTickToPrice } from '~/utils/amm'

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
    PositionInfo,
    UnclaimedFees,
    RemoveLiquidityPercentage,
    IncreaseLiquidity,
    LiquidityChartRangeInput,
    AlcorSwitch
  },

  data: () => ({
    profitLoss: null,
    series: null,

    fees: {},
  }),

  computed: {
    position() {
      const [pool_id, position_id, fee] = this.$route.params.id.split('-')
      return this.$store.getters['amm/positions']?.find(p => p.pool.id == pool_id && p.id == position_id && p.pool.fee == fee)
    },

    pool() {
      console.log('position', this.position)
      return this.position?.pool
    },

    feesA() {
      return this.fees?.feesA
    },

    feesB() {
      return this.fees?.feesB
    },

    // TODO Implement invertPrice
    priceLower() {
      const { tickLower, pool: { tokenA, tokenB } } = this.position

      return getTickToPrice(tokenA, tokenB, tickLower)
    },

    // TODO Implement invertPrice
    priceUpper() {
      const { tickUpper, pool: { tokenA, tokenB } } = this.position

      return getTickToPrice(tokenA, tokenB, tickUpper)
    },

    tickSpaceLimits() {
      return getPoolBounds(this.feeAmount)
    },

    ticksAtLimit() {
      const { tickSpaceLimits, position: { tickLower, tickUpper, pool: { feeAmount } } } = this

      return {
        LOWER: feeAmount && tickLower === tickSpaceLimits.LOWER,
        UPPER: feeAmount && tickUpper === tickSpaceLimits.UPPER
      }
    }
  },

  watch: {
    position() {
      this.calcFees()
    }
  },

  async mounted() {
    // TODO RegexTest url params
    await this.$store.dispatch('amm/fetchPositions')
  },

  methods: {
    async calcFees() {
      const { feesA, feesB } = await this.position.getFees()
      this.fees = { feesA: feesA.toFixed(), feesB: feesB.toFixed() }
    },

    async fetchProfitLoss() {
      const r = await (
        await fetch('https://alcor.exchange/api/pools/0/charts?period=7D')
      ).json()

      const newData = r.reduce(
        (res, point) => [
          [
            {
              name: 'token1',
              data: [...res[0][0].data, point.price.toFixed(4)]
            },
            {
              name: 'token2',
              data: [...res[0][1].data, point.price_r.toFixed(4)]
            }
          ],
          [...res[1], point.time]
        ],
        [
          [
            {
              name: 'token1',
              data: []
            },
            {
              name: 'token2',
              data: []
            }
          ],
          []
        ]
      )
      const [series, xaxis] = newData
      this.series = series
      this.options.xaxis.categories = xaxis
    }
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
