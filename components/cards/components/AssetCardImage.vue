<template lang="pug">
img.content(v-if="template.img" :src="src")
video.content(v-else-if="template.video" autoplay='true', loop='true')
  source(:src="src" type='video/mp4')
img(v-else src="~/assets/images/nft-mock.png" :style="{ 'max-width': '100%' }")

</template>

<script>
export default {
  props: ['template', 'resolution'],
  computed: {
    src() {
      return this.template.img
        ? this.template.img.includes('https://')
          ? this.template.img
          : `https://images.hive.blog/${this.resolutin || '370x370'}/https://ipfs.io/ipfs/${this.template.img}`
        : this.template.video
          ? this.template.video.includes('https://')
            ? this.template.video
            : `https://ipfs.io/ipfs/${this.template.video}`
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
