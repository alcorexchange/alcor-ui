<template lang="pug">
line(:x1="xScale(value)" y1="0" :x2="xScale(value)" :y2="innerHeight")

</template>

<script>
import { area, curveStepAfter } from 'd3'

import { data } from './data'

export default {
  props: ['xScale', 'value', 'innerHeight'],

  data() {
    return {
      data
    }
  },

  mounted() {
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
line {
  opacity: 0.5;
  stroke-width: 2;
  //stroke: ${({ theme }) => theme.textPrimary}; // TODO
  stroke: red; // TODO
  fill: none;
}
</style>
