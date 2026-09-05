<template lang="pug">
div(v-loading="!position && !this.positionNotFound")
  alcor-container.manage-liquidity-component(v-if="position && position.pool")
    PageHeader(:title="title")
      template(v-slot:end)
        el-tooltip(class="item" effect="dark" content="Transfer Position" placement="top")
          .el-icon-position.pointer.fs-18.mr-1(@click="transferPos")

    .main.gap-16.pt-3
      .left
        PositionInfo(:position="position" :tokensInverted="tokensInverted")
          template(#action)
            IncreaseLiquidity(
              v-if="isMyPosition"
              :position="position"
              :tokensInverted="tokensInverted"
              :priceLower="priceLower"
              :priceUpper="priceUpper"
              @toggleTokens="toggleTokens"
            )

            AlcorButton.increase-button(v-else @click="openInNewTab(monitorAccount(position.owner))")
              span {{ position.owner }}
        .separator.mt-2
        UnclaimedFees(:position="position" :isMyPosition="isMyPosition")
        .separator.mt-2
        RemoveLiquidityPercentage(:class="{ mutted: !isMyPosition && $store.state.user }" :position="position")
      .right
        // TODO Proper initial zooming for infinite range
        LiquidityChartRangeInput(
          :tokenA="tokensInverted ? position.pool.tokenB : position.pool.tokenA"
          :tokenB="tokensInverted ? position.pool.tokenA : position.pool.tokenB"
          :feeAmount="position.pool.fee"
          :priceLower="priceLower"
          :priceUpper="priceUpper"
          :price="(tokensInverted ? position.pool.tokenBPrice : position.pool.tokenAPrice).toSignificant(5)"
          :ticksAtLimit="ticksAtLimit"
          chartTitle="Price Range"
          :interactive="false")

          template(#afterZoomIcons)
            //- TODO: add one and two based on invert price
            AlcorSwitch(
              v-if='position.pool.tokenA && position.pool.tokenB',
              @toggle="toggleTokens",
              :one='position.pool.tokenA.symbol',
              :two='position.pool.tokenB.symbol',
              :active='tokensInverted ? "two" : "one"'
            )

        ManageLiquidityMinMaxPrices(
          :tokensInverted="tokensInverted"
          :position="position"
          :priceLower="tokensInverted ? priceUpper : priceLower"
          :priceUpper="tokensInverted ? priceLower : priceUpper"
          :ticksAtLimit="ticksAtLimit"
        ).mt-3

        InfoContainer.info.mt-3(:access="true")
          | To update the price range, you need to close this position and open a new one,
          | you can read about automating the price range here&nbsp;
          a(href="https://docs.alcor.exchange/alcor-swap/introduction" target="_blank") Learn about liquidity price range

  .position-loading(v-else)
    alcor-container.manage-liquidity-component(v-if="positionNotFound")
      h1 404
      .label The position is closed or has not yet been created
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
import AlcorButton from '~/components/AlcorButton.vue'

import { getPoolBounds, getTickToPrice, constructPosition, constructPoolInstance } from '~/utils/amm'

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
    AlcorButton,
    ManageLiquidityMinMaxPrices,
  },

  data: () => ({
    loadedPosition: null,
    tokensInverted: false,
    positionNotFound: false,
  }),

  computed: {
    title() {
      return this.isMyPosition ? 'Manage Liquidity' : 'Position View'
    },

    position() {
      const posId = this.$route.params.id
      const position = this.$store.getters['amm/positions']?.find((p) => p.id == posId)

      if (!position && this.loadedPosition) {
        const pool = this.$store.state.amm.pools.find((p) => p.id == this.loadedPosition.pool)
        if (!pool) return

        const positionInstance = constructPosition(constructPoolInstance(pool), this.loadedPosition)

        return positionInstance
      }

      return position
    },

    isMyPosition() {
      if (!this.position) return false

      return this.$store.state.user?.name == this.position.owner
    },

    priceLower() {
      return getTickToPrice(this.position.pool?.tokenA, this.position.pool?.tokenB, this.position.tickLower)
    },

    priceUpper() {
      return getTickToPrice(this.position.pool?.tokenA, this.position.pool.tokenB, this.position.tickUpper)
    },

    // TODO Move to chart or make blobal
    tickSpaceLimits() {
      return getPoolBounds(this.position?.pool?.fee)
    },

    ticksAtLimit() {
      const {
        tickSpaceLimits,
        position: {
          tickLower,
          tickUpper,
          pool: { fee },
        },
      } = this

      return {
        LOWER: fee && tickLower === tickSpaceLimits.LOWER,
        UPPER: fee && tickUpper === tickSpaceLimits.UPPER,
      }
    },
  },

  mounted() {
    this.loadPosition()
  },

  methods: {
    transferPos() {
      this.$prompt('Please enter receiver account', 'Transfer Position', {
        confirmButtonText: 'Transfer',
        cancelButtonText: 'Cancel',
      }).then(async ({ value: to }) => {
        try {
          await this.$rpc.get_account(to)
        } catch (e) {
          return this.$notify({
            type: 'warning',
            message: 'Account does not exists',
          })
        }

        console.log(this.position)
        const { id, pool, owner, tickLower, tickUpper } = this.position
        const actions = [
          {
            account: this.$store.state.network.amm.contract,
            name: 'transferpos',
            authorization: [this.$store.state.user.authorization],

            data: {
              poolId: pool.id,
              owner,
              to,
              tickLower,
              tickUpper,
              memo: '',
            },
          },
        ]

        try {
          await this.$store.dispatch('chain/sendTransaction', actions)
        } catch (e) {
          return this.$notify({
            type: 'error',
            message: e.message,
          })
        }

        setTimeout(() => this.loadPosition(), 5000)
      })
    },

    async loadPosition() {
      try {
        const { data } = await this.$axios.get('/v2/swap/pools/positions/' + this.$route.params.id)

        if (data) {
          this.loadedPosition = data
        } else {
          this.positionNotFound = true
        }
      } catch (e) {
        this.positionNotFound = true
      }
    },

    toggleTokens() {
      this.tokensInverted = !this.tokensInverted
    },
  },
}
</script>

<style lang="scss">
@media only screen and (max-width: 600px) {
  .el-message-box {
    width: 95% !important;
  }
}
.position-loading {
  min-height: 300px;
}

.manage-liquidity-component {
  padding: 12px !important;
  width: 100%;
  max-width: 920px;
  margin: 50px auto;
  .main {
    display: flex;
    .left,
    .right {
      flex: 1;
    }
  }
  .claim-fees-button {
    padding: 4px 8px;
    font-weight: 500;
    border: none !important;
    color: var(--text-theme) !important;
    &:hover {
      background: var(--main-green) !important;
    }
    &.submit {
      padding: 14px;
      border-radius: 6px;
    }
  }

  .increase-button {
    color: var(--border-active-color);
    font-weight: 500;
    padding: 4px 8px;
  }
  .token-image {
    width: 16px;
    height: 16px;
  }
  .separator {
    width: 100%;
    border-bottom: 1px solid var(--border-1-color);
  }
  .info {
    background-color: var(--selector-bg) !important;
  }
}
</style>
<style scoped lang="scss">
@media only screen and (max-width: 860px) {
  .main {
    flex-direction: column;
    gap: 40px;
  }
  .manage-liquidity-component {
    margin-top: 20px;
  }
}
</style>
