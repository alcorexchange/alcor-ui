<template lang="pug">
client-only
  .div
    p.infoBox(v-if="isUninitialized") Your position will appear here.
    p.infoBox(v-if="isLoading") Loading
    p.infoBox(v-if="error") Liquidity data not available.

    .chartWrapper
      RangeChart(
        :current="current"
        :series="series"
        :width="400"
        :height="200"
        :margins="{ top: 10, right: 2, bottom: 20, left: 0 }"
        :interactive="true"
        brushLabels="brush lable"
        :brushDomain="brushDomain"
        @onBrushDomainChange="onBrushDomainChangeEnded"
        :zoomLevels="ZOOM_LEVELS[feeAmount]"
        :ticksAtLimit="ticksAtLimit"
      )
</template>

<script>
//import { brushX, BrushBehavior, select, scaleLinear } from 'd3'

import { Area } from './Area.vue'
import RangeChart from './RangeChart.vue'

import { data } from './data'
import { ZOOM_LEVELS } from './constants'

export default {
  components: { RangeChart },
  props: ['currencyA', 'currencyB', 'feeAmount', 'ticksAtLimit', 'price', 'priceLower', 'priceUpper', 'interactive'],

  data() {
    return {
      data,
      error: false,
      ZOOM_LEVELS,
    }
  },

  mounted() {
    console.log('LiquidityChartRangeInput loaded: ', { ...this.$props })
    this.init()
  },

  computed: {
    //TODO
    //isUninitialized: () => !this.currencyA || !this.currencyB || (this.formattedData === undefined && !this.isLoading),
    isUninitialized: () => false,
    isLoading: () => false,

    current() {
      return this.price
    },

    series() {
      //return this.data
      return []
    },

    //isSorted: () => this.currencyA && this.currencyB && this.currencyA.sortsBefore(this.currencyB),
    isSorted: () => true,

    brushDomain() {
      // Все ок
      const { isSorted, priceLower, priceUpper } = this

      const leftPrice = isSorted ? priceLower : priceUpper?.invert()
      const rightPrice = isSorted ? priceUpper : priceLower?.invert()

      return leftPrice && rightPrice
        ? [parseFloat(leftPrice?.toSignificant(6)), parseFloat(rightPrice?.toSignificant(6))]
        : undefined
    },

    // TODO Лейбл сколько в процентах
    //brushLabelValue(d, x) {
    //  if (!this.price) return ''

    //  if (d === 'w' && ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER]) return '0'
    //  if (d === 'e' && ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER]) return '∞'

    //  const percent = (x < price ? -1 : 1) * ((Math.max(x, price) - Math.min(x, price)) / price) * 100

    //  return price ? `${format(Math.abs(percent) > 1 ? '.2~s' : '.2~f')(percent)}%` : ''
    //}
  },

  methods: {
    init() {},

    onBrushDomainChangeEnded(data) {
      console.log('zz', { data })
      const { domain, mode } = data
      const { ticksAtLimit, isSorted } = this

      let leftRangeValue = Number(domain[0])
      const rightRangeValue = Number(domain[1])

      console.log({ leftRangeValue, rightRangeValue })

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

<style>
.chartWrapper {
  height: 400px;
  position: relative;
  justify-content: center;
  align-content: center;
}
</style>
