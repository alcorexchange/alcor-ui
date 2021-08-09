<template lang="pug">
    .nft-card.alcor-card
      .type
        .icon
        .type-name.cancel eosnfttoken
      .image
        img(src="@/assets/images/_remove_nft.png")
      .details
        .left
          h3.name Future
          .item
            span.key.cancel Artist:&nbsp;
            span.value BagleBoi
          .item
            span.key.cancel Created:&nbsp;
            span.value 01, December 2020
          AlcorLink Details
        .right
          .item
            span.key.cancel Purchase price
            span.value 1400 WAX
            span.footer.cancel (400$)
          .item
            span.key.cancel Last price
            span.value 160000 WAX
            span.footer.cancel (6000$)
</template>

<script>
import AlcorLink from '@/components/AlcorLink.vue'
export default {
  name: 'NFTCard',
  components: {
    AlcorLink
  }
}
</script>

<style scoped lang="scss">
$space: 8px;
$fontSize: 0.72rem;
.nft-card {
  width: 100%;
  // max-width: 280px;
  border-radius: 20px;
}
.type {
  display: flex;
  flex-direction: column;
}
.image {
  width: 166px;
  height: auto;
  margin: auto;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
.details {
  display: flex;
  .left {
    width: 60%;
    .value {
      font-size: $fontSize;
    }
    h3 {
      font-size: 1.1rem;
    }
    .item {
      margin-bottom: 4px;
      // display: flex;
    }
    .alcor-button {
      margin-top: $space;
      border-radius: 10px;
      padding: 8px 24px !important;
    }
  }
  .right {
    width: 40%;
    .item {
      display: flex;
      flex-direction: column;
      margin-bottom: $space;
      .footer {
        font-size: $fontSize;
      }
    }
  }
  .key {
    font-size: $fontSize;
  }
}
</style>
