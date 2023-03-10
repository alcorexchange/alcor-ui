<template lang="pug">
.add-liquidity-chart
  //- slot(
  //-   name="header"
  //-   :svg="$refs.zoomA"
  //-   :xScale="xScale"
  //-   :width="innerWidth"
  //-   :height="height"
  //-   :showResetButton="Boolean(ticksAtLimit.LOWER || ticksAtLimit.UPPER)"
  //-   :zoomLevels="zoomLevels"
  //-   :onZoomUpdate="setZoom"
  //-   :resetBrush="resetBrush"

  .chart-header.d-flex.mb-2
    .fs-18.disable {{ title }}
    .zoom-container
      Zoom(
        name="header"
        @reset="reset"
        @zoomIn="zoomIn"
        @zoomOut="zoomOut"
        :showResetButton="Boolean(ticksAtLimit.LOWER || ticksAtLimit.UPPER)"
      )
      slot(name="afterZoomIcons")

  slot(name="header")


  svg(:width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" style="overflow: visible;")
    defs
      clipPath(:id="`${id}-chart-clip`")
        rect(x="0" y="0" :width="400" :height="height")

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

      rect.ZoomOverlay(:width="innerWidth" :height="height" ref="svg")

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
        :interactive="interactive"
        :brushLabel="brushLabel"
        :brushExtent="brushDomain || xScale.domain()"
        :innerWidth="innerWidth"
        :innerHeight="innerHeight"
        @setBrushExtent="setBrushExtent"
        :westHandleColor="westHandleColor"
        :eastHandleColor="eastHandleColor")

</template>

<script>
import { max, scaleLinear, select, zoom, zoomIdentity } from 'd3'

import Area from './Area.vue'
import AreaLine from './AreaLine.vue'
import AxisBottom from './AxisBottom.vue'
import Brush from './Brush.vue'
import Zoom from './Zoom.vue'

import { data } from './data'

export default {
  components: { Area, AreaLine, AxisBottom, Brush, Zoom },

  props: ['series', 'current', 'ticksAtLimit', 'styles', 'height', 'width', 'margins', 'interactive', 'brushDomain',
    'brushLabel', 'zoomLevels', 'title'],

  data() {
    return {
      id: 'liquidityChartRangeInput',
      data,
      zoom: null,
      zoomBehavior: null,

      westHandleColor: '#1aae80',
      eastHandleColor: '#1873d8',
    }
  },

  watch: {
    brushDomain() {
      if (!this.brushDomain) this.emitDefaultBrush()
    },

    zoomLevels: {
      handler() {
        console.log('zoomLevels changed, reseting')
        this.reset()
      },
      deep: true
    },

    height() { this.reset() },
    width() { this.reset() },
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
    this.reset()
  },

  methods: {
    installZoom() {
      const { svg } = this.$refs

      if (!svg) return

      this.zoomBehavior = zoom()
        .scaleExtent([this.zoomLevels.min, this.zoomLevels.max])
        .extent([
          [0, 0],
          [this.width, this.height],
        ])
        .on('zoom', ({ transform }) => this.zoom = transform)

      select(svg).call(this.zoomBehavior)
    },

    emitDefaultBrush() {
      console.log('emitDefaultBrush()')
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

    zoomIn() {
      const { svg } = this.$refs

      const { zoomBehavior } = this
      svg &&
        zoomBehavior &&
        select(svg).transition().call(zoomBehavior.scaleBy, 2)
    },

    zoomOut() {
      const { svg } = this.$refs
      const { zoomBehavior } = this

      svg &&
        zoomBehavior &&
        select(svg).transition().call(zoomBehavior.scaleBy, 0.5)
    },

    zoomInitial() {
      const { svg } = this.$refs
      const { zoomBehavior } = this
      svg &&
        zoomBehavior &&
        select(svg).transition().call(zoomBehavior.scaleTo, 0.5)
    },

    reset() {
      this.zoom = null
      this.zoomReset()
      this.installZoom()
      this.zoomInitial()
      this.resetBrush()
    },

    zoomReset() {
      const { svg } = this.$refs
      const { zoomBehavior } = this

      svg &&
        zoomBehavior &&
        select(svg)
          .call(zoomBehavior.transform, zoomIdentity.translate(0, 0).scale(1))
          .transition()
          .call(zoomBehavior.scaleTo, 0.5)
    },

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
.zoom-container {
  display: flex;
  gap: 8px;
  align-items: center;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}
</style>
