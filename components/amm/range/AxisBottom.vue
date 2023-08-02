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

  watch: {
    xScale() {
      this.generate()
    },

    offset() {
      this.generate()
    },

    innerHeight() {
      this.generate()
    }
  },

  mounted() {
    this.generate()
  },

  methods: {
    generate() {
      const axis = select(this.$refs.axis)
      axis
        .call(axisBottom(this.xScale).ticks(6))
        .call((g) => g.select('.domain').remove())

      // delete prev svgs (beause of calling multiple times)
      // axis.selectAll('svg').remove()
      // create chevron svg
      // const iconContainer = axis.append('svg').attr('dy', '1em').attr('fill', 'var(--text-disable)')
      // append icon paths
      // iconContainer.append('path').attr('d', 'm12.707 7.707-1.414-1.414L5.586 12l5.707 5.707 1.414-1.414L8.414 12z')
      // iconContainer.append('path').attr('d', 'M16.293 6.293 10.586 12l5.707 5.707 1.414-1.414L13.414 12l4.293-4.293z')
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
