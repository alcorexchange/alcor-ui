<template lang="pug">
.Wrapper(count='showResetButton ? 3 : 2')
  //template(v-if='showResetButton') 
  // BETTER ALWAYS TRUE FOR NOW
  template(v-if='true')
    AlcorButton(@click="$emit('reset')", iconOnly)
      i.el-icon-refresh-left

  AlcorButton(@click="$emit('zoomIn')", iconOnly)
    i.el-icon-zoom-in

  AlcorButton(@click="$emit('zoomOut')", iconOnly)
    i.el-icon-zoom-out
</template>

<script>
import AlcorButton from '@/components/AlcorButton'

export default {
  props: ['showResetButton'],

  components: {
    AlcorButton,
  }
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
