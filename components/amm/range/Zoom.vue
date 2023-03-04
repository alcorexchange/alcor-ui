<template lang="pug">
.Wrapper(count="showResetButton ? 3 : 2")
  template(v-if="showResetButton")
    button(@click="reset")

      i.el-icon-refresh-left

  button(@click="zoomIn")
    i.el-icon-zoom-in

  button(@click="zoomOut")
    i.el-icon-zoom-in

  button(@click="reset")
    i.el-icon-zoom-in RESET
</template>

<script>
import { select, zoom, zoomIdentity } from 'd3'

export default {
  props: ['svg', 'xScale', 'width', 'height', 'showResetButton', 'zoomLevels', 'reset'],

  data() {
    return {
      zoomBehavior: null
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
    }
  },

  mounted() {
    setTimeout(() => {
      this.zoomInitial()
    })
  },

  methods: {
    init() {
      // console.log('ZOOM INIT')
      if (!this.svg) return

      this.zoomBehavior = zoom()
        .scaleExtent([this.zoomLevels.min, this.zoomLevels.max])
        .extent([
          [0, 0],
          [this.width, this.height]
        ])
        .on('zoom', ({ transform }) => this.$emit('onZoomUpdate', transform))

      select(this.svg).call(this.zoomBehavior)
    },

    zoomIn() {
      const { svg, zoomBehavior } = this

      svg &&
      zoomBehavior &&
      select(this.svg)
        .transition()
        .call(zoomBehavior.scaleBy, 2)
    },

    zoomOut() {
      const { svg, zoomBehavior } = this

      svg &&
      zoomBehavior &&
      select(svg)
        .transition()
        .call(zoomBehavior.scaleBy, 0.5)
    },

    zoomInitial() {
      const { svg, zoomBehavior } = this

      svg &&
      zoomBehavior &&
      select(svg)
        .transition()
        .call(zoomBehavior.scaleTo, 0.5)
    },

    zoomReset() {
      const { svg, zoomBehavior } = this

      svg &&
      zoomBehavior &&
      select(svg)
        .call(zoomBehavior.transform, zoomIdentity.translate(0, 0).scale(1))
        .transition()
        .call(zoomBehavior.scaleTo, 0.5)
    }
  }
}
</script>

<style lang="scss">
.Wrapper {
  display: grid;
  //grid-template-columns: repeat(${({ count }) => count.toString()}, 1fr); // TODO
  grid-gap: 6px;

  position: absolute;
  top: -75px;
  right: 0;
}

.Button {
  &:hover {
    background-color: red;
    color: white;

    //background-color: ${({ theme }) => theme.backgroundInteractive};
    //color: ${({ theme }) => theme.textPrimary};
  }

  width: 32px;
  height: 32px;
  padding: 4px;
}

.ZoomOverlay {
  fill: transparent;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}
</style>
