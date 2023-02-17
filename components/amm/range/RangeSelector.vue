<template lang="pug">
client-only
  .div
    el-button(primary @click="init") Update

    hr

    p.infoBox(v-if="isUninitialized") Your position will appear here.
    p.infoBox(v-if="isLoading") Loading
    p.infoBox(v-if="error") Liquidity data not available.

    .chartWrapper
      RangeChart(
        :current="current"
        :series="series"
        width="400"
        height="200"
        :margins="{ top: 10, right: 2, bottom: 20, left: 0 }"
        :interactive="true"
        brushLabels="brush lable"
        :brushDomain="brushDomain"
        @onBrushDomainChange="onBrushDomainChangeEnded"
        :zoomLevels="ZOOM_LEVELS[feeAmount || 5000]"
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
      ZOOM_LEVELS
    }
  },

  mounted() {
    this.init()
  },

  computed: {
    //TODO
    //isUninitialized: () => !this.currencyA || !this.currencyB || (this.formattedData === undefined && !this.isLoading),
    isUninitialized: () => true,
    isLoading: () => true,

    current() {
      // TODO
      return 23442.32
    },

    series() {
      return this.data
    },

    brushDomain() {
      return [4000, 6000]
    },

    // Позиция ренжа на графике
    //brushDomain() {
    //  const leftPrice = isSorted ? priceLower : priceUpper?.invert()
    //  const rightPrice = isSorted ? priceUpper : priceLower?.invert()

    //  return leftPrice && rightPrice
    //    ? [parseFloat(leftPrice?.toSignificant(6)), parseFloat(rightPrice?.toSignificant(6))]
    //    : undefined
    //},

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

    onBrushDomainChangeEnded(domain, mode) {
      let leftRangeValue = Number(domain[0])
      const rightRangeValue = Number(domain[1])

      if (leftRangeValue <= 0) {
        leftRangeValue = 1 / 10 ** 6
      }

      // TODO Emit ont range change
      //  if (
      //    (!ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER] || mode === 'handle' || mode === 'reset') &&
      //    leftRangeValue > 0
      //  ) {
      //    onLeftRangeInput(leftRangeValue.toFixed(6))
      //  }

      //  if ((!ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER] || mode === 'reset') && rightRangeValue > 0) {
      //    // todo: remove this check. Upper bound for large numbers
      //    // sometimes fails to parse to tick.
      //    if (rightRangeValue < 1e35) {
      //      onRightRangeInput(rightRangeValue.toFixed(6))
      //    }
      //  }
    }
  }
}
</script>

<style>
.chartWrapper {
  position: relative;

  justify-content: center;
  align-content: center;
}
</style>
