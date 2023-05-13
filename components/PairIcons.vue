<template lang="pug">
.pair-icons(:style="`width: ${size}px; height: ${size}px;`" :class="direction")
  TokenImage(:src="$tokenLogo(token1.symbol || token1.currency, token1.contract)" :height="size" :with="size").icon.icon-1
  TokenImage(:src="$tokenLogo(token2.symbol || token2.currency, token2.contract)" :height="size" :with="size").icon.icon-2
</template>

<script>
import TokenImage from '~/components/elements/TokenImage'
export default {
  name: 'PairIcons',
  components: { TokenImage },
  props: {
    token1: {},
    token2: {},
    direction: {
      default: '',
      type: String
    },
    size: {
      type: String,
      default: '25'
    }
  }
}
</script>

<style scoped lang="scss">
.pair-icons {
  position: relative;
  .icon {
    position: absolute;
    object-fit: cover;
    border-radius: 50%;
  }
  .icon-1 {
    bottom: 25%;
    right: 25%;
  }
  .icon-2 {
    top: 25%;
    left: 25%;
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
