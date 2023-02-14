<template lang="pug">
.add-liquidity-component
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-4
    i.el-icon-circle-plus-outline
    span Add Liquidity
  .d-flex.justify-content-between.gap-32
    .d-flex.flex-column.gap-8.left
      .fs-14.disable Select Pair and deposit amounts

      PoolTokenInput(v-model="amountA" :token="tokenA" :tokens="tokensA" @tokenSelected="setTokenA")
      .fs-14.disable Select Pair and deposit amounts

      PoolTokenInput(:token="tokenB" :tokens="tokensA" v-model="amountB" @tokenSelected="setTokenB")
      .d-flex.justify-content-end Balance: 1,000 WAX

      .fs-14.disable Select Price Range

      el-slider(v-model="value" range :marks="marks" :min="-100" :max="100").px-3.pr-4

      //.d-flex.gap-8.mt-3.justify-content-center
        .grey-border.d-flex.flex-column.gap-20.p-2.br-4
          .fs-12.text-center Min Price
          el-input-number(v-model="minPrice" :precision="2" :step="0.1" :max="100")
          .fs-12.text-center BLK per WAX
        .grey-border.d-flex.flex-column.gap-20.p-2.br-4
          .fs-12.text-center Max Price
          el-input-number(v-model="maxPrice" :precision="2" :step="0.1" :max="100")
          .fs-12.text-center BLK per WAX

      .fs-14.disable.mt-2 Select Fee

      .d-flex.gap-16
        .fee.d-flex.flex-column.gap-16(v-for="({ value, desc, selectedPercent }, idx) in fees" @click="selectedFee = idx" :class="{ active: selectedFee == idx }")
          .fs-24 {{ value }}
          .fs-14.disable {{ desc }}
          .d-flex.gap-4
            span {{ selectedPercent }}
            span Selected

      alcor-button.w-100(@click="openPreviewLiqidityModal" access big) Preview

      | {{ pool }}

</template>

<script>
import { mapActions, mapState, mapGetters } from 'vuex'
import PoolTokenInput from '~/components/amm/PoolTokenInput'

import AlcorButton from '~/components/AlcorButton'

export default {
  components: { PoolTokenInput, AlcorButton },

  data() {
    return {
      tokenA: null,
      tokenB: null,

      amountA: 0,
      amountB: 0,

      max: 100,

      value: [-50, 50],

      selectedFee: 1,

      fees: [
        { value: 0.05, desc: 'Best forvery high liquidity tokens', selectedPercent: 0 },
        { value: 0.3, desc: 'Best for most pairs', selectedPercent: 44 },
        { value: 1, desc: 'Best for low liqudity pairs', selectedPercent: 56 }
      ]
    }
  },

  watch: {
    pool() {
      //console.log('value changed pool', this.pools[0].getOutputAmount('123', 0))
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapGetters('amm', ['pools']),

    tokensA() {
      return this.user?.balances || []
    },

    pool() {
      if (!this.tokensA || !this.tokenB) return null

      return this.pools.find(p => {
        return p.tokenA.name == this.tokenA.id.toLowerCase().replace('@', '-') &&
          p.tokenB.name == this.tokenB.id.toLowerCase().replace('@', '-')
      })
    },

    marks() {
      return {
        '-100': '-100%',
        100: '100%',
        0: {
          style: { color: '#fff' },
          label: this.$createElement('strong', this.pool ? this.pool.tokenBPrice.toFixed() : 'no price')
        }
      }
    }
  },

  mounted() {
    this.tokenA = this.tokensA[1]
    this.tokenB = this.tokensA[2]
  },

  methods: {
    ...mapActions('modal', ['previewLiquidity']),

    setTokenA(token) {
      this.tokenA = token
    },

    setTokenB(token) {
      this.tokenB = token
    },

    openPreviewLiqidityModal() {
      const { outputToken, inputToken, inputAmount, outputAmount, selectedFee, maxPrice, minPrice, fees, inRange } = this

      this.previewLiquidity({
        inputToken,
        outputToken,
        inputAmount,
        outputAmount,
        selectedFee,
        maxPrice,
        minPrice,
        fees,
        inRange
      })
    }
  }
}
</script>

<style lang="scss">
.add-liquidity-component {
  .left {
    width: 587px;
  }

  .el-slider__marks-text:last-child {
    width: 40px;
  }

  .fee {
    width: 185px;
    height: 156px;
    padding: 16px 24px;
    cursor: pointer;

    background: rgba(60, 60, 67, 0.36);

    border: 1px solid rgba(120, 120, 135, 0.36);
    border-radius: 4px;

    &.active {
      border: 1px solid #67C23A;
      background: #161617;
    }
  }
}
</style>
