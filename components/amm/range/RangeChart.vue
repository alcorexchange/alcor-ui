<template lang="pug">
.range_chart
  p zoom

  svg(width="100%" height="100%" :viewBox="`0 0 ${width} ${height}`" style="overflow: 'visible'")
    //defs
      clipPath(id="{`id-chart-clip`}")
        rect(x="0" y="0" :width="innerWidth" :height="height")

      mask(id="{${id}-chart-area-mask`}")
        rect(
          v-if="brushDomain"
          fill="white"
          :x="xScale(brushDomain[0])"
          y="0"
          :width="xScale(brushDomain[1]) - xScale(brushDomain[0])"
          height="innerHeight")

    g(:transform="`translate(${margins.left}, ${margins.top})`")
      g(:clipPath="`url(#${id}-chart-clip)`")
        Area(:series="series" :xScale="xScale" :yScale="yScale" :xAccessor="xAccessor" :yAccessor="yAccessor")

        // duplicate area chart with mask for selected area
      //g(v-if="brushDomain" mask="`url(#${id}-chart-area-mask)`")
        Area(
          series={series}
          xScale={xScale}
          yScale={yScale}
          xValue={xAccessor}
          yValue={yAccessor}
          fill={styles.area.selection}
        )

      //Line(:value="current" :xScale="xScale" :innerHeight="innerHeight")

      //AxisBottom(xScale="xScale" :innerHeight="innerHeight")

    //ZoomOverlay(:width="innerWidth" :height="height" :ref="zoomRef")

    //Brush(
      id={id}
      xScale={xScale}
      interactive={interactive}
      brushLabelValue={brushLabels}
      brushExtent={brushDomain ?? (xScale.domain() as [number, number])}
      innerWidth={innerWidth}
      innerHeight={innerHeight}
      setBrushExtent={onBrushDomainChange}
      westHandleColor={styles.brush.handle.west}
      eastHandleColor={styles.brush.handle.east})

</template>

<script>
import { max, scaleLinear, ZoomTransform } from 'd3'

import Area from './Area.vue'

import { data } from './data'

export default {
  components: { Area },

  props: ['series', 'current', 'ticksAtLimit', 'styles', 'width', 'height', 'margins', 'interactive', 'brushDomain',
    'brushLabels', 'zoomLevels'],

  data() {
    return {
      id: 'liquidityChartRangeInput',
      data,
    }
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

  },

  methods: {
    init() {},

    xAccessor(d) {
      return d.price0
    },

    yAccessor(d) {
      return d.activeLiquidity
    }
  }
}
</script>
