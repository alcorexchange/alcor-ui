<template lang="pug">
g(:transform="`translate(0, ${innerHeight + offset})`" ref="axis")
</template>

<script>
import { axisBottom, select } from 'd3'

import { data } from './data'

export default {
  props: ['xScale', 'offset', 'innerHeight'],

  data() {
    return {
      data
    }
  },

  mounted() {
    const axis = select(this.$refs.axis)

    axis
      .call(axisBottom(this.xScale).ticks(6))
      .call((g) => g.select('.domain').remove())
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
g {
  line {
    display: none;
  }

  text {
    //color: ${({ theme }) => theme.textSecondary}; TODO
    color: white;
    transform: translateY(5px);
  }
}
</style>
