<template lang="pug">
nuxt-link(:to='data.to' :exact="false")
  .image-container(:style='imageBackground')
    .image-title
      p {{data.title}}
      .d-flex.align-items-center
        img.mr-2(v-if='data.subImage' :src='data.subImage' alt='nft card icon')
        h5.mb-0 {{data.subTItle}}
</template>

<script>
export default {
  props: ['data'],

  data() {
    return {
      search: '',
      src: this.msg,
      sellOrders: [],
      imageBackground: { backgroundImage: 'url(' + this.data.img + ')' },
    }
  },
}
</script>

<style>
.image-container {
  position: relative;
  border-radius: 20px;
  width: 455px;
  height: 200px;
}
.image-title {
  color: #FFF;
}
.image-title {
  position: absolute;
  top: 15px;
  left: 30px;
}
.image-title .d-flex > img {
  width: 30px;
  height: 30px;
}

@media only screen and (max-width: 600px) {
  .market-cards .item {
    width: 100%;
  }
}
</style>
