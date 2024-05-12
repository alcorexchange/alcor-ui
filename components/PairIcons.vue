<template lang="pug">
.pair-icons(:style="`min-width: ${size}px; height: ${size}px; --offset: ${offset}`" :class="direction")
  TokenInfoImage(:symbol="token1.symbol || token1.currency" :contract="token1.contract" :height="size" :width="size" :disabled="infoDisabled").pair-icon.icon-1
  TokenInfoImage(:symbol="token2.symbol || token2.currency" :contract="token2.contract" :height="size" :width="size" :disabled="infoDisabled").pair-icon.icon-2
</template>

<script>
import TokenImage from '~/components/elements/TokenImage'
import TokenInfoImage from '~/components/elements/TokenInfoImage'
export default {
  name: 'PairIcons',
  components: { TokenImage, TokenInfoImage },
  props: {
    token1: {},
    token2: {},
    direction: {
      default: '',
      type: String,
    },
    size: {
      type: String,
      default: '25',
    },
    offset: {
      type: String,
      default: '25%',
    },
    infoDisabled: {
      type: Boolean,
      default: false,
    },
  },
}
</script>

<style scoped lang="scss">
.pair-icons {
  position: relative;
  .pair-icon {
    position: absolute;
    object-fit: cover;
    border-radius: 50%;
  }
  .icon-1 {
    bottom: var(--offset);
    right: var(--offset);
  }
  .icon-2 {
    top: var(--offset);
    left: var(--offset);
  }
  &.row {
    .icon-1 {
      bottom: 0px;
    }
    .icon-2 {
      top: 0px;
    }
  }
}
</style>
