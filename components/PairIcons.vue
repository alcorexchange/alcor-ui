<template lang="pug">
.pair-icons
    TokenImage(:src="icon1" height="15").icon.icon-1
    TokenImage(:src="icon2" height="15").icon.icon-2
</template>

<script>
import TokenImage from '~/components/elements/TokenImage'
export default {
  name: 'PairIcons',
  components: { TokenImage },
  props: ['icon1', 'icon2']
}
</script>

<style scoped lang="scss">
.pair-icons {
  position: relative;
  display: flex;
  height: 40px;
  width: 40px;
  .icon {
    position: absolute;
    width: 25px;
    height: 25px;
    object-fit: cover;
    border-radius: 50%;
  }
  .icon-1 {
    top: 0;
    left: 0;
  }
  .icon-2 {
    bottom: 0;
    right: 0;
  }
}
</style>
