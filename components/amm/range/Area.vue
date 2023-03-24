<template lang="pug">
path(:fill="fill" :d="d")


</template>

<script>
import { area, curveStepAfter } from 'd3'

export default {
  props: ['fill', 'series', 'xScale', 'yScale'],

  computed: {
    d() {
      const { xScale, yScale, series } = this

      console.log({ series })
      return area()
        .curve(curveStepAfter)
        .x((d) => xScale(d.x))
        .y1((d) => yScale(d.y))
        .y0(yScale(0))(
          series.filter((d) => {
            const value = xScale(d.x)
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
  stroke: transparent;
  fill: #64D2FF;
}
</style>
