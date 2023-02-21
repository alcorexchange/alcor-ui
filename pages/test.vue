<template lang="pug">
  alcor-container
    el-button(@click="test") Test
    el-button(@click="openCreatePoolModal") Create Pool

    hr

    .token-input
      el-input(placeholder="amount" v-model="input" type="text")
        template(slot="append")
          select-token(:tokens="tokens" @selected="setToken")

    hr

    | range..
    hr

    //RangeSelector(
      v-if="pool"
      currencyA="baseCurrency || undefined"
      currencyB="quoteCurrency || undefined"
      feeAmount="feeAmount}"
      ticksAtLimit="ticksAtLimit"
      price="price ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8)) : undefined"
      priceLower="priceLower"
      priceUpper="priceUpper"
      onLeftRangeInput="onLeftRangeInput"
      onRightRangeInput="onRightRangeInput"
      interactive="!hasExistingPosition")


</template>

<script>
import JSBI from 'jsbi'

import { mapState, mapGetters, mapActions } from 'vuex'

import { PositionLibrary, TickLibrary, CurrencyAmount, Token } from '~/assets/libs/swap-sdk'

import SelectToken from '~/components/modals/amm/SelectToken'
import AlcorContainer from '~/components/AlcorContainer'
import TokenImage from '~/components/elements/TokenImage'

export default {
  layout: 'test',
  components: { AlcorContainer, TokenImage, SelectToken },

  data: () => {
    return {
      input: ''
    }
  },

  computed: {
    ...mapState(['user', 'network']),

    tokens() {
      return this.user?.balances || []
    },

    //ticksAtLimit() {
    //  return {
    //    [Bound.LOWER]: feeAmount && tickLower === tickSpaceLimits.LOWER,
    //    [Bound.UPPER]: feeAmount && tickUpper === tickSpaceLimits.UPPER,
    //  }
    //}
  },

  created() {
    //this.$store.dispatch('amm/placePosition')
  },

  methods: {
    ...mapActions('modal', ['createPool', 'assets']),

    setToken(token) {
      console.log('selected token', token)
    },

    openCreatePoolModal() {
      this.createPool()
    },

    async test() {
      await this.$store.dispatch('amm/fetchPositions')
      const pool = this.$store.state.amm.pools[0]
      const position = this.$store.state.amm.positions[7]
      console.log({ position })

      const { liquidity, upper, lower, feeGrowthInsideALastX64, feeGrowthInsideBLastX64 } = position
      const tickLower = pool.ticks.find(t => t.id == lower)
      const tickUpper = pool.ticks.find(t => t.id == upper)

      console.log({ tickLower, tickUpper, pool, position })

      const feeGrowthOutsideLower = {
        feeGrowthOutsideAX64: JSBI.BigInt(tickLower.feeGrowthOutsideAX64),
        feeGrowthOutsideBX64: JSBI.BigInt(tickLower.feeGrowthOutsideBX64)
      }

      const feeGrowthOutsideUpper = {
        feeGrowthOutsideAX64: JSBI.BigInt(tickUpper.feeGrowthOutsideAX64),
        feeGrowthOutsideBX64: JSBI.BigInt(tickUpper.feeGrowthOutsideBX64)
      }

      const { feeGrowthGlobalAX64, feeGrowthGlobalBX64 } = pool

      const [feeGrowthInsideAX64, feeGrowthInsideBX64] = TickLibrary.getFeeGrowthInside(
        feeGrowthOutsideLower,
        feeGrowthOutsideUpper,
        lower,
        upper,
        pool.currSlot.tick,
        JSBI.BigInt(feeGrowthGlobalAX64),
        JSBI.BigInt(feeGrowthGlobalBX64)
      )

      console.log({ feeGrowthInsideAX64, feeGrowthInsideBX64 })


      const [tokensOwnedA, tokensOwnedB] = PositionLibrary.getTokensOwed(
        JSBI.BigInt(feeGrowthInsideALastX64),
        JSBI.BigInt(feeGrowthInsideBLastX64),
        JSBI.BigInt(liquidity),
        feeGrowthInsideAX64,
        feeGrowthInsideBX64
      )

      const currencyA = new Token('eosio.token', 4, 'A', 'tokenA')
      const currencyB = new Token('eosio.token', 4, 'B', 'tokenA')

      const feesA = CurrencyAmount.fromRawAmount(currencyA, tokensOwnedA)
      const feesB = CurrencyAmount.fromRawAmount(currencyB, tokensOwnedB)

      console.log(feesA.toFixed() + ' ' + currencyA.symbol)
      console.log(feesB.toFixed() + ' ' + currencyB.symbol)

      // console.log(
      //   JSBI.BigInt(feeGrowthInsideALastX64),
      //   JSBI.BigInt(feeGrowthInsideBLastX64),
      //   JSBI.BigInt(liquidity),
      //   feeGrowthInsideAX64,
      //   feeGrowthInsideBX64
      // )

      //const ZERO = JSBI.BigInt(0)
      //const [feeGrowthInsideAX64, feeGrowthInsideBX64] =
      //  TickLibrary.getFeeGrowthInside(
      //    {
      //      feeGrowthOutsideAX64: ZERO,
      //      feeGrowthOutsideBX64: ZERO
      //    },
      //    {
      //      feeGrowthOutsideAX64: ZERO,
      //      feeGrowthOutsideBX64: ZERO
      //    },
      //    -1,
      //    1,
      //    0,
      //    JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)),
      //    JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128))
      //  )


      //console.log({ feeGrowthInsideAX64, feeGrowthInsideBX64 })





      //const params = [feeGrowthInsideALastX64, feeGrowthInsideBLastX64, liquidity ]

      //console.log({ liquidity, tk, feeGrowthInsideALastX64, feeGrowthInsideBLastX64 })

      //console.log({ PositionLibrary })
      //this.$store.dispatch('amm/init')
      //this.$store.dispatch('amm/swap/test')

      // public static getTokensOwed(
      //   feeGrowthInsideALastX64: JSBI,
      //   feeGrowthInsideBLastX64: JSBI,
      //   liquidity: JSBI,
      //   feeGrowthInsideAX64: JSBI,
      //   feeGrowthInsideBX64: JSBI
      // ) {
      //console.log('R', r)
    }
  }
}

</script>

<style lang="scss">
.token-input {
  width: 300px;

  .select-token-button {
    display: flex;
    align-items: center;

    padding: 5px 9px;
    border: 1px solid;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      border-color: white;
    }
  }

  .el-input__inner {
    height: 50px;
  }

  .el-input-group__append {
    //display: flex;
  }

  .el-button {
    border: 1px solid;
    //padding: 5px 5px;
  }

  input {
    background-color: var(--selector-bg);;
  }
}
</style>
