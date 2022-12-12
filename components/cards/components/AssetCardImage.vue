<template lang="pug">
img.content(v-if="template.img" :src="src")
video.content(v-else-if="template.video" autoplay='true', loop='true')
  source(:src="src" type='video/mp4')
img(v-else src="~/assets/images/nft-mock.png" :style="{ 'max-width': '100%' }")

</template>

<script>
export default {
  props: ['template'],
  computed: {
    src() {
      return this.template.img
        ? this.template.img.includes('https://')
          ? this.template.img
          : `https://images.hive.blog/0x0/https://ipfs.io/ipfs/${this.template.img}`
        : this.template.video
          ? this.template.video.includes('https://')
            ? this.template.video
            : `https://resizer.atomichub.io/videos/v1/preview?ipfs=${this.template.video}&size=370&output=mp4`
          : null
    }
  }
}
</script>

<style lang="scss" scoped>
.content {
  width: 100%;
  height: 230px;
  object-fit: contain;
}
</style>
