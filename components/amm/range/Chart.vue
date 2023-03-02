<template lang="pug">
.add-liquidity-chart
  //| zoom: {{ zoom }}
  //| zoomRef: {{ $refs.zoomA }}
  Zoom(
    :svg="$refs.zoomA"
    :xScale="xScale"
    :width="innerWidth"
    :height="height"
    :resetBrush="resetBrush"
    :showResetButton="Boolean(ticksAtLimit.LOWER || ticksAtLimit.UPPER)"
    :zoomLevels="zoomLevels"
    @onZoomUpdate="setZoom")

  svg(:width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" style="overflow: visible;")
    defs
      clipPath(:id="`${id}-chart-clip`")
        rect(x="0" y="0" :width="innerWidth" :height="height")

      mask(:id="`${id}-chart-area-mask`")
        rect(
          v-if="brushDomain"
          fill="white"
          :x="xScale(brushDomain[0])"
          y="0"
          :width="xScale(brushDomain[1]) - xScale(brushDomain[0])"
          :height="innerHeight")

    g(:transform="`translate(${margins.left}, ${margins.top})`")
      g(:clip-path="`url(#${id}-chart-clip)`")
        //Area(fill="green" :series="series" :xScale="xScale" :yScale="yScale" :xAccessor="xAccessor" :yAccessor="yAccessor")
        Area(:series="series" :xScale="xScale" :yScale="yScale" :xAccessor="xAccessor" :yAccessor="yAccessor")

        g(v-if="brushDomain" :mask="`url(#${id}-chart-area-mask)`")
          Area(
            :series="series"
            :xScale="xScale"
            :yScale="yScale"
            :xAccessor="xAccessor"
            :yAccessor="yAccessor"
            fill="red"
          )

        AreaLine(:value="current" :xScale="xScale" :innerHeight="innerHeight")

        AxisBottom(:xScale="xScale" :offset="0" :innerHeight="innerHeight")

      rect.ZoomOverlay(:width="innerWidth" :height="height" ref="zoomA")

      defs
        linearGradient(:id="`${id}-gradient-selection`" x1="0%" y1="100%" x2="100%" y2="100%")
          stop(:stop-color="westHandleColor")
          stop(:stop-color="eastHandleColor" offset="1")

        // clips at exactly the svg area
        clipPath(:id="`${id}-brush-clip`")
          rect(x="0" y="0" :width="innerWidth" :height="innerHeight")

      Brush(
        :id="id"
        :xScale="xScale"
        :interactive="true"
        :brushLabel="brushLabel"
        :brushExtent="brushDomain || xScale.domain()"
        :innerWidth="innerWidth"
        :innerHeight="innerHeight"
        @setBrushExtent="setBrushExtent"
        :westHandleColor="westHandleColor"
        :eastHandleColor="eastHandleColor")

</template>

<script>
import { max, scaleLinear } from 'd3'

import Area from './Area.vue'
import AreaLine from './AreaLine.vue'
import AxisBottom from './AxisBottom.vue'
import Brush from './Brush.vue'
import Zoom from './Zoom.vue'

import { data } from './data'

export default {
  components: { Area, AreaLine, AxisBottom, Brush, Zoom },

  props: ['series', 'current', 'ticksAtLimit', 'styles', 'width', 'height', 'margins', 'interactive', 'brushDomain',
    'brushLabel', 'zoomLevels'],

  data() {
    return {
      id: 'liquidityChartRangeInput',
      data,
      zoom: null,

      westHandleColor: '#1aae80',
      eastHandleColor: '#1873d8'
    }
  },

  watch: {
    brushDomain() {
      if (!this.brushDomain) this.emitDefaultBrush()
    },

    zoomLevels() {
      console.log('zoomLevels changed, reseting')
      this.zoom = null
      //this.resetBrush()

      // TODO
      //setZoom(null)
    },
  },

  computed: {
    innerHeight() {
      return this.height - this.margins.top - this.margins.bottom
    },

    innerWidth() {
      return this.width - this.margins.left - this.margins.right
    },

    xScale() {
      const xScale = scaleLinear()
        .domain([this.current * this.zoomLevels.initialMin, this.current * this.zoomLevels.initialMax])
        .range([0, this.innerWidth])

      if (this.zoom) {
        const newXscale = this.zoom.rescaleX(xScale)
        xScale.domain(newXscale.domain())
      }

      return xScale
    },

    yScale() {
      return scaleLinear()
        .domain([0, max(this.data, this.yAccessor)])
        .range([this.innerHeight, 0])
    }
  },

  mounted() {
    console.log('RangeChartMount: ', this.$props, this.brushDomain)
    this.emitDefaultBrush()
  },

  methods: {
    init() {},

    emitDefaultBrush() {
      // console.log('emitDefaultBrush()')
      // if (!this.brushDomain) this.$emit('onBrushDomainChange', { domain: this.xScale.domain(), mode: undefined })
      this.$emit('onBrushDomainChange', { domain: this.xScale.domain(), mode: undefined })
    },

    setBrushExtent(data) {
      this.$emit('onBrushDomainChange', data)
    },

    xAccessor(d) {
      return d.price0
    },

    yAccessor(d) {
      return d.activeLiquidity
    },

    resetBrush() {
      const { current, zoomLevels } = this

      this.$emit('onBrushDomainChange', {
        domain: [current * zoomLevels.initialMin, current * zoomLevels.initialMax],
        mode: 'reset'
      })
    },

    setZoom(zoom) {
      this.zoom = zoom
    }
  }
}
</script>

<style lang="scss" scoped>
rect.ZoomOverlay {
  fill: transparent;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}
</style>
