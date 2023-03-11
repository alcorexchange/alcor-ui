<template lang="pug">
client-only
  .div
    p.infoBox(v-if="isUninitialized") Your position will appear here.
    p.infoBox(v-if="isLoading") Loading
    p.infoBox(v-if="error") Liquidity data not available.

    .chartWrapper(ref="chartWrapper")
      Chart(
        :current="price"
        :series="series"
        :width="400"
        :height="200"
        :margins="{ top: 10, right: 2, bottom: 20, left: 0 }"
        :interactive="interactive"
        :brushLabel="brushLabel"
        :brushDomain="brushDomain"
        @onBrushDomainChange="onBrushDomainChangeEnded"
        :zoomLevels="zoomLevels"
        :title="chartTitle"
        :ticksAtLimit="ticksAtLimit")

        template(slot="header")
          .fs-18.current-price(v-if="price && tokenA && tokenB")
            span.disable Current Price:&nbsp;
            span {{ price }} {{ tokenB.symbol }} per {{ tokenA.symbol }}
        template(#afterZoomIcons)
          slot(name="afterZoomIcons")
</template>

<script>
import { format } from 'd3'

import Chart from './Chart.vue'

import { ZOOM_LEVELS } from './constants'

import { FeeAmount, tickToPrice } from '~/assets/libs/swap-sdk'

export default {
  components: { Chart },
  props: ['tokenA', 'tokenB', 'feeAmount', 'ticksAtLimit', 'price', 'priceLower', 'priceUpper', 'interactive', 'chartTitle'],

  data() {
    return {
      error: false,
      ZOOM_LEVELS,
      FeeAmount,
      width: 400
    }
  },

  watch: {},

  mounted() {
    console.log('LiquidityChartRangeInput loaded: ', { ...this.$props })
    this.init()
    setTimeout(() => {
      this.setWidth()
    }, 100)
  },

  computed: {
    series() {
      // TODO Should be async
      // TODO Do optimisations, can lowerage perfomance due to large number of ticks
      // Try to fetch series if there is a pool
      const { tokenA, tokenB, feeAmount } = this

      const pool = this.$store.getters['amm/pools'].find(p => {
        return (p.tokenA.equals(tokenA) && p.tokenB.equals(tokenB) && p.fee == feeAmount) ||
        (p.tokenA.equals(tokenB) && p.tokenB.equals(tokenA) && p.fee == feeAmount)
      })

      console.log(this.$store.getters['amm/pools'], { pool })

      const series = pool.tickDataProvider.ticks.map(t => {
        return {
          x: Number(tickToPrice(tokenA, tokenB, t.id).toSignificant(2)),
          y: Number(t.liquidityGross.toString())
        }
      })

      console.log({ series })

      return series
    },

    isSorted() {
      return this.tokenA.sortsBefore(this.tokenB)
    },

    isUninitialized() {
      return !this.tokenA || !this.tokenB || (this.series === undefined && !this.isLoading)
    },

    isLoading: () => false,

    zoomLevels() {
      return ZOOM_LEVELS[this.feeAmount || FeeAmount.MEDIUM]
    },

    brushDomain() {
      // Все ок
      const { isSorted, priceLower, priceUpper } = this

      const leftPrice = isSorted ? priceLower : priceUpper?.invert()
      const rightPrice = isSorted ? priceUpper : priceLower?.invert()

      return leftPrice && rightPrice
        ? [parseFloat(leftPrice?.toSignificant(6)), parseFloat(rightPrice?.toSignificant(6))]
        : undefined
    }
  },

  methods: {
    setWidth() {
      const w = (this.$refs.chartWrapper && this.$refs.chartWrapper.getBoundingClientRect().width) || 400
      console.log(this.$refs)
      this.width = w
    },
    init() {},

    brushLabel(d, x) {
      const { price, ticksAtLimit, isSorted } = this

      if (!price) return ''

      if (d === 'w' && ticksAtLimit[isSorted ? 'LOWER' : 'UPPER']) return '0'
      if (d === 'e' && ticksAtLimit[isSorted ? 'UPPER' : 'LOWER']) return '∞'

      const percent = (x < price ? -1 : 1) * ((Math.max(x, price) - Math.min(x, price)) / price) * 100

      return price ? `${format(Math.abs(percent) > 1 ? '.2~s' : '.2~f')(percent)}%` : ''
    },

    onBrushDomainChangeEnded({ domain, mode }) {
      console.log('onBrushDomainChangeEnded', { domain, mode })
      const { ticksAtLimit, isSorted } = this

      let leftRangeValue = Number(domain[0])
      const rightRangeValue = Number(domain[1])

      if (leftRangeValue <= 0) leftRangeValue = 1 / 10 ** 6

      // Вызывает изначальные занчения для заполнения инпутов
      if (
        (!ticksAtLimit[isSorted ? 'LOWER' : 'UPPER'] || mode === 'handle' || mode === 'reset') &&
        leftRangeValue > 0
      ) {
        this.$emit('onLeftRangeInput', leftRangeValue.toFixed(6))
      }

      if ((!ticksAtLimit[isSorted ? 'UPPER' : 'LOWER'] || mode === 'reset') && rightRangeValue > 0) {
        // todo: remove this check. Upper bound for large numbers
        // sometimes fails to parse to tick.
        if (rightRangeValue < 1e35) {
          this.$emit('onRightRangeInput', rightRangeValue.toFixed(6))
        }
      }
    }
  }
}
</script>

<style scoped>
.chartWrapper {
  position: relative;
  justify-content: center;
  align-content: center;
}
.current-price{
  text-align: center;
}
</style>
