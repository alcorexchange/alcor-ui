<template lang="pug">
.unclaimed-fees
  .d-flex.justify-content-between.mt-2
    .fs-18.disable {{ $t('Unclaimed Fees') }}
    AlcorButton.claim-fees-button.f-14(access @click="submit") {{ $t('Claim Fees') }}

  .d-flex.justify-content-between.mt-2
    .d-flex.align-items-center.gap-8
      span {{ position.amountA.currency.symbol }} Fees Earned
    .d-flex.align-items-center.gap-8
      .fs-18.lh-12 {{ feesA }}
      .fs-14.color-action (${{ $tokenToUSD(parseFloat(feesA), position.pool.tokenA.symbol, position.pool.tokenA.contract) }})

  .d-flex.justify-content-between.mt-1
    .d-flex.align-items-center.gap-8
      span {{ position.amountB.currency.symbol }} Fees Earned
    .d-flex.align-items-center.gap-8
      .fs-18.lh-12 {{ feesB }}
      .fs-14.color-action (${{ $tokenToUSD(parseFloat(feesB), position.pool.tokenB.symbol, position.pool.tokenB.contract) }})

</template>

<script>
import { mapState } from 'vuex'
import RangeIndicator from '~/components/amm/RangeIndicator'
import AlcorButton from '~/components/AlcorButton.vue'
export default {
  components: {
    RangeIndicator,
    AlcorButton
  },

  props: ['position'],

  // data: () => {
  //   return {
  //     feesA: null,
  //     feesB: null
  //   }
  // },

  computed: {
    ...mapState(['network', 'user']),

    positionStats() {
      return this.$store.state.amm.positionsStats.find(p => p.id == this.position.id)
    },

    feesA() {
      const { tokenA } = this.position.pool
      return this.positionStats?.feesA + ' ' + tokenA.symbol
    },

    feesB() {
      const { tokenB } = this.position.pool
      return this.positionStats?.feesB + ' ' + tokenB.symbol
    }
  },

  methods: {
    async submit() {
      try {
        await this.collect()
        // this.$store.dispatch('amm/poolUpdate', this.position?.pool?.id)
        // this.$store.dispatch('amm/fetchPositions')
      } catch (e) {
        return this.$notify({ type: 'error', title: 'Collect Fees', message: e.message })
      }
    },

    async collect() {
      if (!this.position) return this.$notify({ type: 'Error', title: 'No position' })

      const { tokenA, tokenB } = this.position.pool
      const { owner, tickLower, tickUpper } = this.position

      const tokenAZero = Number(0).toFixed(tokenA.decimals) + ' ' + tokenA.symbol
      const tokenBZero = Number(0).toFixed(tokenB.decimals) + ' ' + tokenB.symbol

      const actions = [{
        account: this.network.amm.contract,
        name: 'subliquid',
        authorization: [this.user.authorization],
        data: {
          poolId: this.position.pool.id,
          owner,
          liquidity: 0,
          tickLower,
          tickUpper,
          tokenAMin: tokenAZero,
          tokenBMin: tokenBZero,
          deadline: 0
        }
      }, {
        account: this.network.amm.contract,
        name: 'collect',
        authorization: [this.user.authorization],
        data: {
          poolId: this.position.pool.id,
          owner,
          recipient: owner,
          tickLower,
          tickUpper,
          tokenAMax: tokenAZero,
          tokenBMax: tokenBZero,
        }
      }]

      const result = await this.$store.dispatch('chain/sendTransaction', actions)
      console.log({ result })
    }
  }
}
</script>

<style lang="scss">
.claim-fees-button{
  padding: 2px 8px;
  font-weight: 500;
  border: none !important;
  color: var(--text-theme) !important;
  &:hover{
    background: var(--main-green) !important;
  }
}
</style>
