<template lang="pug">
div
  AlcorContainer(:alternative="true").mt-3.remove-liquidity-percentage
    .percentage.fs-24 {{ percent }}%
    el-slider(
      v-model="percent"
      :step='1',
      :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
      :show-tooltip="false"
    ).slider-buy.w-100.mb-2

    .d-flex.justify-content-between.mt-4
      .d-flex.align-items-center.gap-8
        token-image.token-image(src="token-conract" height="25")
        span WAX
      .d-flex.align-items-center.gap-8
        .fs-18 {{ amountB }}
        .fs-14.color-action ($60.56)

    .d-flex.justify-content-between.mt-2
      .d-flex.align-items-center.gap-8
        token-image.token-image(src="token-conract" height="25")
        span WAX
      .d-flex.align-items-center.gap-8
        .fs-18 {{ amountA }}
        .fs-14.color-action ($60.56)

  AlcorButton.claim-fees-button.submit.w-100.mt-3(access @click="submit") {{ $t('Remove Liquidity and Claim Fees') }}
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { Percent } from '~/assets/libs/swap-sdk'

import AlcorContainer from '~/components/AlcorContainer'
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: {
    AlcorContainer,
    TokenImage,
    AlcorButton
  },

  props: ['position'],

  data: () => ({
    percent: 100,

    liquidity: 0,

    search: '',
    tab: 'all',
    selected: null,

    tabs: [
      { label: 'Owned', value: 'owned' },
      { label: 'All', value: 'all' }
    ]
  }),

  computed: {
    ...mapState(['network', 'user']),
    ...mapGetters('amm', ['slippage']),

    amountA() {
      return (parseFloat(this.position.amountA.toFixed()) * (this.percent / 100)).toFixed(this.position.pool.tokenA.decimals)
    },

    amountB() {
      return (parseFloat(this.position.amountB.toFixed()) * (this.percent / 100)).toFixed(this.position.pool.tokenB.decimals)
    }
  },

  methods: {
    selectAsset(v) {
      this.$emit('selected', v)
    },

    async submit() {
      try {
        await this.remove()

        if (this.percent == 100) this.$router.push('/positions/my-positions')
        this.$store.dispatch('amm/poolUpdate', this.position?.pool?.id)
        this.$store.dispatch('amm/fetchPositions')
      } catch (e) {
        console.error('remove liquidity', e)
        return this.$notify({ type: 'error', title: 'Remove Liquidity Error', message: e.message })
      }
    },

    async remove() {
      if (!this.position) return this.$notify({ type: 'Error', title: 'No position' })

      const { tokenA, tokenB } = this.position.pool
      const { owner, tickLower, tickUpper } = this.position

      const liquidity = new Percent(this.percent * 100, 10000).multiply(this.position.liquidity).quotient.toString()

      const tokenAZero = Number(0).toFixed(tokenA.decimals) + ' ' + tokenA.symbol
      const tokenBZero = Number(0).toFixed(tokenB.decimals) + ' ' + tokenB.symbol

      const actions = [{
        account: this.network.amm.contract,
        name: 'subliquid',
        authorization: [this.user.authorization],
        data: {
          poolId: this.position.pool.id,
          owner,
          liquidity,
          tickLower,
          tickUpper,
          tokenAMin: tokenAZero,
          tokenBMin: tokenBZero,
          deadline: 0
        }
      }]

      if (this.percent == 100) {
        actions.push({
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
        })
      }

      const result = await this.$store.dispatch('chain/sendTransaction', actions)
      console.log('remove', result)
    },

    setPercent(percent) {
      if (percent == 'max') return this.percent = 100
      this.percent = parseInt(percent)
    }
  }
}
</script>

<style lang="scss">
.percentage{
  font-weight: bold;
}
.slider-buy{
  padding: 0 18px;
}
</style>

