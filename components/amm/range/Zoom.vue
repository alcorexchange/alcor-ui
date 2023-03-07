<template lang="pug">
.Wrapper(count='showResetButton ? 3 : 2')
  template(v-if='showResetButton')
    AlcorButton(@click='reset', iconOnly)
      i.el-icon-refresh-left

  AlcorButton(@click='zoomIn', iconOnly)
    i.el-icon-zoom-in

  AlcorButton(@click='zoomOut', iconOnly)
    i.el-icon-zoom-out
</template>

<script>
import { select, zoom, zoomIdentity } from 'd3'
import AlcorButton from '@/components/AlcorButton'

export default {
  props: [
    'svg',
    'xScale',
    'width',
    'height',
    'showResetButton',
    'zoomLevels',
    'onZoomUpdate',
    'resetBrush'
  ],
  inject: ['setResetZoom'],
  components: {
    AlcorButton,
  },

  data() {
    return {
      zoomBehavior: null,
    }
  },

  watch: {
    height() {
      this.init()
    },

    svg() {
      this.init()
    },

    xScale() {
      this.init()
    },

    with() {
      this.init()
    },

    resetBrush() {
      this.init()
    },

    zoomLevels() {
      this.init()
      this.zoomInitial()
    },

    'zoomLevels.min'() {
      this.init()
    },

    'zoomLevels.max'() {
      this.init()
    },
  },

  mounted() {
    setTimeout(() => {
      this.zoomInitial()
    })
    console.log('zoom init');
  },

  methods: {
    init() {
      // console.log('ZOOM INIT')
      console.log('svg in ZoomInit', this.svg);
      if (!this.svg) return

      this.zoomBehavior = zoom()
        .scaleExtent([this.zoomLevels.min, this.zoomLevels.max])
        .extent([
          [0, 0],
          [this.width, this.height],
        ])
        .on('zoom', ({ transform }) => this.onZoomUpdate(transform)) // this.$emit('onZoomUpdate', transform)

      select(this.svg).call(this.zoomBehavior)
      this.setResetZoom(this.reset)
    },

    zoomIn() {
      const { svg, zoomBehavior } = this
      svg &&
        zoomBehavior &&
        select(this.svg).transition().call(zoomBehavior.scaleBy, 2)
    },

    zoomOut() {
      const { svg, zoomBehavior } = this

      svg &&
        zoomBehavior &&
        select(svg).transition().call(zoomBehavior.scaleBy, 0.5)
    },

    zoomInitial() {
      const { svg, zoomBehavior } = this
      svg &&
        zoomBehavior &&
        select(svg).transition().call(zoomBehavior.scaleTo, 0.5)
    },

    reset(){
      this.zoomReset()
      this.resetBrush()
    },
    zoomReset() {
      const { svg, zoomBehavior } = this
      svg &&
        zoomBehavior &&
        select(svg)
          .call(zoomBehavior.transform, zoomIdentity.translate(0, 0).scale(1))
          .transition()
          .call(zoomBehavior.scaleTo, 0.5)
    },
  },
}
</script>

<style lang="scss">
.Wrapper {
  display: flex;
  //grid-template-columns: repeat(${({ count }) => count.toString()}, 1fr); // TODO
  gap: 6px;
  .alcor-button {
    padding: 0;
    &:hover {
      background-color: red;
      color: white;
    }
    border-radius: 50% !important;
  }
}

.ZoomOverlay {
  fill: transparent;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}
</style>
