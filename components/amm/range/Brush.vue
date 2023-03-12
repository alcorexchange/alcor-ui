<template lang="pug">
g
  g(ref="brush"
    :clip-path="`url(#${id}-brush-clip)`"
    @mouseover="hovering = true"
    @mouseleave="hovering = false")

  template(v-if="localBrushExtent")
    template(v-if="westHandleInView")
      g(:transform="`translate(${Math.max(0, xScale(localBrushExtent[0]))}, 0), scale(${ flipWestHandle ? '-1' : '1' }, 1)`")
        g
          path.Handle(:stroke="westHandleColor" :fill="westHandleColor" :d="brushHandlePath")
          path.HandleAccent(:d="brushHandleAccentPath")

        g.LabelGroup(v-if="showLabels || hovering" :transform="`translate(50,0), scale(${flipWestHandle ? '1' : '-1'}, 1)`")
          rect.TooltipBackground(y="0" x="-30" height="30" width="60" rx="8")
          text.Tooltip(transform="scale(-1, 1)" y="15" dominant-baseline="middle")
            | {{ brushLabel('w', localBrushExtent[0]) }}

    template(v-if="eastHandleInView")
      g(:transform="`translate(${xScale(localBrushExtent[1])}, 0), scale(${flipEastHandle ? '-1' : '1'}, 1)`")
        g
          path.Handle(:stroke="eastHandleColor" :fill="eastHandleColor" :d="brushHandlePath")
          path.HandleAccent(:d="brushHandleAccentPath")

        g.LabelGroup(v-if="showLabels || hovering" :transform="`translate(50,0), scale(${flipEastHandle ? '-1' : '1'}, 1)`")
          rect.TooltipBackground(y="0" x="-30" height="30" width="60" rx="8")
          text.Tooltip(y="15" dominant-baseline="middle")
            | {{ brushLabel('e', localBrushExtent[1]) }}

    template(v-if="showWestArrow")
        polygon(
          points="0 0, 10 10, 0 10"
          transform="translate(20, 10) rotate(45)"
          :fill="westHandleColor"
          :stroke="westHandleColor"
          stroke-width="4"
          stroke-linejoin="round")

    template(v-if="showEastArrow")
      g(:transform="`translate(${innerWidth}, 0) scale(-1, 1)`")
        polygon(
          points="0 0, 10 10, 0 10"
          transform="translate(20, 10) rotate(45)"
          :fill="eastHandleColor"
          :stroke="eastHandleColor"
          stroke-width="4"
          stroke-linejoin="round")
</template>

