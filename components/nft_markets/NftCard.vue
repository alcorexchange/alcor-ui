<template lang="pug">
nuxt-link(:to='data.to' :exact="false")
  div.image-container
    video(autoplay='' loop='')
      source(:src='imageBackground' type='video/webm')
    .image-title
      p {{ data.title }}
      .d-flex.align-items-center(v-if="data.subTItle")
        img.mr-2(v-if='data.subImage' :src='data.subImage' alt='nft card icon')
        h5.mb-0 {{ data.subTItle }}
</template>

<script>
export default {
  props: ['data'],

  data() {
    return {
      search: '',
      src: this.msg,
      sellOrders: [],
      imageBackground: this.data.img
    }
  }
}
</script>

<style>
video {
  border-radius: 25px;
}

.image-container {
  position: relative;
  border-radius: 24px;
  width: 100%;
  height: 100%;
  background-size: 100% 100%;
}

.image-title {
  color: #FFF;
}

.image-title {
  position: absolute;
  top: 15px;
  left: 30px;
}

.image-title>* {
  margin: 0 !important;
}

.image-title .d-flex>img {
  width: 30px;
  height: 30px;
}

@media only screen and (max-width: 600px) {
  .market-cards .item {
    width: 100%;
  }
}
</style>
