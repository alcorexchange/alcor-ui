<template lang="pug">
img.content(v-if="template.img" :src="src")
img.content(v-else-if="template.video" :src="src")
img(v-else src="~/assets/images/nft-mock.png" :style="{ 'max-width': '100%' }")

</template>

<script>
export default {
  props: ['template', 'resolution'],
  computed: {
    src() {
      //console.log('rrrrrr', this.template.img, /Qm[1-9A-Za-z]{44}[^OIl]$/.test(this.template.img))

      console.log('rrrrrr', this.template.img, /Qm[a-zA-Z0-9]+$/.test(this.template.img))


      return this.template.img
        ? this.template.img.includes('https://')
          ? `https://resizer.alcor.exchange/?url=${this.template.img}&width=${this.resolution || '300'}`
          : /Qm[a-zA-Z0-9]+$/.test(this.template.img)
            ? `https://resizer.alcor.exchange/ipfs/${this.template.img}`
            : `https://resizer.alcor.exchange/?url=https://cf-ipfs.com/ipfs/${this.template.img}&width=${this.resolution || '300'}`
        : this.template.video
          ? this.template.video.includes('https://')
            ? `https://resizer.alcor.exchange/?url=${this.template.video}&width=${this.resolution || '300'}`
            : /Qm[a-zA-Z0-9]+$/.test(this.template.video)
              ? `https://resizer.alcor.exchange/ipfs/${this.template.video}`
              : `https://resizer.alcor.exchange/?url=https://cf-ipfs.com/ipfs/${this.template.video}`
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