<script>
import { brushX, select } from 'd3'

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
  props: ['id', 'xScale', 'interactive', 'brushLabel', 'brushExtent', 'innerWidth', 'innerHeight',
    'westHandleColor', 'eastHandleColor'],

  data() {
    return {
      brushBehavior: null,
      localBrushExtent: null,
      showLabels: null,
      hovering: null
    }
  },

  computed: {
    brushHandleAccentPath() {
      return this.interactive ? [
        'm 5 7', // move to first accent
        'v 14', // vertical line
        'M 0 0', // move to origin
        'm 9 7', // move to second accent
        'v 14', // vertical line
        'z'
      ].join(' ') : ''
    },

    brushHandlePath() {
      const { innerHeight } = this

      const line = [
        'M 0 0', // move to origin
        `v ${innerHeight}`, // vertical line
        'm 1 0', // move 1px to the right
        'V 0', // second vertical line
        'M 0 1', // move to origin
      ]

      const head = [
        // head
        'h 12', // horizontal line
        'q 2 0, 2 2', // rounded corner
        'v 22', // vertical line
        'q 0 2 -2 2', // rounded corner
        'h -12', // horizontal line
        'z' // close path
      ]

      return (this.interactive ? [...line, ...head] : line).join(' ')
    },

    flipWestHandle() {
      return this.localBrushExtent && this.xScale(this.localBrushExtent[0]) > FLIP_HANDLE_THRESHOLD_PX
    },

    flipEastHandle() {
      return this.localBrushExtent && this.xScale(this.localBrushExtent[1]) > this.innerWidth - FLIP_HANDLE_THRESHOLD_PX
    },

    showWestArrow() {
      return this.localBrushExtent && (this.xScale(this.localBrushExtent[0]) < 0 || this.xScale(this.localBrushExtent[1]) < 0)
    },

    showEastArrow() {
      return this.localBrushExtent && (this.xScale(this.localBrushExtent[0]) > innerWidth ||
        this.xScale(this.localBrushExtent[1]) > this.innerWidth)
    },

    westHandleInView() {
      return this.localBrushExtent && this.xScale(this.localBrushExtent[0]) >= 0 &&
        this.xScale(this.localBrushExtent[0]) <= this.innerWidth
    },

    eastHandleInView() {
      return this.localBrushExtent && this.xScale(this.localBrushExtent[1]) >= 0 &&
        this.xScale(this.localBrushExtent[1]) <= this.innerWidth
    }
  },

  watch: {
    brushExtent([x, y]) {
      this.moveBrush(this.brushExtent)
      this.localBrushExtent = this.brushExtent
    },

    localBrushExtent(a, b) {
      if (a && b && !compare(a, b, this.xScale)) {
        this.showLabels = true
        setTimeout(() => this.showLabels = false, 1500)
      }
    },

    xScale() {
      this.moveBrush(this.brushExtent)
    }
  },

  mounted() {
    this.localBrushExtent = this.brushExtent
    this.init()
  },

  methods: {
    init() {
      // console.log('BRUSH INIT')
      this.brushBehavior = brushX()
        .extent([
          [Math.max(0 + BRUSH_EXTENT_MARGIN_PX, this.xScale(0)), 0],
          [this.innerWidth - BRUSH_EXTENT_MARGIN_PX, this.innerHeight]
        ])

        .handleSize(30)
        .filter(() => this.interactive)
        .on('brush end', this.brushed)

      this.brushBehavior(select(this.$refs.brush))

      // brush linear gradient
      select(this.$refs.brush)
        .selectAll('.selection')
        .attr('stroke', 'none')
        .attr('fill-opacity', '0.1')
        .attr('fill', `url(#${this.id}-gradient-selection)`)

      // Set previouse range (from loacal storage)
      if (this.previousBrushExtent && compare(this.brushExtent, this.previousBrushExtent, this.xScale)) {
        // FIXME never happens
        //select(this.$refs.brush)
        //  .transition()
        //  .call(this.brushBehavior.move, this.brushExtent.map(this.xScale))

        this.moveBrush(this.brushExtent)
      } else {
        this.moveBrush(this.brushExtent)
      }
    },

    moveBrush(extent) {
      // console.log('MOVE BRUSH', extent, extent.map(this.xScale))
      this.brushBehavior.move(select(this.$refs.brush), extent.map(this.xScale))
    },

    brushed(event) {
      const { type, selection, mode } = event
      //console.log('BRUSHED', selection, mode)

      if (!selection) {
        this.localBrushExtent = null
        return
      }

      //console.log('before scaled', selection)
      const scaled = (selection).map(this.xScale.invert)
      //console.log('after scaled', scaled)

      // avoid infinite render loop by checking for change
      if (type === 'end' && !compare(this.brushExtent, scaled, this.xScale)) {
        this.$emit('setBrushExtent', { domain: scaled, mode })
      }

      this.localBrushExtent = scaled
    }
  }
}
</script>

<style lang="scss" scoped>
.Handle {
  cursor: ew-resize;
  pointer-events: none;
  stroke-width: 2;
}

.HandleAccent {
  cursor: ew-resize;
  pointer-events: none;

  stroke-width: 1.5;
  stroke: black;
  opacity: 0.5;
}

.LabelGroup {
  opacity: 1;
  transition: opacity 300ms;
}

.TooltipBackground {
  fill: transparent;
}

.Tooltip {
  text-anchor: middle;
  font-size: 13px;
  fill: white;
}
</style>
