<template lang="pug">
client-only
  .div
    p.infoBox(v-if="isUninitialized") Your position will appear here.
    p.infoBox(v-if="isLoading") Loading
    p.infoBox(v-if="error") Liquidity data not available.

    .chartWrapper
      Chart(
        :current="current"
        :series="series"
        :width="400"
        :height="200"
        :margins="{ top: 10, right: 2, bottom: 20, left: 0 }"
        :interactive="true"
        :brushLabel="brushLabel"
        :brushDomain="brushDomain"
        @onBrushDomainChange="onBrushDomainChangeEnded"
        :zoomLevels="zoomLevels"
        :ticksAtLimit="ticksAtLimit")
</template>

<script>
import { format } from 'd3'

import Chart from './Chart.vue'

import { data } from './data'
import { ZOOM_LEVELS } from './constants'

import { FeeAmount } from '~/assets/libs/swap-sdk'

export default {
  components: { Chart },
  props: ['currencyA', 'currencyB', 'feeAmount', 'ticksAtLimit', 'price', 'priceLower', 'priceUpper', 'interactive'],

  data() {
    return {
      data,
      error: false,
      ZOOM_LEVELS,
      FeeAmount
    }
  },

  watch: {
    currencyA() {
      console.log('currencyA changed')
      const { current, zoomLevels } = this

      this.onBrushDomainChangeEnded({
        domain: [current * zoomLevels.initialMin, current * zoomLevels.initialMax],
        mode: 'reset'
      })
    },

    currencyB() {
      console.log('currencyB changed')

      const { current, zoomLevels } = this

      this.onBrushDomainChangeEnded({
        domain: [current * zoomLevels.initialMin, current * zoomLevels.initialMax],
        mode: 'reset'
      })
    }
  },

  mounted() {
    console.log('LiquidityChartRangeInput loaded: ', { ...this.$props })
    this.init()
  },

  computed: {
    isUninitialized() {
      return !this.currencyA || !this.currencyB || (this.series === undefined && !this.isLoading)
    },

    isLoading: () => false,

    zoomLevels() {
      return ZOOM_LEVELS[this.feeAmount || FeeAmount.MEDIUM]
    },

    current() {
      return this.price
    },

    series() {
      //return this.data
      return []
    },

    isSorted() {
      return this.currencyA && this.currencyB && this.currencyA.sortsBefore(this.currencyB)
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
</style>
