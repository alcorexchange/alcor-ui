<template lang="pug">
g(ref="brush"
  :clipPath="`url(#${id}-brush-clip)`"
  @click="brushOnClick"
  @mouseleave="brushOnMouseLeave")

  //template(v-if="localBrushExtent")
    template(v-if="westHandleInView")
      g(:transform="`translate(${Math.max(0, xScale(localBrushExtent[0]))}, 0), scale(${ flipWestHandle ? '-1' : '1' }, 1)`")

        g
          path.Handle(:color="westHandleColor" :d="brushHandlePath(innerHeight)"
          path.HandleAccent(:d="brushHandleAccentPath")

        g.LabelGroup(v-if="showLabels || hovering" :transform="`translate(50,0), scale(${flipWestHandle ? '1' : '-1'}, 1)`")
          rect.TooltipBackground(y="0" x="-30" height="30" width="60" rx="8")
          text.Tooltip(transform="scale(-1, 1)" y="15" dominantBaseline="middle")
          | {{ {brushLabelValue('w', localBrushExtent[0])} }}

    //template(v-if="eastHandleInView")
      g(transform="`translate(${xScale(localBrushExtent[1])}, 0), scale(${flipEastHandle ? '-1' : '1'}, 1)`")
        g
          path.Handle(:color="eastHandleColor" :d="brushHandlePath(innerHeight)")
          path.HandleAccent :d="brushHandleAccentPath()"

        g.LabelGroup(v-if="showLabels || hovering" :transform="`translate(50,0), scale(${flipEastHandle ? '-1' : '1'}, 1)`")
          rect.TooltipBackground(y="0" x="-30" height="30" width="60" rx="8")
          text.Tooltip(y="15" dominantBaseline="middle")
            | {{ brushLabelValue('e', localBrushExtent[1]) }}

    // TODO SVG
    //{showWestArrow && <OffScreenHandle color={westHandleColor} />}

    //{showEastArrow && (
    //  <g transform={`translate(${innerWidth}, 0) scale(-1, 1)`}>
    //    <OffScreenHandle color={eastHandleColor} />
    //  </g>


</template>


<script>
import { BrushBehavior, brushX, D3BrushEvent, ScaleLinear, select } from 'd3'

const FLIP_HANDLE_THRESHOLD_PX = 20
const BRUSH_EXTENT_MARGIN_PX = 2

/**
 * Returns true if every element in `a` maps to the
 * same pixel coordinate as elements in `b`
 */
const compare = (a, b, xScale) => {
  // normalize pixels to 1 decimals
  const aNorm = a.map((x) => xScale(x).toFixed(1))
  const bNorm = b.map((x) => xScale(x).toFixed(1))
  return aNorm.every((v, i) => v === bNorm[i])
}



export default {
  props: ['id', 'xScale', 'interactive', 'brushLabelValue', 'brushExtent', 'innerWidth', 'innerHeight'],

  data() {
    return {
      brushBehavior: null,
      localBrushExtent: null
    }
  },

  computed: {
    flipWestHandle() {
      //localBrushExtent && xScale(localBrushExtent[0]) > FLIP_HANDLE_THRESHOLD_PX
      return null
    },

    flipEastHandle() {
      //localBrushExtent && xScale(localBrushExtent[1]) > innerWidth - FLIP_HANDLE_THRESHOLD_PX
      return null
    },

    showWestArrow() {
      //const showWestArrow = localBrushExtent && (xScale(localBrushExtent[0]) < 0 || xScale(localBrushExtent[1]) < 0)
      return null
    },

    showEastArrow() {
    //const showEastArrow =
      //localBrushExtent && (xScale(localBrushExtent[0]) > innerWidth || xScale(localBrushExtent[1]) > innerWidth)
      return null
    },

    westHandleInView() {
      //localBrushExtent && xScale(localBrushExtent[0]) >= 0 && xScale(localBrushExtent[0]) <= innerWidth
      return null
    },

    eastHandleInView() {
      //localBrushExtent && xScale(localBrushExtent[1]) >= 0 && xScale(localBrushExtent[1]) <= innerWidth
      return null
    }
  },

  mounted() {
    this.localBrushExtent = this.brushExtent

    this.init()

    if (this.previousBrushExtent && compare(this.brushExtent, this.previousBrushExtent, this.xScale)) {
      select(this.$refs.brush)
        .transition()
        .call(this.brushBehavior.move, this.brushExtent.map(this.xScale))
    } else {
      this.moveBrush(this.brushExtent)
    }
  },

  watch: {
    brushExtent: () => {
      this.moveBrush(this.brushExtent)
      this.localBrushExtent = this.brushExtent
    },

    xScale: () => this.moveBrush(this.brushExtent)
  },

  methods: {
    init() {
      //if (!brushRef.current) return
      console.log('init!')

      this.brushBehavior = brushX()
        .extent([
          [Math.max(0 + BRUSH_EXTENT_MARGIN_PX, this.xScale(0)), 0],
          [this.innerWidth - BRUSH_EXTENT_MARGIN_PX, this.innerHeight]
        ])

        .handleSize(30)
        .filter(() => this.interactive)
        .on('brush end', this.brushed)

      this.brushBehavior(select(this.$refs.brush))

      console.log(this.brushExtent, this.previousBrushExtent, this.xScale)

      // Set previouse range (from loacal storage)
      if (this.previousBrushExtent && compare(this.brushExtent, this.previousBrushExtent, this.xScale)) {
        select(this.$refs.brush)
          .transition()
          .call(this.brushBehavior.move, this.brushExtent.map(this.xScale))
      }

      // brush linear gradient
      select(this.$refs.brush)
        .selectAll('.selection')
        .attr('stroke', 'none')
        .attr('fill-opacity', '0.1')
        .attr('fill', `url(#${this.id}-gradient-selection)`)
    },

    moveBrush(extent) {
      console.log('moveBrush!')
      this.brushBehavior.move(select(this.$refs.brush), extent.map(this.xScale))
    },

    brushed(event) {
      const { type, selection, mode } = event

      if (!selection) {
        this.localBrushExtent = null
        return
      }

      const scaled = (selection).map(this.xScale.invert)

      // avoid infinite render loop by checking for change
      if (type === 'end' && !compare(this.brushExtent, scaled, this.xScale)) {
        this.$emit('setBrushExtent', { scaled, mode })
      }

      this.localBrushExtent = scaled
    },

    brushOnClick() {

    },

    brushOnMouseLeave() {

    }
  }
}
</script>

<style lang="scss">
.Handle {
  cursor: ew-resize;
  pointer-events: none;

  stroke-width: 3;
  stroke: red;
  fill: green;
}

.HandleAccent {
  cursor: ew-resize;
  pointer-events: none;

  stroke-width: 1.5;
  //stroke: ${({ theme }) => theme.white};
  stroke: red;
  opacity: 0.5;
}

.LabelGroup {
  opacity: 1;
  transition: opacity 300ms;
}

.TooltipBackground {
  fill: white;
}

.Tooltip {
  text-anchor: middle;
  font-size: 13px;
  fill: white;
}
</style>
