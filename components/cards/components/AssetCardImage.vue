<template lang="pug">
img.content(v-if="template.img" :src="src")
video.content(v-else autoplay='true', loop='true')
  source(:src="src" type='video/mp4')

</template>

<script>
export default {
  props: ['template'],
  computed: {
    src() {
      return this.template.img
        ? this.template.img.includes('https://')
          ? this.template.img
          : `https://resizer.atomichub.io/images/v1/preview?ipfs=${this.template.img}&size=370`
        : `https://resizer.atomichub.io/videos/v1/preview?ipfs=${this.template.video}&size=370&output=mp4`
    }
  }
}
</script>

<style lang="scss">
.content {
  width: 100%;
  height: 230px;
  object-fit: contain;
}
</style>
