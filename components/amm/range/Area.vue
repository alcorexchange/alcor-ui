<template lang="pug">
path(:fill="fill" :d="d")


</template>

<script>
import { area, curveStepAfter } from 'd3'

import { data } from './data'

export default {
  props: ['fill', 'series', 'xScale', 'yScale', 'xAccessor', 'yAccessor'],

  data() {
    return {
      data
    }
  },

  computed: {
    d() {
      const { xAccessor, yAccessor, xScale, yScale, series } = this

      return area()
        .curve(curveStepAfter)
        .x((d) => xScale(xAccessor(d)))
        .y1((d) => yScale(yAccessor(d)))
        .y0(yScale(0))(
          series.filter((d) => {
            const value = xScale(xAccessor(d))
            return value > 0 && value <= window.innerWidth
          }))
    }
  },

  mounted() {
    this.init()
  },

  methods: {
    init() {
      //setTimeout(() => {
      //  console.log(this.d)
      //}, 1000)
    }
  }
}
</script>

<style lang="scss" scoped>
// TODO fill
path {
  opacity: 0.5;
  stroke: red;
  fill: green;
}
</style>
